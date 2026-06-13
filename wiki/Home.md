# 3xui-api-client Documentation

Welcome to the documentation for **3xui-api-client v3.0.0** — a Node.js client library for managing 3x-ui VPN panels. Supports both **API token authentication** (3x-ui v3.0.2+) and legacy cookie-based login, with 103 API routes, built-in credential generation, session management, and enterprise security.

## Quick Start

### Installation
```bash
npm install 3xui-api-client
```

### Cookie-based login (all 3x-ui versions)
```javascript
const ThreeXUI = require('3xui-api-client');

const client = new ThreeXUI(
    'https://your-panel.com:2053',
    'admin',
    'your-password'
);

const inbounds = await client.getInbounds(); // auto-authenticates
```

### API token authentication (3x-ui v3.0.2+)
```javascript
const client = new ThreeXUI('https://your-panel.com:2053', {
    token: 'your-api-token-here'
});

// No login() needed — token is sent on every request
const inbounds = await client.getInbounds();
```

> **Server-side only.** Never use this library in browser/client-side code — session cookies and tokens are sensitive credentials.

---

## What's New in v3.0.0

### 🔑 API Token Authentication
Pass `token` or `apiToken` in options to authenticate with Bearer token headers instead of cookie login. Required for 3x-ui v3.0.2+ where the panel enforces token-based access for API operations.

### 📡 48 New Modern API Routes (3x-ui v2.x/v3.x)
Full coverage of the modern `/panel/api/clients/`, `/panel/api/nodes/`, and `/panel/api/custom-geo/` endpoints. See [Modern API Guide](Modern-API.md).

### 🔄 Flexible Constructor
Three equivalent ways to initialize the client:
```javascript
// Original positional style (unchanged)
new ThreeXUI(url, username, password)
new ThreeXUI(url, username, password, options)

// New object style
new ThreeXUI(url, { username, password })
new ThreeXUI(url, { token: 'api-token' })
```

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Authentication Guide](Authentication-Guide.md) | Cookie login, API token auth, session management, security |
| [Modern API Guide](Modern-API.md) | All 48 new routes — Clients, Groups, Nodes, Custom Geo |
| [Inbound Management](Inbound-Management.md) | Create and manage VPN server inbounds |
| [Client Management](Client-Management.md) | User accounts, credential generation, bulk operations |
| [Traffic Management](Traffic-Management.md) | Monitor and reset traffic, manage depleted clients |
| [System Operations](System-Operations.md) | Server status, Xray config, panel settings, backups |
| [Use Cases](Use-Cases.md) | Real-world examples and integration patterns |

---

## Full API Reference

### Authentication
```javascript
await client.login(forceRefresh?)      // Cookie auth — usually called automatically
await client.logout()                  // Clear session and cookie
await client.getTwoFactorEnable()      // Check if 2FA is enabled
await client.isSessionValid()          // Returns true if session or token is active
await client.getSessionStats()         // Session cache statistics
await client.clearAllSessions()        // Clear all cached sessions
```

### Modern API — Clients (3x-ui v2.x/v3.x)
```javascript
// Read
await client.getClients()
await client.getPagedClients({ page, size, sort, order, email })
await client.getClient(email)
await client.getClientTraffic(email)
await client.getSubLinks(subId)
await client.getClientLinks(email)
await client.getModernClientIps(email)
await client.getOnlines()
await client.getModernLastOnline()

// Write
await client.addModernClient(data)
await client.updateModernClient(email, data)
await client.deleteModernClient(email)
await client.attachClientToInbounds(email, data)
await client.detachClientFromInbounds(email, data)
await client.resetModernClientTrafficByEmail(email)
await client.updateModernClientTrafficByEmail(email, data)
await client.clearModernClientIps(email)
await client.resetAllModernClientTraffics()
await client.deleteDepletedModernClients()

// Bulk
await client.bulkCreateModernClients(data)
await client.bulkAdjustModernClients(data)
await client.bulkDeleteModernClients(data)
await client.bulkAttachModernClients(data)
await client.bulkDetachModernClients(data)
await client.bulkResetTrafficModernClients(data)
```

### Modern API — Client Groups
```javascript
await client.getGroups()
await client.getGroupEmails(groupName)
await client.createGroup(data)
await client.renameGroup(data)
await client.deleteGroup(data)
await client.bulkAddGroups(data)
await client.bulkRemoveGroups(data)
```

### Modern API — Nodes
```javascript
await client.getNodes()
await client.getNode(id)
await client.getNodeHistory(id, metric, bucket)
await client.addNode(data)
await client.updateNode(id, data)
await client.deleteNode(id)
await client.setNodeEnable(id)
await client.testNode(data)
await client.probeNode(id)
```

