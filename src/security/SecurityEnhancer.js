/**
 * Security Enhancements for 3xui-api-client
 *
 * Provides:
 * - InputValidator: basic validation/sanitization for URLs, usernames, passwords, and API payloads
 * - SecureHeaders: recommended HTTP headers for axios instance
 * - SecurityMonitor: lightweight in-memory rate limiting and activity log
 * - CredentialSecurity: helpers for safe logging, strength checks, and token generation
 * - ErrorSecurity: safe error logging and sanitization for prod/dev
 */

const crypto = require('crypto');
const { URL } = require('url');

// ------------------------------
// Input validation & sanitization
// ------------------------------
class InputValidator {
    static validateURL(url) {
        if (typeof url !== 'string' || url.trim() === '') {
            throw new Error('Invalid URL: empty');
        }
        const trimmed = url.trim();
        try {
            const u = new URL(trimmed);
            if (!['http:', 'https:'].includes(u.protocol)) {
                throw new Error('Invalid URL: protocol must be http or https');
            }
            // normalize: remove trailing slash
            return trimmed.replace(/\/$/, '');
        } catch {
            throw new Error('Invalid URL format');
        }
    }

    static validateUsername(username) {
        if (typeof username !== 'string' || username.trim() === '') {
            throw new Error('Invalid username: empty');
        }
        const u = username.trim();
        // Allow common admin usernames; restrict control chars
        if (u.length > 100) {
            throw new Error('Invalid username: too long');
        }
        if (/[^\w.@+-]/.test(u)) {
            throw new Error('Invalid username: contains illegal characters');
        }
        return u;
    }

    static validatePassword(password) {
        if (typeof password !== 'string' || password.length === 0) {
            throw new Error('Invalid password: empty');
        }
        // Do not enforce complexity here (handled by CredentialSecurity). Just trim spaces.
        return password;
    }

    static _ensureJSONString(value) {
        if (value === null || value === undefined) {
            return undefined;
        }
        if (typeof value === 'string') {
            return value;
        }
        try {
            return JSON.stringify(value);
        } catch {
            throw new Error('Invalid configuration: unable to serialize to JSON');
        }
    }

    static _validatePort(port) {
        if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
            throw new Error('Invalid port: must be an integer between 1 and 65535');
        }
        return port;
    }

    static validateInboundConfig(config) {
        if (typeof config !== 'object' || config === null) {
            throw new Error('Invalid inbound config');
        }
        const copy = { ...config };
        if (copy.port !== undefined) {
            this._validatePort(copy.port);
        }
        if (copy.protocol && typeof copy.protocol !== 'string') {
            throw new Error('Invalid protocol');
        }
        // 3x-ui expects settings/streamSettings/sniffing/allocate as JSON strings
        if (copy.settings && typeof copy.settings !== 'string') {
            copy.settings = this._ensureJSONString(copy.settings);
        }
        if (copy.streamSettings && typeof copy.streamSettings !== 'string') {
            copy.streamSettings = this._ensureJSONString(copy.streamSettings);
        }
        if (copy.sniffing && typeof copy.sniffing !== 'string') {
            copy.sniffing = this._ensureJSONString(copy.sniffing);
        }
        if (copy.allocate && typeof copy.allocate !== 'string') {
            copy.allocate = this._ensureJSONString(copy.allocate);
        }
        return copy;
    }

    static validateClientConfig(config) {
        if (typeof config !== 'object' || config === null) {
            throw new Error('Invalid client config');
        }
        const copy = { ...config };
        if (typeof copy.id !== 'number' && typeof copy.id !== 'string') {
            throw new Error('Invalid client config: id is required');
        }
        if (copy.settings && typeof copy.settings !== 'string') {
            copy.settings = this._ensureJSONString(copy.settings);
        }
        return copy;
    }
}

// ------------------------------
// Secure headers for axios
// ------------------------------
class SecureHeaders {
    static getSecureHeaders(options = {}) {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'User-Agent': options.userAgent || '3xui-api-client/2.0.0'
        };
        if (options.enableCSP) {
            headers['Content-Security-Policy'] = 'default-src \'none\'';
        }
        return headers;
    }
}

// ------------------------------
// Lightweight security monitor
// ------------------------------
class SecurityMonitor {
    constructor(options = {}) {
        this.maxRequestsPerMinute = options.maxRequestsPerMinute || 60;
        this.maxLoginAttemptsPerHour = options.maxLoginAttemptsPerHour || 10;
        this.requestLog = new Map(); // key -> timestamps array
        this.loginLog = new Map(); // key -> timestamps array
        this.blockedIPs = new Set();
        this.activities = [];
    }

    _prune(log, windowMs) {
        const now = Date.now();
        for (const [key, arr] of log.entries()) {
            const pruned = arr.filter(ts => now - ts <= windowMs);
            if (pruned.length === 0) {
                log.delete(key);
            } else {
                log.set(key, pruned);
            }
        }
    }

