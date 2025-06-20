# 3xui-api-client

A Node.js client library for 3x-ui panel API that provides easy-to-use methods for managing your 3x-ui server.

[![npm version](https://badge.fury.io/js/3xui-api-client.svg)](https://badge.fury.io/js/3xui-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Authentication** - Secure login with automatic session management
- ✅ **Inbound Management** - Get, add, update, and delete inbounds
- ✅ **Client Management** - Add, update, delete clients and monitor traffic
- ✅ **Traffic Management** - Monitor, reset, and manage traffic limits
- ✅ **System Operations** - Backup creation and online client monitoring
- ✅ **Complete API Coverage** - All 19 API routes fully tested and working

## Installation

```bash
npm install 3xui-api-client
```

## Context7 MCP Integration

This library can be implemented with the help of [Context7 MCP](https://context7.com/iamhelitha/3xui-api-client). Use the package name `3xui-api-client` to get context and documentation through Context7's Model Context Protocol integration.

Learn more about [Context7 MCP](https://context7.com) for enhanced development experience.

## Quick Start

```javascript
const ThreeXUI = require('3xui-api-client');

const client = new ThreeXUI('https://your-3xui-server.com', 'username', 'password');

// Get all inbounds
client.getInbounds()
  .then(inbounds => {
    console.log('Inbounds:', inbounds);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

## Authentication & Security

### Automatic Login
The client automatically handles authentication. When you make your first API call, it will:
1. Login with your credentials
2. Store the session cookie
3. Use the cookie for subsequent requests
4. Automatically re-login if the session expires

### Server-Side Cookie Storage (Recommended)
For production applications, store the session cookie securely on your server:

```javascript
const ThreeXUI = require('3xui-api-client');

class SecureThreeXUIManager {
  constructor(baseURL, username, password) {
    this.client = new ThreeXUI(baseURL, username, password);
    this.sessionCookie = null;
  }

  async ensureAuthenticated() {
    if (!this.sessionCookie) {
      const loginResult = await this.client.login();
      this.sessionCookie = this.client.cookie;
      
      // Store in secure session storage (Redis, database, etc.)
      await this.storeSessionSecurely(this.sessionCookie);
    } else {
      // Restore from secure storage
      this.client.cookie = this.sessionCookie;
      this.client.api.defaults.headers.Cookie = this.sessionCookie;
    }
  }

  async storeSessionSecurely(cookie) {
    // Example: Store in Redis with expiration
    // await redis.setex('3xui_session', 3600, cookie);
    
    // Example: Store in database
    // await db.sessions.upsert({ service: '3xui', cookie, expires_at: new Date(Date.now() + 3600000) });
  }

  async getInbounds() {
    await this.ensureAuthenticated();
    return this.client.getInbounds();
  }
}
```

## API Reference

### Constructor
```javascript
new ThreeXUI(baseURL, username, password)
```

- `baseURL` (string): Your 3x-ui server URL (e.g., 'https://your-server.com')
- `username` (string): Admin username
- `password` (string): Admin password

### Inbound Management (✅ Tested & Working)

#### Get All Inbounds
```javascript
const inbounds = await client.getInbounds();
console.log(inbounds);
```

#### Get Specific Inbound
```javascript
const inbound = await client.getInbound(inboundId);
console.log(inbound);
```

#### Add New Inbound
```javascript
const inboundConfig = {
  remark: "My VPN Server",
  port: 443,
  protocol: "vless",
  settings: {
    // Your inbound settings
  }
};

const result = await client.addInbound(inboundConfig);
console.log('Inbound added:', result);
```

#### Update Inbound
```javascript
const updatedConfig = {
  remark: "Updated VPN Server",
  // Other updated settings
};

const result = await client.updateInbound(inboundId, updatedConfig);
console.log('Inbound updated:', result);
```

#### Delete Inbound
```javascript
const result = await client.deleteInbound(inboundId);
console.log('Inbound deleted:', result);
```

### Client Management (✅ Tested & Working)

#### Add Client to Inbound
```javascript
const clientConfig = {
  id: inboundId,
  settings: JSON.stringify({
    clients: [{
      id: "client-uuid-here",
      email: "user23c5n7",
      limitIp: 0,
      totalGB: 0,
      expiryTime: 0,
      enable: true
    }]
  })
};

const result = await client.addClient(clientConfig);
```

#### Update Client
```javascript
const updateConfig = {
  id: inboundId,
  settings: JSON.stringify({
    clients: [/* updated client settings */]
  })
};

const result = await client.updateClient(clientUUID, updateConfig);
```

#### Delete Client
```javascript
const result = await client.deleteClient(inboundId, clientUUID);
```

#### Get Client Traffic by Email
```javascript
const traffic = await client.getClientTrafficsByEmail("user23c5n7");
console.log('Client traffic:', traffic);
```

#### Get Client Traffic by UUID
```javascript
const traffic = await client.getClientTrafficsById("client-uuid");
console.log('Client traffic:', traffic);
```

#### Manage Client IPs
```javascript
// Get client IPs
const ips = await client.getClientIps("user23c5n7");

// Clear client IPs
const result = await client.clearClientIps("user23c5n7");
```

### Traffic Management (✅ Tested & Working)

#### Reset Individual Client Traffic
```javascript
const result = await client.resetClientTraffic(inboundId, "user23c5n7");
```

#### Reset All Traffic (Global)
```javascript
const result = await client.resetAllTraffics();
```

#### Reset All Client Traffic in Inbound
```javascript
const result = await client.resetAllClientTraffics(inboundId);
```

#### Delete Depleted Clients
```javascript
const result = await client.deleteDepletedClients(inboundId);
```

### System Operations (✅ Tested & Working)

#### Get Online Clients
```javascript
const onlineClients = await client.getOnlineClients();
console.log('Currently online:', onlineClients);
```

#### Create System Backup
```javascript
const result = await client.createBackup();
console.log('Backup created:', result);
```

## Documentation

For comprehensive guides, examples, and implementation patterns, visit our [Wiki](https://github.com/iamhelitha/3xui-api-client/wiki):

- 📚 [**Use Cases & Examples**](https://github.com/iamhelitha/3xui-api-client/wiki/Use-Cases) - VPN service provider, server administration, monitoring dashboards
- 🔐 [**Authentication Guide**](https://github.com/iamhelitha/3xui-api-client/wiki/Authentication-Guide) - Secure login and session management  
- 🌐 [**Inbound Management**](https://github.com/iamhelitha/3xui-api-client/wiki/Inbound-Management) - Server configuration and setup
- 👥 [**Client Management**](https://github.com/iamhelitha/3xui-api-client/wiki/Client-Management) - User account operations
- 📊 [**Traffic Management**](https://github.com/iamhelitha/3xui-api-client/wiki/Traffic-Management) - Usage monitoring and billing
- ⚙️ [**System Operations**](https://github.com/iamhelitha/3xui-api-client/wiki/System-Operations) - Backup and maintenance

## Error Handling

```javascript
try {
  const inbounds = await client.getInbounds();
  console.log(inbounds);
} catch (error) {
  if (error.message.includes('Login failed')) {
    console.error('Authentication error:', error.message);
  } else if (error.response?.status === 401) {
    console.error('Unauthorized - check your credentials');
  } else {
    console.error('API error:', error.message);
  }
}
```

## Requirements

- Node.js >= 14.0.0
- 3x-ui panel with API access enabled

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run login test
npm run test:login

# Run all tests
npm test
```



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