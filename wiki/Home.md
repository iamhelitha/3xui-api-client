# 3xui-api-client Documentation

Welcome to the comprehensive documentation for **3xui-api-client v2.0** - a secure, feature-rich Node.js library for programmatic management of 3x-ui VPN panels with built-in credential generation, advanced session management, and enterprise-grade security.

## 🚀 Quick Start

### Installation
```bash
npm install 3xui-api-client
```

### Basic Usage
```javascript
const ThreeXUI = require('3xui-api-client');

// Initialize with security enhancements
const client = new ThreeXUI(
    'https://your-3xui-server.com',
    'your-username',
    'your-password',
    {
        // Security options
        maxRequestsPerMinute: 60,
        maxLoginAttemptsPerHour: 10,
        isDevelopment: false,
        enableCSP: true,
        
        // Session management (optional)
        sessionManager: {
            type: 'redis',  // or 'memory', 'database'
            redis: redisClient
        }
    }
);

// Create a client with auto-generated credentials (NEW!)
const result = await client.addClientWithCredentials(inboundId, 'vless', {
    email: 'user_example_001'  // Optional - will auto-generate if not provided
});

console.log('Client created:', result.credentials);
// Output: Complete VLESS config with UUID, email, flow settings, etc.
```

⚠️ **Important**: This library is **server-side only** due to session cookie security requirements.

## ✨ What's New in v2.0

### 🔐 **Automatic Credential Generation**
- **Zero configuration** - Generate secure UUIDs, passwords, and keys automatically
- **All protocols supported** - VLESS, VMess, Trojan, Shadowsocks, WireGuard, etc.
- **Production-ready defaults** - Secure ciphers, optimal settings out of the box
- **Bulk generation** - Create multiple clients with one call

### 🛡️ **Enterprise Security**
- **Rate limiting** - Configurable request and login attempt limits
- **Input validation** - Automatic sanitization of all inputs
- **Secure error handling** - Sanitized error messages in production
- **Security monitoring** - Track suspicious activities and blocked IPs
- **Secure headers** - Content Security Policy, XSS protection, etc.

### 🔄 **Advanced Session Management**
- **Auto-renewal** - Sessions refresh automatically before expiry
- **Multiple storage options** - Memory, Redis, Database, or custom handlers
- **Race condition protection** - Mutex-protected login operations
- **Database integration** - Built-in SQL session store with cleanup

### 🌐 **Web Integration Ready**
- **Express middleware** - Ready-to-use proxy for web applications
- **React hooks** - Simplified state management for React apps
- **Next.js helpers** - API route handlers with session management
- **CORS handling** - Secure proxy implementation for browser apps

## 🔒 Security Overview

### Built-in Security Features
✅ **Automatic Session Management**
- Sessions expire after 1 hour with auto-renewal
- Secure cookie handling with HttpOnly flags
- Rate limiting with configurable IP blocking
- Session security monitoring and anomaly detection

✅ **Input Validation & Sanitization** 
- URL validation and sanitization
- Username/password validation with complexity checking
- Client and inbound configuration validation
- Protocol validation with secure defaults
- Port range validation (1-65535)

✅ **Rate Limiting & Monitoring**
- Configurable rate limits (60 requests/minute default)
- Login attempt limiting (10 attempts/hour default)
- Automatic IP blocking for abuse patterns
- Suspicious activity logging and alerts
- Security event monitoring dashboard

✅ **HTTP Security Headers**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content Security Policy (configurable)
- Cache-Control: no-cache, no-store

✅ **Credential Security**
- Secure credential strength validation
- Cryptographic session tokens
- Secure logging with data redaction
- Password complexity checking
- UUID format validation and generation

✅ **Production-Ready Error Handling**
- Sanitized error messages in production mode
- Sensitive data redaction from logs
- Development/production mode switching
- Generic error responses for security
- Secure error logging patterns

### Security Best Practices Included
- **Server-side only** - Never use in browser applications
- **Environment variables** - Credential storage best practices
- **Session storage** - Redis/Database integration for scalability
- **Access controls** - Built-in rate limiting and IP blocking
- **Audit trails** - Comprehensive security event logging

## 📚 Core Documentation

