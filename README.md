# 3xui-api-client

A Node.js client library for 3x-ui panel API that provides easy-to-use methods for managing your 3x-ui server.

[![npm version](https://badge.fury.io/js/3xui-api-client.svg)](https://badge.fury.io/js/3xui-api-client)
[![npm downloads](https://img.shields.io/npm/dm/3xui-api-client.svg)](https://www.npmjs.com/package/3xui-api-client)
[![GitHub stars](https://img.shields.io/github/stars/iamhelitha/3xui-api-client.svg)](https://github.com/iamhelitha/3xui-api-client)
[![Node.js Version](https://img.shields.io/node/v/3xui-api-client.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/iamhelitha/3xui-api-client/graphs/commit-activity)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Context7 MCP Integration

This library is available through **[Context7 MCP](https://context7.com/iamhelitha/3xui-api-client)** for enhanced development experience with intelligent documentation integration. Use the package name `3xui-api-client` to get AI-powered context and documentation.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Methods](#api-methods)
- [Documentation](#documentation)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [Testing](#testing)
- [FAQ](#faq)
- [License](#license)

## Features

- ✅ **Dual Panel Support** - Works with both modern (React, v2.x+) and legacy (Vue, v1.x) 3x-ui panels
- ✅ **Auto-Detection** - Automatically detects panel version and uses correct endpoints
- ✅ **API Token Authentication** - Support for API token auth (3x-ui v3.0.2+) and cookie-based login
- ✅ **Automatic Credential Generation** - Built-in UUID, password, and key pair generators
- ✅ **Session Management** - Automatic login, session caching, and expiry handling
- ✅ **Security** - Input validation, secure headers, rate limiting, and error sanitization
- ✅ **Modern API Support** - Complete modern API (v2.x+) with advanced client management
- ✅ **Legacy API Support** - Full backward compatibility with legacy API methods
- ✅ **TypeScript Definitions** - Complete type definitions for IDE support
- ✅ **124 API Methods** - Comprehensive coverage of all 3x-ui panel operations

## Installation

```bash
npm install 3xui-api-client
```

## Quick Start

### Cookie-Based Authentication

```javascript
const ThreeXUI = require('3xui-api-client');

const client = new ThreeXUI('https://your-3xui-server.com', 'username', 'password');

// Get all inbounds
const inbounds = await client.getInbounds();
console.log(inbounds);
```

### API Token Authentication (v3.0.2+)

```javascript
const client = new ThreeXUI('https://your-3xui-server.com', {
  token: 'your-api-token'
});

const inbounds = await client.getInbounds();
```

### Panel Version Support

This library **automatically supports both modern and legacy 3x-ui panels**:

```javascript
// Automatic detection (recommended)
// Works with both modern and legacy panels
const client = new ThreeXUI('https://your-3xui-server.com', 'username', 'password');
await client.login();
// Automatically detects panel version and uses correct endpoints

// Explicit version (optional, for performance)
const client = new ThreeXUI('https://your-3xui-server.com', 'username', 'password', {
  panelVersion: 'modern'  // or 'legacy' or 'auto' (default)
});
```

**Supported Panel Types:**
- ✅ **Modern Panels** - React-based, v2.x+ with `/panel/api/*` endpoints
- ✅ **Legacy Panels** - Vue-based, v1.x with `/login` endpoint
- ✅ **Auto-Detection** - Tries modern first, falls back to legacy if needed
- ✅ **Session Caching** - Detected version is cached for faster subsequent logins

See [PANEL-VERSION-SUPPORT.md](./PANEL-VERSION-SUPPORT.md) for detailed version support documentation.

## API Methods

### Client Management (Modern API - v2.x+)

#### Read Operations
- `getClients()` - Get all clients
- `getPagedClients(params)` - Get paginated client list
- `getClient(email)` - Get specific client by email
- `getClientTraffic(email)` - Get client traffic statistics
- `getSubLinks(subId)` - Get subscription links by subscription ID
- `getClientLinks(email)` - Get generic client links
- `getGroups()` - Get all client groups
- `getGroupEmails(groupName)` - Get emails in specific group
- `getOnlines()` - Get currently online clients
- `getModernLastOnline()` - Get last online status
- `getModernClientIps(email)` - Get client IP list

#### Write Operations
- `addModernClient(data)` - Add new client (modern API)
- `updateModernClient(email, data)` - Update client details
- `deleteModernClient(email)` - Delete client
- `attachClientToInbounds(email, data)` - Attach client to inbounds
- `detachClientFromInbounds(email, data)` - Detach client from inbounds
- `resetModernClientTrafficByEmail(email)` - Reset client traffic
- `updateModernClientTrafficByEmail(email, data)` - Update traffic limits
- `clearModernClientIps(email)` - Clear client IP restrictions

#### Bulk Operations
- `bulkCreateModernClients(data)` - Bulk create clients
- `bulkDeleteModernClients(data)` - Bulk delete clients
- `bulkAttachModernClients(data)` - Bulk attach to inbounds
- `bulkDetachModernClients(data)` - Bulk detach from inbounds
- `bulkAdjustModernClients(data)` - Bulk adjust settings
- `bulkResetTrafficModernClients(data)` - Bulk reset traffic
- `resetAllModernClientTraffics()` - Reset all client traffic
- `deleteDepletedModernClients()` - Delete depleted clients

#### Group Management
- `createGroup(data)` - Create client group
- `renameGroup(data)` - Rename existing group
- `deleteGroup(data)` - Delete group
- `bulkAddGroups(data)` - Bulk add groups
- `bulkRemoveGroups(data)` - Bulk remove groups

### Client Management (Legacy API)

- `addClient(clientConfig)` - Add client
- `updateClient(clientId, clientConfig)` - Update client
- `deleteClient(inboundId, clientId)` - Delete client
- `deleteClientByEmail(inboundId, email)` - Delete by email
- `getClientTrafficsByEmail(email)` - Get traffic by email
- `getClientTrafficsById(id)` - Get traffic by ID
- `getClientIps(email)` - Get client IPs
- `clearClientIps(email)` - Clear IP restrictions
- `updateClientTraffic(email, trafficConfig)` - Update traffic limits
- `resetClientTraffic(inboundId, email)` - Reset traffic
- `resetAllTraffics()` - Reset all traffic globally
- `resetAllClientTraffics(inboundId)` - Reset inbound traffic
- `deleteDepletedClients(inboundId)` - Delete depleted clients

### Inbound Management

- `getInbounds()` - Get all inbounds
- `getInbound(id)` - Get specific inbound
- `addInbound(inboundConfig)` - Add new inbound
- `updateInbound(id, inboundConfig)` - Update inbound
- `deleteInbound(id)` - Delete inbound
- `importInbounds(inbounds)` - Bulk import inbounds
- `getLastOnline()` - Get last online info

### Node Management

- `getNodes()` - Get all nodes
- `getNode(id)` - Get specific node
- `getNodeHistory(id, metric, bucket)` - Get node metrics history
- `addNode(data)` - Add new node
- `updateNode(id, data)` - Update node
- `deleteNode(id)` - Delete node
- `setNodeEnable(id)` - Enable node
- `testNode(data)` - Test node connectivity
- `probeNode(id)` - Probe node status

### Custom Geo Management

- `getCustomGeos()` - Get custom geo sites/IPs
- `getGeoAliases()` - Get geo aliases
- `addCustomGeo(data)` - Add custom geo
- `updateCustomGeo(id, data)` - Update geo
- `deleteCustomGeo(id)` - Delete geo
- `downloadCustomGeo(id)` - Download geo data
- `updateAllCustomGeo()` - Update all geo data

### Server Management

- `getServerStatus()` - Get CPU, RAM, uptime
- `getCPUHistory(bucket)` - Get CPU usage history
- `getXrayVersion()` - Get Xray version
- `getConfigJson()` - Get Xray config JSON
- `getDb()` - Download database
- `stopXrayService()` - Stop Xray core
- `restartXrayService()` - Restart Xray core
- `installXray(version)` - Install specific Xray version
- `getPanelLogs(count)` - Get panel logs
- `getXrayLogs(count)` - Get Xray logs
- `updateGeofile(fileName)` - Update GeoIP/GeoSite files
- `importDB(formData)` - Import database

### Panel Settings

- `getAllSettings()` - Get all panel settings
- `updateSetting(settings)` - Update settings
- `updateUser(oldUsername, oldPassword, newUsername, newPassword)` - Change admin credentials
- `restartPanel()` - Restart panel
- `getDefaultSettings()` - Get default settings
- `getDefaultJsonConfig()` - Get default Xray JSON config

### Xray Configuration

- `getXrayConfig()` - Get Xray configuration
- `updateXrayConfig(config)` - Update Xray configuration
- `manageWarp(action, data)` - Manage WARP settings
- `getOutboundsTraffic()` - Get outbound traffic statistics
- `resetOutboundsTraffic()` - Reset outbound traffic
- `getXrayResult()` - Get Xray execution result

### Server-Side Generators

- `getNewUUID()` - Generate UUID server-side
- `getNewX25519Cert()` - Generate X25519 certificate
- `getNewmldsa65()` - Generate MLDSA65 key
- `getNewmlkem768()` - Generate ML-KEM-768 key
- `getNewVlessEnc()` - Generate VLESS encryption
- `getNewEchCert()` - Generate ECH certificate

### Credential Generation

- `generateCredentials(protocol, options)` - Generate protocol-specific credentials
- `generateUUID(secure)` - Generate UUID
- `generatePassword(length, options)` - Generate password
- `generateBulkCredentials(protocol, count, options)` - Bulk generate credentials
- `generateWireGuardKeys()` - Generate WireGuard key pair
- `generateRealityKeys()` - Generate Reality key pair
- `generatePort(min, max)` - Generate random port
- `getShadowsocksCiphers()` - List SS cipher methods
- `getRecommendedShadowsocksCipher()` - Get recommended cipher
- `validateCredentials(credentials, protocol)` - Validate credentials

### Enhanced Client Management

- `addClientWithCredentials(inboundId, protocol, options)` - Add client with auto-generated credentials
- `updateClientWithCredentials(clientId, inboundId, options)` - Update client with credential management

### Session Management

- `login(forceRefresh)` - Authenticate with credentials/token
- `logout()` - Clear session
- `isSessionValid()` - Check session validity
- `getSessionStats()` - Get session statistics
- `clearAllSessions()` - Clear all cached sessions
- `getTwoFactorEnable()` - Check 2FA status

### System

- `getOnlineClients()` - Get online clients
- `createBackup()` - Create system backup
- `backupToTgBot()` - Send backup to Telegram
- `getSecurityStats()` - Get security monitoring data

## Documentation

For comprehensive guides, examples, and implementation patterns, visit our **[Wiki](https://github.com/iamhelitha/3xui-api-client/wiki)**:

- 📚 [Use Cases & Examples](https://github.com/iamhelitha/3xui-api-client/wiki/Use-Cases)
- 🔐 [Authentication Guide](https://github.com/iamhelitha/3xui-api-client/wiki/Authentication-Guide)
- 🌐 [Inbound Management](https://github.com/iamhelitha/3xui-api-client/wiki/Inbound-Management)
- 👥 [Client Management](https://github.com/iamhelitha/3xui-api-client/wiki/Client-Management)
- 📊 [Traffic Management](https://github.com/iamhelitha/3xui-api-client/wiki/Traffic-Management)
- ⚙️ [System Operations](https://github.com/iamhelitha/3xui-api-client/wiki/System-Operations)
- 🌐 [Modern API Guide](https://github.com/iamhelitha/3xui-api-client/wiki/Modern-API)

## Requirements

- Node.js >= 14.0.0
- 3x-ui panel v2.0+ (or v3.0.2+ for API token authentication)
- API access enabled on your 3x-ui server

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run login test
npm run test:login

# Run all tests
npm test
```

## FAQ

**Q: Do I need to call `login()` explicitly?**
A: No, the client automatically logs in before the first API call. Just create the client and start using it.

**Q: Can I use API tokens instead of username/password?**
A: Yes, use `{ token: 'your-api-token' }` instead of username/password (requires 3x-ui v3.0.2+).

**Q: How do I store session cookies securely?**
A: See the [Authentication Guide](https://github.com/iamhelitha/3xui-api-client/wiki/Authentication-Guide) for server-side session storage patterns.

**Q: Which authentication method is more secure?**
A: API tokens are recommended for production. See [Authentication Guide](https://github.com/iamhelitha/3xui-api-client/wiki/Authentication-Guide) for comparison.

**Q: Can I use the client in browsers?**
A: No, this is a Node.js library. Use it on your server side with proper CORS/security headers.

**Q: How do I migrate from v2.x to v3.x?**
A: The library is backward compatible. See [CHANGELOG.md](CHANGELOG.md) for breaking changes (if any).

**Q: Can I bulk operations with this client?**
A: Yes, use the `bulk*` methods for efficient batch operations. See [Client Management](https://github.com/iamhelitha/3xui-api-client/wiki/Client-Management) for examples.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Wiki & Documentation](https://github.com/iamhelitha/3xui-api-client/wiki)
- 🐛 [Report Issues](https://github.com/iamhelitha/3xui-api-client/issues)
- 💬 [Discussions](https://github.com/iamhelitha/3xui-api-client/discussions)

## Author

**Helitha Guruge** - [@iamhelitha](https://github.com/iamhelitha)

---

⚠️ **Security Notice**: Always store credentials and session cookies securely. Never expose them in client-side code or commit them to version control.
