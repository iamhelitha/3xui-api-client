const axios = require('axios');
const CredentialGenerator = require('./src/generators/CredentialGenerator');
const { SessionManager, createSessionManager } = require('./src/session/SessionManager');
const {
    InputValidator,
    SecurityMonitor,
    SecureHeaders,
    CredentialSecurity,
    ErrorSecurity
} = require('./src/security/SecurityEnhancer');

/**
 * 3X-UI API Client Library
 *
 * A Node.js client for managing 3x-ui panel APIs with automatic session management.
 * Now includes credential generation and advanced session management for web applications.
 *
 * @class ThreeXUI
 * @version 2.0.0
 * @author Helitha Guruge
 */
class ThreeXUI {
    /**
     * Creates a new ThreeXUI client instance
     *
     * @param {string} baseURL - The base URL of your 3x-ui server (e.g., 'https://your-server.com')
     * @param {string} username - Admin username for authentication
     * @param {string} password - Admin password for authentication
     * @param {Object} options - Configuration options
     * @param {Object} options.sessionManager - Session management configuration
     * @param {boolean} options.autoGenerateCredentials - Enable automatic credential generation
     * @param {number} options.timeout - Request timeout in milliseconds (default: 30000)
     * @throws {Error} If baseURL, username, or password is missing
     */
    constructor(baseURL, username, password, options = {}) {
        if (!baseURL) {
            throw new Error('baseURL is required');
        }
        if (!username) {
            throw new Error('username is required');
        }
        if (!password) {
            throw new Error('password is required');
        }

        // Apply security validations
        this.baseURL = InputValidator.validateURL(baseURL);
        this.username = InputValidator.validateUsername(username);
        this.password = InputValidator.validatePassword(password);
        this.cookie = null;
        this.options = options;
        this.loginMutex = false; // Add mutex to prevent concurrent logins
        this.loginRetryCount = 0; // Add retry counter
        this.maxLoginRetries = 3; // Maximum login attempts

        // Initialize security monitoring
        this.securityMonitor = new SecurityMonitor({
            maxRequestsPerMinute: options.maxRequestsPerMinute || 60,
            maxLoginAttemptsPerHour: options.maxLoginAttemptsPerHour || 10
        });

        // Security configuration
        this.isDevelopment = options.isDevelopment || process.env.NODE_ENV === 'development';

        // Initialize session manager if provided
        if (options.sessionManager) {
            this.sessionManager = options.sessionManager instanceof SessionManager
                ? options.sessionManager
                : createSessionManager(options.sessionManager);
        } else {
            // Default to memory-based session management
            this.sessionManager = createSessionManager();
        }

        // Create axios instance with security best practices
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: options.timeout || 30000, // 30 second timeout
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 300,
            headers: SecureHeaders.getSecureHeaders({
                userAgent: options.userAgent || '3xui-api-client/2.0.0 (Security-Enhanced)',
                enableCSP: options.enableCSP || false
            })
        });

        // Add request interceptor for security headers
        this.api.interceptors.request.use((config) => {
            // Add security headers
            config.headers['X-Requested-With'] = 'XMLHttpRequest';
            return config;
        });

        // Add response interceptor for error handling
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Request timeout - server took too long to respond');
                }
                if (error.code === 'ENOTFOUND') {
                    throw new Error(`Cannot connect to server: ${this.baseURL}`);
                }
                throw error;
            }
        );
    }

    /**
     * Login with session management support
     * @param {boolean} forceRefresh - Force a new login even if session exists
     * @returns {Object} Login response
     */
    async login(forceRefresh = false) {
        // Check rate limiting first
        const identifier = CredentialSecurity.hashForLogging(this.username);
        if (!this.securityMonitor.checkRateLimit(identifier, 'login')) {
            const error = new Error('Rate limit exceeded for login attempts');
            ErrorSecurity.logError(error, { username: this.username, baseURL: this.baseURL });
            throw error;
        }

        // Increment retry count
        this.loginRetryCount++;
        // Check for existing valid session first
        if (!forceRefresh && this.sessionManager) {
            const existingSession = await this.sessionManager.getSession(this.baseURL, this.username);
            if (existingSession && existingSession.cookie) {
                this.cookie = existingSession.cookie;
                this.api.defaults.headers.Cookie = this.cookie;
                // Reset retry count on successful session restore
                this.loginRetryCount = 0;
                return {
                    success: true,
                    fromCache: true,
                    data: { msg: 'Session restored from cache' }
                };
            }
        }

        try {
            const params = new URLSearchParams();
            params.append('username', this.username);
            params.append('password', this.password);

            const response = await this.api.post('/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data.success) {
                const cookies = response.headers['set-cookie'];
                if (cookies && cookies.length > 0) {
                    this.cookie = cookies[0].split(';')[0];
                    this.api.defaults.headers.Cookie = this.cookie;

                    // Store session if session manager is available
                    if (this.sessionManager) {
                        try {
                            await this.sessionManager.storeSession(this.baseURL, this.username, {
                                cookie: this.cookie,
                                loginTime: new Date().toISOString()
                            });
                        } catch (sessionError) {
                            console.warn('Failed to store session, continuing without cache:', sessionError.message);
                        }
                    }
                    // Reset retry count on successful login
                    this.loginRetryCount = 0;
                } else {
                    throw new Error('Login failed: No session cookie received.');
                }
                return {
                    success: true,
                    fromCache: false,
                    headers: response.headers,
                    data: response.data
                };
            } else {
                throw new Error(`Login failed: ${response.data.msg}`);
            }
        } catch (error) {
            // Log the error securely
            ErrorSecurity.logError(error, {
                username: this.username,
                baseURL: this.baseURL,
                action: 'login'
            });

            // Log suspicious activity for multiple failed logins
            if (this.loginRetryCount >= this.maxLoginRetries) {
                this.securityMonitor.logSuspiciousActivity('multiple_failed_logins', {
                    username: CredentialSecurity.hashForLogging(this.username),
                    attempts: this.loginRetryCount
                });
            }

            // Return sanitized error
            const sanitizedError = ErrorSecurity.sanitizeError(error, this.isDevelopment);
            throw sanitizedError;
        }
    }

    /**
     * Logout and clear session
     */
    async logout() {
        this.cookie = null;
        delete this.api.defaults.headers.Cookie;

        if (this.sessionManager) {
            await this.sessionManager.deleteSession(this.baseURL, this.username);
        }
    }

    async _request(method, path, data = {}) {
        // Check session validity first with mutex protection
        if (!this.loginMutex && this.sessionManager && !await this.sessionManager.hasValidSession(this.baseURL, this.username)) {
            await this._ensureAuthenticated();
        } else if (!this.loginMutex && !this.cookie) {
            await this._ensureAuthenticated();
        }

        try {
            const response = await this.api.request({
                method,
                url: path,
                data,
                ...(method.toLowerCase() === 'post' ? { headers: { 'Content-Type': 'application/json' } } : {})
            });
            // Reset retry counter on successful request
            this.loginRetryCount = 0;
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                // Cookie might have expired, try to login again with retry limit
                if (this.loginRetryCount < this.maxLoginRetries) {
                    await this._ensureAuthenticated(true); // Force refresh
                    const response = await this.api.request({
                        method,
                        url: path,
                        data,
                        ...(method.toLowerCase() === 'post' ? { headers: { 'Content-Type': 'application/json' } } : {})
                    });
                    return response.data;
                } else {
                    throw new Error('Maximum login retry attempts exceeded. Check your credentials.');
                }
            }
            throw error;
        }
    }

    /**
     * Ensure authentication with mutex protection
     * @param {boolean} forceRefresh - Force a new login
     */
    async _ensureAuthenticated(forceRefresh = false) {
        // Prevent concurrent login attempts
        if (this.loginMutex) {
            // Wait for ongoing login to complete
            while (this.loginMutex) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        this.loginMutex = true;
        try {
            await this.login(forceRefresh);
        } finally {
            this.loginMutex = false;
        }
    }

    // ===========================================
    // CREDENTIAL GENERATION METHODS
    // ===========================================

    /**
     * Generate credentials for a specific protocol
     * @param {string} protocol - Protocol name (vless, vmess, trojan, etc.)
     * @param {Object} options - Generation options
     * @returns {Object} Generated credentials
     */
    generateCredentials(protocol, options = {}) {
        return CredentialGenerator.generateForProtocol(protocol, options);
    }

    /**
     * Generate UUID for VLESS/VMess protocols
     * @param {boolean} secure - Use cryptographically secure generation
     * @returns {string} UUID
     */
    generateUUID(secure = true) {
        return secure ? CredentialGenerator.generateSecureUUID() : CredentialGenerator.generateUUID();
    }

    /**
     * Generate password for Trojan/Shadowsocks protocols
     * @param {number} length - Password length
     * @param {Object} options - Password options
     * @returns {string} Generated password
     */
    generatePassword(length = 16, options = {}) {
        return CredentialGenerator.generatePassword(length, options);
    }

    /**
     * Generate bulk credentials for multiple clients
     * @param {string} protocol - Protocol name
     * @param {number} count - Number of credentials to generate
     * @param {Object} options - Generation options
     * @returns {Array} Array of credentials
     */
    generateBulkCredentials(protocol, count, options = {}) {
        return CredentialGenerator.generateBulk(protocol, count, options);
    }

    /**
     * Get available cipher methods for Shadowsocks
     * @returns {Array} Array of cipher methods
     */
    getShadowsocksCiphers() {
        return CredentialGenerator.getShadowsocksCipherMethods();
    }

    /**
     * Get recommended cipher for Shadowsocks
     * @returns {string} Recommended cipher
     */
    getRecommendedShadowsocksCipher() {
        return CredentialGenerator.getRecommendedShadowsocksCipher();
    }

    /**
     * Generate WireGuard key pair
     * @returns {Object} Key pair with helper methods
     */
    generateWireGuardKeys() {
        return CredentialGenerator.generateWireGuardKeys();
    }

    /**
     * Generate Reality key pair for anti-censorship
     * @returns {Object} Reality key pair with helper methods
     */
    generateRealityKeys() {
        return CredentialGenerator.generateRealityKeys();
    }

    /**
     * Generate random port number
     * @param {number} min - Minimum port
     * @param {number} max - Maximum port
     * @returns {number} Random port
     */
    generatePort(min = 10000, max = 65535) {
        return CredentialGenerator.generatePort(min, max);
    }

    /**
     * Validate generated credentials
     * @param {Object} credentials - Credentials to validate
     * @param {string} protocol - Protocol name
     * @returns {Object} Validation result
     */
    validateCredentials(credentials, protocol) {
        return CredentialGenerator.validateCredentials(credentials, protocol);
    }

    // ===========================================
    // ENHANCED CLIENT MANAGEMENT WITH AUTO-GENERATION
    // ===========================================

    /**
     * Add client with automatic credential generation
     * @param {number} inboundId - Inbound ID
     * @param {string} protocol - Protocol type
     * @param {Object} options - Client options
     * @returns {Object} Created client with credentials
     */
    async addClientWithCredentials(inboundId, protocol, options = {}) {
        const credentials = this.generateCredentials(protocol, options);

        const clientConfig = {
            id: inboundId,
            settings: JSON.stringify({
                clients: [{
                    ...credentials,
                    enable: true,
                    expiryTime: options.expiryTime || 0,
                    limitIp: options.limitIp || 0,
                    totalGB: options.totalGB || 0,
                    subId: options.subId || this.generateUUID()
                }]
            })
        };

        const result = await this.addClient(clientConfig);
        return {
            ...result,
            credentials,
            protocol
        };
    }

    /**
     * Update client with automatic credential management
     * @param {string} clientId - Client UUID/ID
     * @param {number} inboundId - Inbound ID
     * @param {Object} options - Update options
     * @returns {Object} Update result
     */
    async updateClientWithCredentials(clientId, inboundId, options = {}) {
        try {
            // First, get the current inbound to obtain all existing clients
            const inboundData = await this.getInbound(inboundId);

            if (!inboundData.success || !inboundData.obj) {
                throw new Error(`Failed to get inbound ${inboundId} for client update`);
            }

            // Parse existing settings to get all clients
            const currentSettings = JSON.parse(inboundData.obj.settings);
            const existingClients = currentSettings.clients || [];

            // Find the client to update
            const clientIndex = existingClients.findIndex(client => client.id === clientId);
            if (clientIndex === -1) {
                throw new Error(`Client with ID ${clientId} not found in inbound ${inboundId}`);
            }

            // Convert user-friendly options to API format
            const processedOptions = {
                email: options.email || existingClients[clientIndex].email,
                limitIp: options.limitIp !== undefined ? options.limitIp : existingClients[clientIndex].limitIp,
                totalGB: options.totalGB ? options.totalGB * 1024 * 1024 * 1024 : existingClients[clientIndex].totalGB,
                expiryTime: options.expiryDays ? Date.now() + (options.expiryDays * 24 * 60 * 60 * 1000) : existingClients[clientIndex].expiryTime,
                enable: options.enable !== undefined ? options.enable : existingClients[clientIndex].enable,
                flow: options.flow || existingClients[clientIndex].flow,
                encryption: options.encryption || existingClients[clientIndex].encryption || 'none',
                subId: options.subId || existingClients[clientIndex].subId
            };

            // Update the specific client while preserving others
            existingClients[clientIndex] = {
                ...existingClients[clientIndex],
                ...processedOptions
            };

            // Prepare the complete settings with all clients
            const updatedSettings = {
                ...currentSettings,
                clients: existingClients
            };

            const clientConfig = {
                id: inboundId,
                settings: JSON.stringify(updatedSettings)
            };

            const result = await this.updateClient(clientId, clientConfig);
            return {
                ...result,
                updatedOptions: processedOptions,
                conversions: {
                    totalGB: options.totalGB ? `${options.totalGB}GB → ${processedOptions.totalGB} bytes` : 'unchanged',
                    expiryDays: options.expiryDays ? `${options.expiryDays} days → ${new Date(processedOptions.expiryTime).toISOString()}` : 'unchanged'
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error.message,
                details: 'updateClientWithCredentials failed - check client ID and inbound ID'
            };
        }
    }

    // ===========================================
    // SESSION MANAGEMENT METHODS
    // ===========================================

    /**
     * Get session statistics
     * @returns {Object} Session statistics
     */
    async getSessionStats() {
        if (this.sessionManager) {
            return await this.sessionManager.getStats();
        }
        return { message: 'Session manager not initialized' };
    }

    /**
     * Clear all cached sessions
     */
    async clearAllSessions() {
        if (this.sessionManager) {
            await this.sessionManager.clearAllSessions();
        }
    }

    /**
     * Check if current session is valid
     * @returns {boolean} Session validity
     */
    async isSessionValid() {
        if (this.sessionManager) {
            return await this.sessionManager.hasValidSession(this.baseURL, this.username);
        }
        return !!this.cookie;
    }

    // ===========================================
    // ORIGINAL API METHODS (UNCHANGED)
    // ===========================================

    // Inbounds
    getInbounds() {
        return this._request('get', '/panel/api/inbounds/list');
    }

    getInbound(id) {
        return this._request('get', `/panel/api/inbounds/get/${id}`);
    }

    addInbound(inboundConfig) {
        // Validate inbound configuration for security
        const validatedConfig = InputValidator.validateInboundConfig(inboundConfig);
        return this._request('post', '/panel/api/inbounds/add', validatedConfig);
    }

    deleteInbound(id) {
        return this._request('post', `/panel/api/inbounds/del/${id}`);
    }

    updateInbound(id, inboundConfig) {
        // Validate inbound configuration for security
        const validatedConfig = InputValidator.validateInboundConfig(inboundConfig);
        return this._request('post', `/panel/api/inbounds/update/${id}`, validatedConfig);
    }

    // Clients
    addClient(clientConfig) {
        // Validate client configuration for security
        const validatedConfig = InputValidator.validateClientConfig(clientConfig);
        return this._request('post', '/panel/api/inbounds/addClient', validatedConfig);
    }

    deleteClient(inboundId, clientId) {
        return this._request('post', `/panel/api/inbounds/${inboundId}/delClient/${clientId}`);
    }

    updateClient(clientId, clientConfig) {
        // Validate client configuration for security
        const validatedConfig = InputValidator.validateClientConfig(clientConfig);
        return this._request('post', `/panel/api/inbounds/updateClient/${clientId}`, validatedConfig);
    }

    getClientTrafficsByEmail(email) {
        return this._request('get', `/panel/api/inbounds/getClientTraffics/${email}`);
    }

    getClientTrafficsById(id) {
        return this._request('get', `/panel/api/inbounds/getClientTrafficsById/${id}`);
    }

    getClientIps(email) {
        return this._request('post', `/panel/api/inbounds/clientIps/${email}`);
    }

    clearClientIps(email) {
        return this._request('post', `/panel/api/inbounds/clearClientIps/${email}`);
    }

    // Traffic
    resetClientTraffic(inboundId, email) {
        return this._request('post', `/panel/api/inbounds/${inboundId}/resetClientTraffic/${email}`);
    }

    resetAllTraffics() {
        return this._request('post', '/panel/api/inbounds/resetAllTraffics');
    }

    resetAllClientTraffics(inboundId) {
        return this._request('post', `/panel/api/inbounds/resetAllClientTraffics/${inboundId}`);
    }

    deleteDepletedClients(inboundId) {
        return this._request('post', `/panel/api/inbounds/delDepletedClients/${inboundId}`);
    }

    // System
    getOnlineClients() {
        return this._request('post', '/panel/api/inbounds/onlines');
    }

    createBackup() {
        return this._request('get', '/panel/api/inbounds/createbackup');
    }

    // Security Methods

    /**
     * Get security statistics and monitoring data
     * @returns {Object} Security statistics
     */
    getSecurityStats() {
        return this.securityMonitor.getStats();
    }

    /**
     * Clear blocked IPs (admin function)
     */
    clearBlockedIPs() {
        this.securityMonitor.clearBlockedIPs();
    }

    /**
     * Validate credential strength
     * @param {string} credential - Credential to validate
     * @param {string} type - Type of credential
     * @returns {Object} Validation result
     */
    validateCredentialStrength(credential, type) {
        return CredentialSecurity.validateCredentialStrength(credential, type);
    }

    /**
     * Generate secure session token
     * @returns {string} Secure session token
     */
    generateSecureToken() {
        return CredentialSecurity.generateSessionToken();
    }

    /**
     * Enable development mode for detailed error messages
     * @param {boolean} enabled - Whether to enable development mode
     */
    setDevelopmentMode(enabled) {
        this.isDevelopment = enabled;
    }
}

// Export static methods for standalone use
ThreeXUI.CredentialGenerator = CredentialGenerator;
ThreeXUI.SessionManager = SessionManager;
ThreeXUI.createSessionManager = createSessionManager;

module.exports = ThreeXUI;