### 🔐 [Authentication Guide](Authentication-Guide.md)
Session management, security best practices, and database integration patterns.
- Auto-login and session renewal
- Multiple storage backends (Redis, Database, Memory)
- Security monitoring and rate limiting

### 🛠️ [Inbound Management](Inbound-Management.md) 
Complete guide to managing VPN server configurations with auto-generation.
- Protocol builders (VLESS, VMess, Trojan, Shadowsocks)
- Auto-generated security configurations
- Port and network management

### 👥 [Client Management](Client-Management.md)
User account operations with automatic credential generation.
- Auto-generated UUIDs and passwords
- Bulk client creation and management
- Traffic limits and IP restrictions

### 📊 [Traffic Management](Traffic-Management.md)
Monitor and control data usage with real-time capabilities.
- Real-time traffic monitoring
- Automated usage limits and resets
- Bulk cleanup operations

### 🖥️ [System Operations](System-Operations.md)
Administrative operations and system maintenance with security features.
- Online client monitoring
- Secure backup operations
- Health checking and diagnostics

### 💡 [Use Cases & Examples](Use-Cases.md)
Real-world implementation examples with web integration patterns.
- VPN service provider automation
- Web application integration
- Real-time monitoring dashboards
- Security best practices

## 🎯 API Reference

### Enhanced Authentication (Auto-managed)
```javascript
// Automatic login with session persistence
const client = new ThreeXUI(url, username, password, {
    sessionManager: { redis: redisClient }  // Auto-handles sessions
});

// Sessions are handled automatically - no manual login needed!
const inbounds = await client.getInbounds();  // Auto-authenticates if needed
```

### Credential Generation (NEW!)
```javascript
// Generate credentials for any protocol
const vlessCredentials = client.generateCredentials('vless');
const trojanCredentials = client.generateCredentials('trojan');
const bulkCredentials = client.generateBulkCredentials('vless', 10);

// Create clients with auto-generated credentials
const client = await api.addClientWithCredentials(inboundId, 'vless', {
    email: 'custom_user_123'  // Optional
});
// Auto-generates: UUID, flow settings, security config, etc.
```

### Security Methods (NEW!)
```javascript
// Monitor security events
const stats = client.getSecurityStats();
console.log('Blocked IPs:', stats.blockedIPs);
console.log('Suspicious activities:', stats.recentActivities);

// Validate credential strength
const validation = client.validateCredentialStrength('myPassword123', 'password');
if (!validation.isValid) {
    console.error('Weak credentials:', validation.issues);
}

// Clear security blocks (admin function)
client.clearBlockedIPs();
```

### All Available Methods (24+ total)
```javascript
// Authentication (Auto-managed)
await client.login()  // Usually not needed - auto-called

// Credential Generation (NEW!)
client.generateCredentials(protocol, options)
client.generateBulkCredentials(protocol, count, options)
client.generateUUID(secure)
client.generatePassword(length, options)

// Enhanced Client Operations
await client.addClientWithCredentials(inboundId, protocol, options)  // NEW!
await client.updateClientWithCredentials(clientId, inboundId, options)  // NEW!
await client.addClient(config)
await client.updateClient(clientId, config)
await client.deleteClient(inboundId, clientId)

// Inbound Operations (Enhanced with validation)
await client.getInbounds()
await client.getInbound(id)
await client.addInbound(config)  // Now with input validation
await client.updateInbound(id, config)  // Now with input validation
await client.deleteInbound(id)

// Traffic Operations
await client.getClientTrafficsByEmail(email)
await client.getClientTrafficsById(id)
await client.resetClientTraffic(inboundId, email)
await client.resetAllTraffics()
await client.resetAllClientTraffics(inboundId)
await client.deleteDepletedClients(inboundId)

// System Operations
await client.getOnlineClients()
await client.createBackup()
await client.getClientIps(email)
await client.clearClientIps(email)

// Security Operations (NEW!)
await client.getSecurityStats()
await client.clearBlockedIPs()
await client.validateCredentialStrength(credential, type)
await client.generateSecureToken()
await client.setDevelopmentMode(enabled)
```

## 🛡️ Security Features

