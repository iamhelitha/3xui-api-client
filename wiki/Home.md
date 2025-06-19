# 3xui-api-client Documentation

Welcome to the comprehensive documentation for **3xui-api-client** - a Node.js library for programmatic management of 3x-ui VPN panels.

## 🚀 Quick Start

### Installation
```bash
npm install 3xui-api-client
```

### Basic Usage
```javascript
const ThreeXUI = require('3xui-api-client');

// Initialize client (server-side only!)
const client = new ThreeXUI(
    'https://your-3xui-server.com',
    'your-username',
    'your-password'
);

// Example: Get all inbounds
async function getServerStats() {
    try {
        const inbounds = await client.getInbounds();
        console.log('Active inbounds:', inbounds);
    } catch (error) {
        console.error('Error:', error.message);
    }
}
```

⚠️ **Important**: This library is **server-side only** due to session cookie security requirements.

## 📚 Core Documentation

### 🔐 [Authentication Guide](Authentication-Guide.md)
Learn how to securely connect to your 3x-ui panel and manage authentication sessions.
- Session management
- Security best practices  
- Database integration patterns

### 🛠️ [Inbound Management](Inbound-Management.md) 
Complete guide to managing VPN server configurations (inbounds).
- Create and configure inbounds
- Protocol setup (VLESS, VMess, Trojan)
- Port and network management

### 👥 [Client Management](Client-Management.md)
User account operations and access control.
- Add, update, and remove clients
- Traffic limits and restrictions
- IP address management

### 📊 [Traffic Management](Traffic-Management.md)
Monitor and control data usage across your VPN infrastructure.
- Real-time traffic monitoring
- Usage limits and resets
- Automated cleanup operations

### 🖥️ [System Operations](System-Operations.md)
Administrative operations and system maintenance.
- Online client monitoring
- Backup and restore operations
- Health checking and diagnostics

## 🎯 Quick Reference

### All Available Methods (19 total)
```javascript
// Authentication
await client.login()

// Inbound Operations (5 methods)
await client.getInbounds()
await client.getInbound(id)
await client.addInbound(config)
await client.updateInbound(id, config)
await client.deleteInbound(id)

// Client Operations (7 methods)  
await client.addClient(config)
await client.updateClient(clientId, config)
await client.deleteClient(inboundId, clientId)
await client.getClientTrafficsByEmail(email)
await client.getClientTrafficsById(id)
await client.getClientIps(email)
await client.clearClientIps(email)

// Traffic Operations (4 methods)
await client.resetClientTraffic(inboundId, email)
await client.resetAllTraffics()
await client.resetAllClientTraffics(inboundId)
await client.deleteDepletedClients(inboundId)

// System Operations (2 methods)
await client.getOnlineClients()
await client.createBackup()
```

## 🛡️ Security & Best Practices

### Server-Side Only
This package **must** run on server-side environments:
- Node.js applications
- Express.js backends  
- API servers
- Microservices

### Session Storage
Implement proper session management with database storage:
```javascript
class SecureThreeXUIManager {
    constructor(serverUrl, username, password, database) {
        this.client = new ThreeXUI(serverUrl, username, password);
        this.db = database;
    }
    
    async ensureAuthenticated() {
        // Check database for valid session
        // Restore or create new session
        // Store session securely
    }
}
```

## 🔧 Troubleshooting

### Common Issues

**Authentication Errors**
- Verify server URL format: `https://your-domain.com` (no trailing slash)
- Check username/password credentials
- Ensure server is accessible from your application

**Network Issues**  
- Confirm server is running and accessible
- Check firewall settings
- Verify SSL certificate if using HTTPS

**Session Problems**
- Sessions expire after 1 hour of inactivity
- Implement proper session refresh logic
- Store session data securely in your database

**CORS Errors**
- This library is server-side only
- Never use in browser/client-side applications
- Move API calls to your backend

### Getting Help

- 📖 **Documentation**: Browse the guides above for detailed information
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/iamhelitha/3xui-api-client/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/iamhelitha/3xui-api-client/discussions)
- 📧 **Contact**: [Helitha Guruge](https://github.com/iamhelitha)

## 📦 Package Information

- **Current Version**: 1.0.0
- **License**: MIT
- **Node.js Support**: 16.0.0+
- **GitHub**: [iamhelitha/3xui-api-client](https://github.com/iamhelitha/3xui-api-client)
- **npm**: [3xui-api-client](https://www.npmjs.com/package/3xui-api-client)

---

## Navigation

| Previous | Next |
|----------|------|
| - | [Authentication Guide →](Authentication-Guide.md) |

*Last updated: January 2025* 