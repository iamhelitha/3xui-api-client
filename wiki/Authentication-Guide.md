# Authentication Guide

✅ **Status**: Fully tested and working with v2.0 security enhancements

This guide explains authentication, session management, and security features in the enhanced 3xui-api-client package.

## Table of Contents
- [Quick Start](#quick-start)
- [Security Features](#security-features)
- [Session Management Options](#session-management-options)
- [Authentication Response](#authentication-response)
- [Advanced Configuration](#advanced-configuration)
- [Web Integration](#web-integration)
- [Security Monitoring](#security-monitoring)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Authentication (Auto-managed)
```javascript
const ThreeXUI = require('3xui-api-client');

// Simple setup - sessions handled automatically
const client = new ThreeXUI(
    'https://your-3xui-server.com',
    'your-username',
    'your-password'
);

// No manual login needed - auto-authenticates on first API call
const inbounds = await client.getInbounds();
```

### Enhanced Security Setup
```javascript
const client = new ThreeXUI(url, username, password, {
    // Security options
    maxRequestsPerMinute: 60,           // Rate limiting
    maxLoginAttemptsPerHour: 10,        // Login attempt limiting
    isDevelopment: false,               // Production mode (sanitized errors)
    enableCSP: true,                    // Content Security Policy
    timeout: 30000,                     // Request timeout
    
    // Session management
    sessionManager: {
        type: 'redis',                  // Storage type: 'memory', 'redis', 'database'
        redis: redisClient,             // Redis client instance
        defaultTTL: 3600,              // Session TTL (1 hour)
        autoRefresh: true               // Auto-refresh at 80% expiry
    }
});
```

## Security Features

### Rate Limiting & Monitoring
The client includes built-in protection against abuse:

```javascript
// Check security status
const stats = await client.getSecurityStats();
console.log('Security Stats:', {
    blockedIPs: stats.blockedIPs,
    suspiciousActivities: stats.totalSuspiciousActivities,
    recentActivities: stats.recentActivities
});

// Clear blocked IPs (admin function)
await client.clearBlockedIPs();
```

**Default Limits:**
- **General requests**: 60 per minute
- **Login attempts**: 10 per hour
- **IP blocking**: Automatic after excessive violations

### Input Validation
All inputs are automatically validated and sanitized:

```javascript
// These are automatically validated:
// - URL format and protocol (HTTP/HTTPS only)
// - Username length and characters
// - Password security
// - Client configuration data
// - Inbound port ranges (1-65535)
```

### Secure Error Handling
```javascript
// Production mode (default) - sanitized errors
client.setDevelopmentMode(false);

// Development mode - detailed errors  
client.setDevelopmentMode(true);

try {
    await client.login();
} catch (error) {
    // Error messages are sanitized in production mode
    console.error('Login error:', error.message);
}
```

## Security Best Practices

### 🔒 Server-Side Only Usage
- This package is designed for **server-side use only**
- Never use this package in browser/client-side applications
- Session cookies contain sensitive authentication data

### 🛡️ Credential Security
- Store credentials in environment variables, not in code
- Use secure session storage (Redis, Database) for production
- Implement proper access controls for your server

### 🔄 Session Management Security
- Sessions expire after 1 hour and are automatically renewed
- Monitor for unusual authentication patterns
- Implement rate limiting on your server

### 📝 Example Secure Implementation
```javascript
const ThreeXUI = require('3xui-api-client');

// ✅ Good: Use environment variables with security options
const client = new ThreeXUI(
  process.env.XUI_URL,
  process.env.XUI_USERNAME, 
  process.env.XUI_PASSWORD,
  {
    // Security configuration
    maxRequestsPerMinute: 30,        // Stricter rate limiting
    maxLoginAttemptsPerHour: 5,      // Stricter login attempts
    isDevelopment: false,            // Production mode (sanitized errors)
    enableCSP: true,                 // Enable Content Security Policy
    timeout: 15000,                  // 15 second timeout
    
    // Session management
    sessionManager: {
      type: 'redis',                 // Use Redis for session storage
      redis: redisClient,
      keyPrefix: 'xui:session:',
      defaultTTL: 3600
    }
  }
);

// ✅ Good: Store sessions securely with monitoring
class SecureXUIManager {
  constructor(database) {
    this.client = client;
    this.db = database;
  }
  
  async ensureAuthenticated() {
    // Check security statistics
    const securityStats = this.client.getSecurityStats();
    if (securityStats.blockedIPs > 0) {
      console.warn('Security Alert: Blocked IPs detected', securityStats);
    }
    
    const session = await this.db.getValidSession();
    if (!session) {
      await this.client.login();
      await this.db.storeSession(this.client.cookie);
    }
  }
  
  async addSecureClient(inboundId, protocol) {
    // Use built-in credential generation with validation
    const credentials = this.client.generateCredentials(protocol);
    const validation = this.client.validateCredentialStrength(
      credentials.password || credentials.uuid, 
      protocol === 'trojan' ? 'password' : 'uuid'
    );
    
    if (!validation.isValid) {
      throw new Error(`Weak credentials: ${validation.issues.join(', ')}`);
    }
    
    return await this.client.addClientWithCredentials(inboundId, protocol, {
      credentials,
      enableSecurity: true
    });
  }
}

### ✅ Built-in Security Features

**Automatic Session Management**
- Sessions expire after 1 hour
- Automatic re-authentication on expiry
- Secure cookie handling
- Rate limiting with IP blocking
- Session security monitoring

**Input Validation & Sanitization** 
- URL validation and sanitization
- Username/password validation
- Client configuration validation
- Inbound configuration validation
- Protocol validation
- Port range validation

**Rate Limiting & Monitoring**
- Configurable rate limits (60 requests/minute default)
- Login attempt limiting (10 attempts/hour default)
- Automatic IP blocking for abuse
- Suspicious activity logging
- Security event monitoring

**HTTP Security Headers**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content Security Policy (optional)
- Cache-Control: no-cache, no-store
- Security-enhanced User-Agent

**Credential Security**
- Secure credential strength validation
- Cryptographic session tokens
- Secure logging with data hashing
- Password complexity checking
- UUID format validation

**Error Handling Security**
- Sanitized error messages in production
- Sensitive data redaction
- Secure error logging
- Development/production mode switching
- Generic error responses for security

## Session Management Options

### 1. Memory Storage (Default)
Perfect for development and single-server deployments:

```javascript
const client = new ThreeXUI(url, username, password, {
    sessionManager: {
        type: 'memory'  // Default - no additional setup needed
    }
});
```

### 2. Redis Storage (Recommended for Production)
Ideal for multiple servers and scalability:

```javascript
const redis = require('redis').createClient();

const client = new ThreeXUI(url, username, password, {
    sessionManager: {
        type: 'redis',
        redis: redis,
        redisOptions: {
            keyPrefix: 'myapp:3xui:',
            defaultTTL: 7200              // 2 hours
        }
    }
});
```

### 3. Database Storage
For SQL database integration:

```javascript
const mysql = require('mysql2/promise');
const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'myapp'
});

const client = new ThreeXUI(url, username, password, {
    sessionManager: {
        type: 'database',
        database: connection,
        databaseOptions: {
            tableName: 'xui_sessions',
            defaultTTL: 3600
        }
    }
});
```

### 4. Custom Handler
For your own storage implementation:

```javascript
const client = new ThreeXUI(url, username, password, {
    sessionManager: {
        type: 'custom',
        customHandler: {
            getSession: async (key) => {
                return await MyDatabase.getSession(key);
            },
            setSession: async (key, value, ttl) => {
                await MyDatabase.saveSession(key, value, ttl);
            },
            deleteSession: async (key) => {
                await MyDatabase.deleteSession(key);
            }
        }
    }
});
```

### 5. Firestore (Custom Session Store)

Use Firestore by providing a small adapter via the custom handler. This keeps the canonical session logic in this package while storing the cookie in your Firestore collection.

```javascript
// Firestore adapter example (Node.js Admin SDK)
// Assumes: const admin = require('firebase-admin'); admin.initializeApp({/* ... */});
const db = admin.firestore();

const FirestoreSessionHandler = {
    getSession: async (key) => {
        const snap = await db.collection('xui_sessions').doc(key).get();
        if (!snap.exists) return null;
        const data = snap.data();
        if (!data || Date.now() > data.expiresAt) {
            return null; // Treat as expired
        }
        return data.session; // e.g., { cookie: '3x-ui=...', createdAt, expiresAt }
    },
    setSession: async (key, value, ttlSeconds = 3600) => {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        await db.collection('xui_sessions').doc(key).set({
            session: value,
            createdAt: Date.now(),
            expiresAt
        }, { merge: true });
    },
    deleteSession: async (key) => {
        await db.collection('xui_sessions').doc(key).delete();
    }
};

// Wire the custom handler into ThreeXUI
const client = new ThreeXUI(url, username, password, {
    sessionManager: {
        type: 'custom',
        customHandler: FirestoreSessionHandler,
        defaultTTL: 3600
    }
});

// Optional: periodic cleanup of expired sessions
async function cleanupExpiredSessions() {
    const now = Date.now();
    const q = await db.collection('xui_sessions').where('expiresAt', '<=', now).get();
    const batch = db.batch();
    q.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}
```

Notes:
- The stored object can be minimal (e.g., `{ cookie: string }`) or include metadata like `createdAt` and `expiresAt`.
- Keep this server-side; never expose session cookies to browsers.
- For high throughput, consider using Redis; Firestore is suitable when you already run on Firebase.

## Authentication Methods

### Logout
Explicitly end the session and clear stored cookies.

```javascript
await client.logout();
```

### Check Two-Factor Authentication
Check if 2FA is enabled on the server.

```javascript
const status = await client.getTwoFactorEnable();
console.log('2FA Enabled:', status.obj); // true/false
```

## Authentication Response

### Login Response Structure
```javascript
{
  "success": true,
  "msg": "Login Successfully",
  "obj": null
}
```

### Session Cookie Details
The session cookie is automatically extracted and managed:

```http
Set-Cookie: 3x-ui=MTczNTUyMzMyN3xEWDhFQVFMX2dBQUJFQUVRQUFCMV80QUFBUVp6ZEhKcGJtY01EQUFJVEU5SFNVNWZWVk5GVWhoNExYVnBMMlJoZEdGaVlYTmxMMjF2WkdWc0xsVnpaWExfZ1FNQkFRUlZjMlZ5QWYtQ0FBRUVBUUpKWkFFRUFBRUlWWE5sY201aGJXVUJEQUFCQ0ZCaGMzTjNiM0prQVF3QUFRdE1iMmRwYmxObFkzSmxkQUVNQUFBQUZQLUNFUUVDQVFWaFpHMXBiZ0VGWVdSdGFXNEF8y6Y2EKU4tk9ljoHdsA7Hb8TqYbZZclkP6EfZlCy1-bs=; Path=/; Expires=Mon, 30 Dec 2024 02:48:47 GMT; Max-Age=3600; HttpOnly
```

**Cookie Properties:**
- **Name**: `3x-ui`
- **Max-Age**: 3600 seconds (1 hour)
- **HttpOnly**: Secure flag (not accessible via JavaScript)
- **Path**: `/` (available for all routes)

All subsequent API requests (e.g., `getInbounds`, `addClient`) automatically include the stored session cookie via the client's HTTP defaults; no manual header injection is required.

### Session Auto-Renewal
Sessions are automatically renewed before expiry:

```javascript
// Auto-renewal happens at 80% of session lifetime
// For 1-hour sessions: renewal at 48 minutes
// No manual intervention required

const inbounds = await client.getInbounds();  // May trigger auto-renewal
```

## Advanced Configuration

### Production Security Setup
```javascript
const client = new ThreeXUI(url, username, password, {
    // Strict security settings
    maxRequestsPerMinute: 30,
    maxLoginAttemptsPerHour: 5,
    isDevelopment: false,
    enableCSP: true,
    timeout: 15000,
    
    // Enterprise session management
    sessionManager: {
        type: 'database',
        database: dbConnection,
        databaseOptions: {
            tableName: 'xui_sessions',
            defaultTTL: 3600,
            encryptSessions: true,      // Encrypt session data
            cleanupInterval: 300        // Cleanup expired sessions every 5 min
        }
    }
});
```

### Credential Strength Validation
```javascript
// Validate credential security
const validation = client.validateCredentialStrength('myPassword123', 'password');

if (!validation.isValid) {
    console.error('Weak credentials:', validation.issues);
    // Issues: ["Password should contain uppercase letters", ...]
}

console.log('Credential strength:', validation.strength);  // 'weak', 'medium', 'strong'
```

## Web Integration

### Express.js Middleware Pattern
```javascript
const express = require('express');
const app = express();

// Create authenticated 3x-ui client
const xui = new ThreeXUI(url, username, password, {
    sessionManager: { redis: redisClient }
});

// Middleware for 3x-ui operations
app.use('/api/3xui', async (req, res, next) => {
    try {
        req.xui = xui;  // Attach client to request
        next();
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// API routes
app.get('/api/3xui/inbounds', async (req, res) => {
    const inbounds = await req.xui.getInbounds();
    res.json(inbounds);
});
```

### Next.js API Routes
```javascript
// pages/api/3xui/[...path].js
import { ThreeXUI } from '3xui-api-client';

const xui = new ThreeXUI(
    process.env.XUI_URL,
    process.env.XUI_USERNAME,
    process.env.XUI_PASSWORD,
    {
        sessionManager: {
            type: 'database',
            database: prisma  // Prisma client
        }
    }
);

export default async function handler(req, res) {
    try {
        switch (req.method) {
            case 'GET':
                const inbounds = await xui.getInbounds();
                res.json(inbounds);
                break;
            case 'POST':
                const result = await xui.addClientWithCredentials(
                    req.body.inboundId,
                    'vless'
                );
                res.json(result);
                break;
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
```

## Security Monitoring

### Monitor Security Events
```javascript
// Get detailed security statistics
const stats = await client.getSecurityStats();

console.log('Security Overview:', {
    totalSuspiciousActivities: stats.totalSuspiciousActivities,
    blockedIPs: stats.blockedIPs,
    activeRateLimits: stats.activeRateLimits
});

// Review recent security events
stats.recentActivities.forEach(activity => {
    console.log(`${activity.timestamp}: ${activity.type} (${activity.severity})`);
});
```

### Handle Security Events
```javascript
// Custom security event handling
class SecurityAwareClient extends ThreeXUI {
    constructor(url, username, password, options) {
        super(url, username, password, options);
        
        // Monitor security events
        this.on('securityEvent', (event) => {
            if (event.severity === 'high') {
                // Alert administrators
                this.notifyAdmins(event);
            }
        });
    }
    
    async notifyAdmins(event) {
        // Send alerts via email, Slack, etc.
        console.warn('SECURITY ALERT:', event);
    }
}
```

## Troubleshooting

### Authentication Issues
```javascript
// Check if authentication is the problem
try {
    await client.login();
    console.log('✅ Manual login successful');
} catch (error) {
    console.error('❌ Authentication failed:', error.message);
    
    // Check security stats for rate limiting
    const stats = await client.getSecurityStats();
    if (stats.blockedIPs > 0) {
        console.warn('IP may be blocked due to security violations');
        // Clear blocks if necessary: await client.clearBlockedIPs();
    }
}
```

### Session Problems
```javascript
// Debug session management
const sessionStats = await client.getSessionStats();
console.log('Session Info:', {
    hasValidSession: sessionStats.hasValidSession,
    sessionAge: sessionStats.ageInMinutes,
    needsRefresh: sessionStats.needsRefresh
});

// Force session refresh
await client.login(true);  // Force new login
```

### Rate Limiting Issues
```javascript
// Check if rate limiting is affecting requests
const stats = await client.getSecurityStats();

if (stats.recentActivities.some(a => a.type === 'rate_limit_exceeded')) {
    console.warn('Rate limiting detected');
    
    // Option 1: Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Option 2: Adjust rate limits
    client.options.maxRequestsPerMinute = 30;  // Reduce rate
}
```

### Development vs Production
```javascript
// Enable detailed error logging for debugging
client.setDevelopmentMode(true);

try {
    await client.someOperation();
} catch (error) {
    console.error('Detailed error (dev mode):', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
    });
}

// Switch back to production mode
client.setDevelopmentMode(false);
```

---

## Navigation

| Previous | Next |
|----------|------|
| [← Home](Home.md) | [Inbound Management →](Inbound-Management.md) |

*Last updated: September 2025* 