### Built-in Security Enhancements
- ✅ **Rate Limiting** - 60 requests/minute, 10 login attempts/hour (configurable)
- ✅ **Input Validation** - All inputs sanitized and validated
- ✅ **Secure Headers** - CSP, XSS protection, content type validation
- ✅ **Error Sanitization** - Sensitive data redacted in production
- ✅ **IP Blocking** - Automatic blocking of suspicious activities
- ✅ **Session Security** - Encrypted storage with auto-renewal

### Example Secure Configuration
```javascript
const client = new ThreeXUI(url, username, password, {
    // Stricter security settings
    maxRequestsPerMinute: 30,
    maxLoginAttemptsPerHour: 5,
    isDevelopment: false,           // Production mode
    enableCSP: true,               // Content Security Policy
    timeout: 15000,                // 15 second timeout
    
    // Enterprise session management
    sessionManager: {
        type: 'database',
        database: dbConnection,
        tableName: 'xui_sessions',
        defaultTTL: 3600,
        autoRefresh: true
    }
});
```

## 🔧 Web Integration Examples

### Express.js Backend
```javascript
const express = require('express');
const ThreeXUI = require('3xui-api-client');

const app = express();
const xui = new ThreeXUI(url, username, password, {
    sessionManager: { redis: redisClient }
});

// Secure API endpoint
app.post('/api/create-client', async (req, res) => {
    try {
        const result = await xui.addClientWithCredentials(
            req.body.inboundId,
            'vless',
            { email: req.body.clientId }
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Next.js API Route
```javascript
// pages/api/3xui/create-client.js
import { ThreeXUI } from '3xui-api-client';

const xui = new ThreeXUI(
    process.env.XUI_URL,
    process.env.XUI_USERNAME,
    process.env.XUI_PASSWORD,
    { sessionManager: { database: db } }
);

export default async function handler(req, res) {
    const client = await xui.addClientWithCredentials(
        req.body.inboundId,
        'vless'
    );
    res.json(client);
}
```

## 🚀 Protocol Support

### Supported Protocols (9 total)
1. **VLESS** - UUID authentication with Reality/XTLS support
2. **VMess** - UUID authentication (legacy V2Ray)
3. **Trojan** - Password-based with TLS
4. **Shadowsocks** - Password + cipher method
5. **Shadowsocks2022** - Enhanced with modern AEAD
6. **WireGuard** - Public/private key pairs
7. **SOCKS5** - Username/password (optional)
8. **HTTP** - Basic auth (optional)
9. **Dokodemo-door** - No authentication (port forwarding)

### Auto-Generated Defaults
- **VLESS**: UUID + xtls-rprx-vision flow + Reality config
- **Trojan**: 16-char secure password + TLS settings
- **Shadowsocks**: chacha20-ietf-poly1305 cipher + secure password
- **WireGuard**: Curve25519 key pairs + client config

## 🔧 Troubleshooting

### Common Issues

**Authentication Errors**
- Check rate limiting: `client.getSecurityStats()`
- Verify credentials and server accessibility
- Review security logs: `ErrorSecurity.logError()`

**Session Problems**
- Sessions auto-refresh at 80% expiration
- Check session store connectivity (Redis/Database)
- Monitor with `client.getSessionStats()`

**Web Integration Issues**
- Use server-side proxy for browser applications
- Implement proper CORS handling
- Store sessions securely server-side only

### Getting Help

- 📖 **Documentation**: Browse the guides above for detailed information
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/iamhelitha/3xui-api-client/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/iamhelitha/3xui-api-client/discussions)
- 📧 **Contact**: [Helitha Guruge](https://github.com/iamhelitha)

## 📦 Package Information

- **Current Version**: 2.0.0
- **License**: MIT
- **Node.js Support**: 16.0.0+
- **Security Enhanced**: ✅ Enterprise-grade security features
- **Web Integration**: ✅ Express, Next.js, React ready
- **GitHub**: [iamhelitha/3xui-api-client](https://github.com/iamhelitha/3xui-api-client)
- **npm**: [3xui-api-client](https://www.npmjs.com/package/3xui-api-client)

---

## Navigation

| Previous | Next |
|----------|------|
| - | [Authentication Guide →](Authentication-Guide.md) |

*Last updated: January 2025* 