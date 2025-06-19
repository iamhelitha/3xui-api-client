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
      email: "user@example.com",
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
const traffic = await client.getClientTrafficsByEmail("user@example.com");
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
const ips = await client.getClientIps("user@example.com");

// Clear client IPs
const result = await client.clearClientIps("user@example.com");
```

### Traffic Management (✅ Tested & Working)

#### Reset Individual Client Traffic
```javascript
const result = await client.resetClientTraffic(inboundId, "user@example.com");
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

## Use Cases

### VPN Service Provider
```javascript
const ThreeXUI = require('3xui-api-client');

class VPNServiceManager {
  constructor() {
    this.client = new ThreeXUI(process.env.XUI_URL, process.env.XUI_USER, process.env.XUI_PASS);
  }

  // Create new customer account
  async createCustomerAccount(email, dataLimitGB = 50) {
    // 1. Get available inbound
    const inbounds = await this.client.getInbounds();
    const activeInbound = inbounds.obj.find(i => i.enable);

    // 2. Add client to inbound
    const clientConfig = {
      id: activeInbound.id,
      settings: JSON.stringify({
        clients: [{
          id: this.generateUUID(),
          email: email,
          limitIp: 2,
          totalGB: dataLimitGB,
          expiryTime: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
          enable: true
        }]
      })
    };

    return await this.client.addClient(clientConfig);
  }

  // Monthly billing cycle
  async processBillingCycle() {
    const inbounds = await this.client.getInbounds();
    
    for (const inbound of inbounds.obj) {
      if (inbound.clientStats) {
        for (const client of inbound.clientStats) {
          // Reset traffic for active subscriptions
          await this.client.resetClientTraffic(inbound.id, client.email);
        }
      }
    }
  }

  // Monitor usage and send alerts
  async monitorUsage() {
    const onlineClients = await this.client.getOnlineClients();
    
    for (const client of onlineClients.obj || []) {
      const traffic = await this.client.getClientTrafficsByEmail(client.email);
      
      if (traffic.obj && traffic.obj.total > (40 * 1024 * 1024 * 1024)) { // 40GB
        console.log(`⚠️ Client ${client.email} approaching data limit`);
        // Send notification to customer
      }
    }
  }
}
```

### Server Administration
```javascript
class ServerAdmin {
  constructor() {
    this.client = new ThreeXUI(process.env.XUI_URL, process.env.XUI_USER, process.env.XUI_PASS);
  }

  // Daily maintenance
  async dailyMaintenance() {
    // 1. Create backup
    await this.client.createBackup();
    
    // 2. Clean up depleted clients
    const inbounds = await this.client.getInbounds();
    for (const inbound of inbounds.obj) {
      await this.client.deleteDepletedClients(inbound.id);
    }
    
    // 3. Generate usage report
    const report = await this.generateUsageReport();
    console.log('Daily Report:', report);
  }

  // Setup new VPN server
  async setupNewServer(port, protocol = 'vless') {
    const serverConfig = {
      remark: `VPN-Server-${port}`,
      port: port,
      protocol: protocol,
      settings: {
        clients: [],
        decryption: "none",
        fallbacks: []
      },
      streamSettings: {
        network: "tcp",
        security: "reality",
        realitySettings: {
          dest: "google.com:443",
          serverNames: ["google.com"]
        }
      }
    };

    return await this.client.addInbound(serverConfig);
  }
}
```

### Real-Time Monitoring Dashboard
```javascript
class MonitoringDashboard {
  constructor() {
    this.client = new ThreeXUI(process.env.XUI_URL, process.env.XUI_USER, process.env.XUI_PASS);
  }

  async getDashboardData() {
    const [inbounds, onlineClients] = await Promise.all([
      this.client.getInbounds(),
      this.client.getOnlineClients()
    ]);

    return {
      totalInbounds: inbounds.obj.length,
      activeInbounds: inbounds.obj.filter(i => i.enable).length,
      totalClients: inbounds.obj.reduce((sum, i) => sum + (i.clientStats?.length || 0), 0),
      onlineClients: onlineClients.obj?.length || 0,
      totalTraffic: inbounds.obj.reduce((sum, i) => sum + i.total, 0)
    };
  }

  // WebSocket endpoint for real-time updates
  async startRealTimeUpdates(ws) {
    setInterval(async () => {
      const data = await this.getDashboardData();
      ws.send(JSON.stringify(data));
    }, 30000); // Update every 30 seconds
  }
}
```

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

## Documentation

For detailed guides and examples, visit our [Wiki](https://github.com/iamhelitha/3xui-api-client/wiki).

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