    checkRateLimit(identifier, type = 'general') {
        const now = Date.now();
        if (type === 'login') {
            const windowMs = 60 * 60 * 1000; // 1 hour
            const arr = this.loginLog.get(identifier) || [];
            const pruned = arr.filter(ts => now - ts <= windowMs);
            pruned.push(now);
            this.loginLog.set(identifier, pruned);
            this._prune(this.loginLog, windowMs);
            const allowed = pruned.length <= this.maxLoginAttemptsPerHour;
            if (!allowed) {
                this.logSuspiciousActivity('rate_limit_exceeded', { identifier, type });
            }
            return allowed;
        } else {
            const windowMs = 60 * 1000; // 1 minute
            const arr = this.requestLog.get(identifier) || [];
            const pruned = arr.filter(ts => now - ts <= windowMs);
            pruned.push(now);
            this.requestLog.set(identifier, pruned);
            this._prune(this.requestLog, windowMs);
            const allowed = pruned.length <= this.maxRequestsPerMinute;
            if (!allowed) {
                this.logSuspiciousActivity('rate_limit_exceeded', { identifier, type });
            }
            return allowed;
        }
    }

    logSuspiciousActivity(type, details = {}) {
        const event = {
            id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
            type,
            details,
            severity: type.includes('failed') || type.includes('blocked') ? 'high' : 'medium',
            timestamp: Date.now()
        };
        this.activities.push(event);
        // Keep recent 200
        if (this.activities.length > 200) {
            this.activities.shift();
        }
        return event;
    }

    blockIP(ip) {
        this.blockedIPs.add(ip);
    }

    clearBlockedIPs() {
        this.blockedIPs.clear();
    }

    getStats() {
        return {
            blockedIPs: this.blockedIPs.size,
            totalSuspiciousActivities: this.activities.length,
            recentActivities: [...this.activities].slice(-50),
            activeRateLimits: {
                general: [...this.requestLog.entries()].reduce((acc, [, arr]) => acc + arr.length, 0),
                login: [...this.loginLog.entries()].reduce((acc, [, arr]) => acc + arr.length, 0)
            }
        };
    }
}

// ------------------------------
// Credential helpers
// ------------------------------
class CredentialSecurity {
    static hashForLogging(value) {
        try {
            return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
        } catch {
            return 'redacted';
        }
    }

    static validateCredentialStrength(credential, type = 'password') {
        const issues = [];
        let strength = 'weak';

        if (type === 'uuid') {
            const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidV4.test(credential)) {
                issues.push('Invalid UUID v4 format');
            }
            strength = issues.length ? 'weak' : 'strong';
        } else if (type === 'password') {
            if (typeof credential !== 'string' || credential.length < 8) {
                issues.push('Password too short');
            }
            if (!/[a-z]/.test(credential)) {
                issues.push('Add lowercase letters');
            }
            if (!/[A-Z]/.test(credential)) {
                issues.push('Add uppercase letters');
            }
            if (!/[0-9]/.test(credential)) {
                issues.push('Add numbers');
            }
            const hasSymbols = /[^A-Za-z0-9]/.test(credential);
            strength = credential.length >= 12 && /[a-z]/.test(credential) && /[A-Z]/.test(credential) && /[0-9]/.test(credential) && hasSymbols ? 'strong' : (credential.length >= 10 ? 'medium' : 'weak');
        } else if (type === 'port') {
            const n = Number(credential);
            if (!Number.isInteger(n) || n < 1 || n > 65535) {
                issues.push('Port must be 1-65535');
            }
            strength = issues.length ? 'weak' : 'strong';
        }

        return { isValid: issues.length === 0, issues, strength };
    }

    static generateSessionToken(bytes = 32) {
        return crypto.randomBytes(bytes).toString('hex');
    }
}

// ------------------------------
// Error handling and sanitization
// ------------------------------
class ErrorSecurity {
    static sanitizeError(error, isDevelopment = false) {
        const message = error?.message || 'Unknown error';
        if (isDevelopment) {
            return new Error(message);
        }
        // Production: remove stack and internal details
        const sanitized = new Error(message);
        return sanitized;
    }

    static logError(error, context = {}) {
        try {
            const safeContext = { ...context };
            if (safeContext.username) {
                safeContext.username = CredentialSecurity.hashForLogging(safeContext.username);
            }
            if (safeContext.baseURL) {
                safeContext.baseURL = InputValidator.validateURL(String(safeContext.baseURL));
            }
            console.warn('[3xui-api-client] Error:', error?.message || error, safeContext);
        } catch {
            // noop
        }
    }
}

module.exports = {
    InputValidator,
    SecureHeaders,
    SecurityMonitor,
    CredentialSecurity,
    ErrorSecurity
};