### Modern API — Custom Geo
```javascript
await client.getCustomGeos()
await client.getGeoAliases()
await client.addCustomGeo(data)
await client.updateCustomGeo(id, data)
await client.deleteCustomGeo(id)
await client.downloadCustomGeo(id)
await client.updateAllCustomGeo()
```

### Inbounds (all 3x-ui versions)
```javascript
await client.getInbounds()
await client.getInbound(id)
await client.addInbound(config)
await client.updateInbound(id, config)
await client.deleteInbound(id)
await client.importInbounds(inbounds) // accepts a single config or an array; returns an array of results
```

### Clients — Legacy API (older Vue-based panels only)
> ⚠️ **v3.x panels (React-based) have removed these `/panel/api/inbounds/*`
> client routes** - use the [Modern Client API](#clients--modern-api) instead
> (`addModernClient`, `updateModernClient`, `deleteModernClient`,
> `getClientTraffic`, `getModernClientIps`, `clearModernClientIps`,
> `getModernLastOnline`, `getOnlines`, etc). These legacy methods only work on
> older, pre-v3.x panels.
```javascript
await client.addClient(config)
await client.updateClient(clientId, config)
await client.deleteClient(inboundId, clientId)
await client.deleteClientByEmail(inboundId, email)
await client.updateClientTraffic(email, trafficConfig)
await client.getClientTrafficsByEmail(email)
await client.getClientTrafficsById(id)
await client.getClientIps(email)
await client.clearClientIps(email)
await client.getLastOnline()
await client.getOnlineClients()

// Auto-credential helpers
await client.addClientWithCredentials(inboundId, protocol, options)
await client.updateClientWithCredentials(clientId, inboundId, options)
```

### Traffic
```javascript
await client.resetAllTraffics() // all 3x-ui versions - resets traffic for ALL clients

// Legacy API - older Vue-based panels only (removed in v3.x, use Modern API equivalents)
await client.resetClientTraffic(inboundId, email)
await client.resetAllClientTraffics(inboundId)
await client.deleteDepletedClients(inboundId)
```

### System
```javascript
await client.backupToTgBot()
await client.getServerStatus()
await client.getCPUHistory(bucket?)
await client.getXrayVersion()
await client.getConfigJson()
await client.getDb()
await client.stopXrayService()
await client.restartXrayService()
await client.installXray(version)
await client.getPanelLogs(count?)
await client.getXrayLogs(count?)
await client.updateGeofile(fileName?)
await client.importDB(formData)
```

### Panel Settings
```javascript
await client.getAllSettings()
await client.updateSetting(settings)
await client.updateUser(oldUsername, oldPassword, newUsername, newPassword)
await client.restartPanel()
await client.getDefaultSettings()
await client.getDefaultJsonConfig()
```

### Xray Configuration
```javascript
await client.getXrayConfig()
await client.updateXrayConfig(config)
await client.manageWarp(action, data?)
await client.getOutboundsTraffic()
await client.resetOutboundsTraffic()
await client.getXrayResult()
```

### Server-Side Generators
```javascript
await client.getNewUUID()
await client.getNewX25519Cert()
await client.getNewmldsa65()
await client.getNewmlkem768()
await client.getNewVlessEnc()
await client.getNewEchCert()
```

### Credential Generation (local, no network)
```javascript
client.generateCredentials(protocol, options)
client.generateBulkCredentials(protocol, count, options)
client.generateUUID(secure?)
client.generatePassword(length?, options?)
client.generateWireGuardKeys()
client.generateRealityKeys()
client.generatePort(min?, max?)
client.validateCredentials(credentials, protocol)
client.getShadowsocksCiphers()
client.getRecommendedShadowsocksCipher()
```

### Security
```javascript
client.getSecurityStats()
client.clearBlockedIPs()
client.validateCredentialStrength(credential, type)
client.generateSecureToken()
client.setDevelopmentMode(enabled)
```

---

## Package Information

| | |
|---|---|
| **Version** | 3.0.0 |
| **License** | MIT |
| **Node.js** | ≥ 16.0.0 |
| **3x-ui compatibility** | All versions (token auth requires v3.0.2+) |
| **npm** | [3xui-api-client](https://www.npmjs.com/package/3xui-api-client) |
| **GitHub** | [iamhelitha/3xui-api-client](https://github.com/iamhelitha/3xui-api-client) |

---

*Last updated: June 2026*
