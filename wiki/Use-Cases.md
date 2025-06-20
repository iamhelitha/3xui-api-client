# Use Cases Guide

✅ **Status**: Fully tested and working

This guide provides comprehensive real-world use cases and implementation examples for the 3xui-api-client library. Each use case includes complete code examples that can be adapted for your specific needs.

## Table of Contents
- [VPN Service Provider](#vpn-service-provider)
- [Server Administration](#server-administration)
- [Real-Time Monitoring Dashboard](#real-time-monitoring-dashboard)
- [Best Practices](#best-practices)

## VPN Service Provider

Complete implementation for managing a VPN service with customer accounts, billing cycles, and usage monitoring:

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

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
```

## Server Administration

Comprehensive server administration class for daily maintenance, monitoring, and server setup:

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

## Real-Time Monitoring Dashboard

WebSocket-based real-time monitoring system:

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

## Best Practices

### Error Handling
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

### Rate Limiting
```javascript
// Add delays between requests to avoid overwhelming the server
async function processClients(clients) {
  for (const client of clients) {
    await processClient(client);
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
  }
}
```

### Session Management
```javascript
class SecureAPIManager {
  constructor() {
    this.client = new ThreeXUI(baseURL, username, password);
    this.sessionExpiry = null;
  }

  async ensureValidSession() {
    if (!this.sessionExpiry || Date.now() > this.sessionExpiry) {
      await this.client.login();
      this.sessionExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes
    }
  }

  async safeRequest(operation, ...args) {
    await this.ensureValidSession();
    return this.client[operation](...args);
  }
}
```

---

## Related Documentation

- [Authentication Guide](Authentication-Guide.md) - Setting up secure authentication
- [Inbound Management](Inbound-Management.md) - Managing VPN server configurations
- [Client Management](Client-Management.md) - Adding and managing users
- [Traffic Management](Traffic-Management.md) - Monitoring and controlling data usage
- [System Operations](System-Operations.md) - Server maintenance and monitoring

## Navigation

| Previous | Home | Next |
|----------|------|------|
| [← System Operations](System-Operations.md) | [🏠 Home](Home.md) | [Traffic Management →](Traffic-Management.md) | 