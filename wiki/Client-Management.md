# Client Management Guide

✅ **Status**: Fully tested and working

This guide covers all client management operations using the 3xui-api-client library. Clients are individual users within inbounds who have their own UUIDs, traffic limits, and access permissions.

## Table of Contents
- [Overview](#overview)
- [Adding Clients](#adding-clients)
- [Updating Client Configuration](#updating-client-configuration)
- [Deleting Clients](#deleting-clients)
- [Getting Client Traffic by Email](#getting-client-traffic-by-email)
- [Getting Client Traffic by UUID](#getting-client-traffic-by-uuid)
- [Managing Client IPs](#managing-client-ips)
- [Clearing Client IPs](#clearing-client-ips)
- [Server-Side Implementation](#server-side-implementation)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

Client management allows you to add, modify, and remove individual users within existing inbounds. Each client has:
- Unique UUID for connection authentication
- Email identifier for management
- Traffic limits and monitoring
- IP restrictions and logging
- Enable/disable status

⚠️ **Important**: This package is **server-side only** due to session cookie security requirements.

## Adding Clients

Add a new client to an existing inbound:

```javascript
const ThreeXUI = require('3xui-api-client');

class SecureClientManager {
  constructor(serverUrl, username, password, database) {
    this.client = new ThreeXUI(serverUrl, username, password);
    this.db = database;
  }

  async addClient(inboundId, clientConfig) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.client.addClient(clientConfig);
      
      if (response.success) {
        console.log('✅ Client added successfully');
        
        // Store client details in your database
        await this.db.clients.create({
          inboundId: inboundId,
          uuid: clientConfig.id,
          email: clientConfig.email,
          createdAt: new Date()
        });
        
        return response;
      } else {
        console.error('❌ Failed to add client:', response.msg);
        return response;
      }
    } catch (error) {
      console.error('❌ Error adding client:', error.message);
      throw error;
    }
  }

  async ensureAuthenticated() {
    // Implement session validation with your database
    const session = await this.db.sessions.findValid();
    if (!session) {
      await this.client.login();
      // Store new session in database
    }
  }
}

// Usage example
const clientManager = new SecureClientManager(
  process.env.XUI_BASE_URL,
  process.env.XUI_USERNAME,
  process.env.XUI_PASSWORD,
  database
);

const newClientConfig = {
  id: 10, // Inbound ID
  settings: JSON.stringify({
    clients: [{
      id: "f5eb5844-dc57-412b-9ec2-82d37e0ebb9c", // UUID
      email: "client_1750362432108@example.com",
      limitIp: 0,
      totalGB: 0,
      expiryTime: 0,
      enable: true,
      tgId: "",
      subId: ""
    }]
  })
};

try {
  const result = await clientManager.addClient(10, newClientConfig);
  console.log('Add client result:', result);
} catch (error) {
  console.error('Failed to add client:', error.message);
}
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "Inbound client(s) have been added.",
  "obj": null
}
```

## Updating Client Configuration

Update an existing client's settings:

```javascript
async function updateClient(clientUUID, inboundId, updates) {
  try {
    // Get current inbound configuration
    const inboundResponse = await client.getInbound(inboundId);
    if (!inboundResponse.success) {
      throw new Error('Failed to get inbound details');
    }
    
    const inbound = inboundResponse.obj;
    const settings = JSON.parse(inbound.settings);
    
    // Find and update the specific client
    const clientIndex = settings.clients.findIndex(c => c.id === clientUUID);
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }
    
    // Apply updates while preserving other properties
    Object.assign(settings.clients[clientIndex], updates);
    
    const updateConfig = {
      id: inboundId,
      settings: JSON.stringify(settings)
    };
    
    const response = await client.updateClient(clientUUID, updateConfig);
    
    if (response.success) {
      console.log('✅ Client updated successfully');
      console.log('Updated client:', settings.clients[clientIndex]);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error updating client:', error.message);
    throw error;
  }
}

// Example: Update client email and traffic limit
const updates = {
  email: "updated_1750362315180@example.com",
  limitIp: 2,
  totalGB: 10
};

const result = await updateClient(
  "f5eb5844-dc57-412b-9ec2-82d37e0ebb9c", // Client UUID
  10, // Inbound ID
  updates
);
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "Inbound client has been updated.",
  "obj": null
}
```

## Deleting Clients

Remove a client from an inbound:

```javascript
async function deleteClient(inboundId, clientUUID) {
  try {
    const response = await client.deleteClient(inboundId, clientUUID);
    
    if (response.success) {
      console.log('✅ Client deleted successfully');
      
      // Remove from your database
      await database.clients.delete({
        inboundId: inboundId,
        uuid: clientUUID
      });
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error deleting client:', error.message);
    throw error;
  }
}

// Usage
const result = await deleteClient(10, "f5eb5844-dc57-412b-9ec2-82d37e0ebb9c");
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "Inbound client has been deleted.",
  "obj": null
}
```

## Getting Client Traffic by Email

Retrieve traffic statistics for a specific client using their email:

```javascript
async function getClientTrafficsByEmail(email) {
  try {
    const response = await client.getClientTrafficsByEmail(email);
    
    if (response.success) {
      const clientData = response.obj;
      
      if (clientData) {
        console.log('📊 Client Traffic Stats:');
        console.log(`  Email: ${clientData.email}`);
        console.log(`  Client ID: ${clientData.id}`);
        console.log(`  Inbound ID: ${clientData.inboundId}`);
        console.log(`  Enabled: ${clientData.enable}`);
        console.log(`  Upload: ${clientData.up} bytes`);
        console.log(`  Download: ${clientData.down} bytes`);
        console.log(`  Total: ${clientData.total} bytes`);
        console.log(`  Expiry: ${clientData.expiryTime === 0 ? 'Never' : new Date(clientData.expiryTime)}`);
        console.log(`  Reset Count: ${clientData.reset}`);
      } else {
        console.log('No traffic data found for this email');
      }
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error getting client traffic:', error.message);
    throw error;
  }
}

// Usage
const traffic = await getClientTrafficsByEmail("me9absl6");
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "",
  "obj": {
    "id": 5,
    "inboundId": 5,
    "enable": true,
    "email": "me9absl6",
    "up": 0,
    "down": 0,
    "expiryTime": 0,
    "total": 0,
    "reset": 0
  }
}
```

## Getting Client Traffic by UUID

Retrieve traffic statistics using the client's UUID:

```javascript
async function getClientTrafficsById(clientUUID) {
  try {
    const response = await client.getClientTrafficsById(clientUUID);
    
    if (response.success) {
      const clientsData = response.obj;
      
      if (Array.isArray(clientsData) && clientsData.length > 0) {
        console.log('📊 Client Traffic by UUID:');
        clientsData.forEach(clientData => {
          console.log(`  Email: ${clientData.email}`);
          console.log(`  Client ID: ${clientData.id}`);
          console.log(`  Inbound ID: ${clientData.inboundId}`);
          console.log(`  Upload: ${clientData.up} bytes`);
          console.log(`  Download: ${clientData.down} bytes`);
          console.log(`  Total: ${clientData.total} bytes`);
        });
      } else {
        console.log('No traffic data found for this UUID');
      }
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error getting client traffic by ID:', error.message);
    throw error;
  }
}

// Usage
const traffic = await getClientTrafficsById("f4d6d8ca-04f7-4df2-97ed-7d4984ffeacd");
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "",
  "obj": [
    {
      "id": 5,
      "inboundId": 5,
      "enable": true,
      "email": "me9absl6",
      "up": 0,
      "down": 0,
      "expiryTime": 0,
      "total": 0,
      "reset": 0
    }
  ]
}
```

## Managing Client IPs

Get the IP addresses that a client has connected from:

```javascript
async function getClientIps(email) {
  try {
    const response = await client.getClientIps(email);
    
    if (response.success) {
      const ipData = response.obj;
      
      if (ipData && ipData !== "No IP Record") {
        console.log(`📍 IP addresses for ${email}:`, ipData);
      } else {
        console.log(`No IP records found for ${email}`);
      }
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error getting client IPs:', error.message);
    throw error;
  }
}

// Usage
const ips = await getClientIps("me9absl6");
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "",
  "obj": "No IP Record"
}
```

## Clearing Client IPs

Clear all recorded IP addresses for a specific client:

```javascript
async function clearClientIps(email) {
  try {
    // Confirm the operation first
    console.log(`⚠️ WARNING: This will clear all IP records for ${email}`);
    
    const response = await client.clearClientIps(email);
    
    if (response.success) {
      console.log('✅ Client IP records cleared successfully');
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error clearing client IPs:', error.message);
    throw error;
  }
}

// Usage with confirmation
const result = await clearClientIps("me9absl6");
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "The log has been cleared.",
  "obj": null
}
```

## Server-Side Implementation

Here's a complete server-side implementation for secure client management:

```javascript
const ThreeXUI = require('3xui-api-client');

class SecureClientManager {
  constructor(serverUrl, username, password, database) {
    this.client = new ThreeXUI(serverUrl, username, password);
    this.db = database;
  }

  async ensureAuthenticated() {
    const session = await this.db.sessions.findOne({
      where: { 
        server_url: this.client.baseURL,
        expires_at: { $gt: new Date() }
      }
    });

    if (!session) {
      await this.client.login();
      await this.db.sessions.create({
        server_url: this.client.baseURL,
        session_cookie: this.client.cookie,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 3600000) // 1 hour
      });
    } else {
      this.client.cookie = session.session_cookie;
      this.client.api.defaults.headers.Cookie = session.session_cookie;
    }
  }

  async createClientAccount(inboundId, userEmail, options = {}) {
    await this.ensureAuthenticated();

    const clientUUID = this.generateUUID();
    const clientConfig = {
      id: inboundId,
      settings: JSON.stringify({
        clients: [{
          id: clientUUID,
          email: userEmail,
          limitIp: options.limitIp || 0,
          totalGB: options.totalGB || 0,
          expiryTime: options.expiryTime || 0,
          enable: true,
          tgId: options.tgId || "",
          subId: options.subId || ""
        }]
      })
    };

    try {
      const response = await this.client.addClient(clientConfig);
      
      if (response.success) {
        // Store client in database
        await this.db.clients.create({
          uuid: clientUUID,
          email: userEmail,
          inbound_id: inboundId,
          created_at: new Date(),
          ...options
        });
      }
      
      return {
        success: response.success,
        uuid: clientUUID,
        email: userEmail,
        message: response.msg
      };
    } catch (error) {
      throw new Error(`Failed to create client: ${error.message}`);
    }
  }

  async getClientStats(email) {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.client.getClientTrafficsByEmail(email);
      
      if (response.success && response.obj) {
        // Update database with latest stats
        await this.db.clients.update(
          { email: email },
          {
            upload_bytes: response.obj.up,
            download_bytes: response.obj.down,
            total_bytes: response.obj.total,
            last_updated: new Date()
          }
        );
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to get client stats: ${error.message}`);
    }
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

module.exports = SecureClientManager;
```

## Error Handling

Common errors and solutions:

### Authentication Errors
```javascript
try {
  const response = await client.addClient(config);
} catch (error) {
  if (error.message.includes('401')) {
    // Session expired, re-authenticate
    await client.login();
    const response = await client.addClient(config);
  }
}
```

### Client Not Found Errors
```javascript
const response = await client.getClientTrafficsByEmail("nonexistent@example.com");
if (response.success && !response.obj) {
  console.log('Client not found');
}
```

### Invalid Configuration Errors
```javascript
try {
  await client.addClient(invalidConfig);
} catch (error) {
  if (error.message.includes('json: cannot unmarshal')) {
    console.error('Invalid configuration format. Check your settings JSON structure.');
  }
}
```

## Best Practices

### 1. Session Management
```javascript
// Store session in database
await database.sessions.upsert({
  server_url: client.baseURL,
  session_cookie: client.cookie,
  expires_at: new Date(Date.now() + 3600000)
});
```

### 2. Client UUID Generation
```javascript
const crypto = require('crypto');

function generateSecureUUID() {
  return crypto.randomUUID();
}
```

### 3. Traffic Monitoring
```javascript
async function monitorClientUsage(email) {
  const stats = await client.getClientTrafficsByEmail(email);
  
  if (stats.success && stats.obj) {
    const usage = stats.obj;
    const limitGB = await database.clients.findOne({ email }).totalGB;
    
    if (limitGB > 0 && usage.total > (limitGB * 1024 * 1024 * 1024)) {
      console.log(`⚠️ Client ${email} has exceeded their data limit`);
      // Implement automatic suspension or notification
    }
  }
}
```

### 4. Batch Operations
```javascript
async function addMultipleClients(inboundId, clients) {
  const results = [];
  
  for (const clientInfo of clients) {
    try {
      const result = await client.addClient({
        id: inboundId,
        settings: JSON.stringify({
          clients: [clientInfo]
        })
      });
      results.push({ email: clientInfo.email, success: result.success });
    } catch (error) {
      results.push({ email: clientInfo.email, success: false, error: error.message });
    }
  }
  
  return results;
}
```

## Use Cases

### Subscription Management System
```javascript
class SubscriptionManager extends SecureClientManager {
  async createSubscription(planId, userEmail) {
    const plan = await this.db.plans.findById(planId);
    
    const clientOptions = {
      limitIp: plan.ip_limit,
      totalGB: plan.data_limit_gb,
      expiryTime: Date.now() + (plan.duration_days * 24 * 60 * 60 * 1000)
    };
    
    return this.createClientAccount(plan.inbound_id, userEmail, clientOptions);
  }

  async renewSubscription(email) {
    const client = await this.db.clients.findOne({ email });
    const plan = await this.db.plans.findById(client.plan_id);
    
    // Reset traffic and extend expiry
    await this.client.resetClientTraffic(client.inbound_id, email);
    
    // Update expiry time
    const newExpiryTime = Date.now() + (plan.duration_days * 24 * 60 * 60 * 1000);
    // Update client configuration with new expiry
  }
}
```

### Automated Client Management
```javascript
async function automatedClientCleanup() {
  // Find expired clients
  const expiredClients = await database.clients.find({
    expiry_time: { $lt: Date.now() },
    status: 'active'
  });

  for (const client of expiredClients) {
    try {
      await xuiClient.deleteClient(client.inbound_id, client.uuid);
      await database.clients.update(
        { uuid: client.uuid },
        { status: 'expired', deleted_at: new Date() }
      );
      console.log(`🗑️ Removed expired client: ${client.email}`);
    } catch (error) {
      console.error(`Failed to remove client ${client.email}:`, error.message);
    }
  }
}

// Run cleanup every hour
setInterval(automatedClientCleanup, 3600000);
```

---

## Navigation

| Previous | Next |
|----------|------|
| [← Inbound Management](Inbound-Management.md) | [Traffic Management →](Traffic-Management.md) |

## Related Documentation

- [Authentication Guide](Authentication-Guide.md) - Connection & session management
- [Inbound Management](Inbound-Management.md) - VPN server configuration
- [Traffic Management](Traffic-Management.md) - Data monitoring & control
- [System Operations](System-Operations.md) - Admin operations
- [Home](Home.md) - Main documentation page

*Last updated: January 2025*
``` 