# Inbound Management Guide

✅ **Status**: Fully tested and working

This guide covers all inbound management operations using the 3xui-api-client library.

## Table of Contents
- [Overview](#overview)
- [Getting All Inbounds](#getting-all-inbounds)
- [Getting a Specific Inbound](#getting-a-specific-inbound)
- [Adding New Inbounds](#adding-new-inbounds)
- [Updating Inbounds](#updating-inbounds)
- [Deleting Inbounds](#deleting-inbounds)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

Inbounds are the entry points for your VPN connections. Each inbound represents a service listening on a specific port with specific protocol settings.

## Getting All Inbounds

Retrieve a list of all configured inbounds:

```javascript
const ThreeXUI = require('3xui-api-client');

const client = new ThreeXUI('https://your-server.com', 'username', 'password');

try {
  const response = await client.getInbounds();
  console.log('Inbounds response:', response);
  
  if (response.success) {
    const inbounds = response.obj;
    console.log(`Found ${inbounds.length} inbounds`);
    
    inbounds.forEach(inbound => {
      console.log(`Inbound ${inbound.id}:`);
      console.log(`  Port: ${inbound.port}`);
      console.log(`  Protocol: ${inbound.protocol}`);
      console.log(`  Enabled: ${inbound.enable}`);
      console.log(`  Clients: ${inbound.clientStats.length}`);
      console.log(`  Traffic: ↑${inbound.up} ↓${inbound.down} bytes`);
      
      // Parse JSON strings for detailed configuration
      const settings = JSON.parse(inbound.settings);
      const streamSettings = JSON.parse(inbound.streamSettings);
      const sniffing = JSON.parse(inbound.sniffing);
      
      console.log(`  Security: ${streamSettings.security}`);
      console.log(`  Network: ${streamSettings.network}`);
    });
  } else {
    console.error('Failed to get inbounds:', response.msg);
  }
  
} catch (error) {
  console.error('Failed to get inbounds:', error.message);
}
```

### Response Example
```javascript
{
  "success": true,
  "msg": "",
  "obj": [
    {
      "id": 3,
      "up": 0,
      "down": 0,
      "total": 0,
      "remark": "",
      "enable": true,
      "expiryTime": 0,
      "clientStats": [
        {
          "id": 3,
          "inboundId": 3,
          "enable": true,
          "email": "hyvcs325",
          "up": 0,
          "down": 0,
          "expiryTime": 0,
          "total": 0,
          "reset": 0
        }
      ],
      "listen": "",
      "port": 37155,
      "protocol": "vless",
      "settings": "{\"clients\":[{\"email\":\"hyvcs325\",\"enable\":true,\"id\":\"819920c0-22c8-4c83-8713-9c3da4980396\",\"subId\":\"jmrwimzhicxm7hrm\"}],\"decryption\":\"none\",\"fallbacks\":[]}",
      "streamSettings": "{\"network\":\"tcp\",\"security\":\"reality\",\"realitySettings\":{\"dest\":\"yahoo.com:443\",\"serverNames\":[\"yahoo.com\"]}}",
      "tag": "inbound-37155",
      "sniffing": "{\"enabled\":false,\"destOverride\":[\"http\",\"tls\",\"quic\",\"fakedns\"]}",
      "allocate": "{\"strategy\":\"always\",\"refresh\":5,\"concurrency\":3}"
    }
  ]
}
```

**Field Descriptions:**
- `id`: Unique inbound identifier
- `up`/`down`/`total`: Traffic statistics in bytes
- `remark`: Human-readable description
- `enable`: Whether inbound is active
- `expiryTime`: Expiration timestamp (0 = no expiry)
- `clientStats`: Array of client statistics and metadata
- `listen`: Listen address (empty = all interfaces)
- `port`: Listening port number
- `protocol`: Protocol type (vless, vmess, trojan, etc.)
- `settings`: JSON string containing protocol-specific settings
- `streamSettings`: JSON string with transport layer configuration
- `tag`: Unique tag for routing rules
- `sniffing`: JSON string with traffic sniffing configuration
- `allocate`: JSON string with port allocation strategy

## Working with Client Statistics

Each inbound includes detailed client statistics in the `clientStats` array:

```javascript
const response = await client.getInbounds();

response.obj.forEach(inbound => {
  console.log(`\nInbound ${inbound.id} (Port ${inbound.port}):`);
  
  if (inbound.clientStats.length > 0) {
    console.log('Clients:');
    inbound.clientStats.forEach(client => {
      console.log(`  📧 ${client.email}:`);
      console.log(`    ID: ${client.id}`);
      console.log(`    Enabled: ${client.enable}`);
      console.log(`    Traffic: ↑${client.up} ↓${client.down} bytes`);
      console.log(`    Total: ${client.total} bytes`);
      console.log(`    Expiry: ${client.expiryTime === 0 ? 'Never' : new Date(client.expiryTime)}`);
      console.log(`    Reset: ${client.reset}`);
    });
    
    // Parse detailed client settings from the settings JSON
    const settings = JSON.parse(inbound.settings);
    settings.clients.forEach(clientConfig => {
      console.log(`  🔑 Client Config for ${clientConfig.email}:`);
      console.log(`    UUID: ${clientConfig.id}`);
      console.log(`    Sub ID: ${clientConfig.subId}`);
      console.log(`    IP Limit: ${clientConfig.limitIp}`);
      console.log(`    Data Limit: ${clientConfig.totalGB}GB`);
    });
  } else {
    console.log('  No clients configured');
  }
});
```

## Getting a Specific Inbound

Retrieve details for a specific inbound by its ID:

```javascript
try {
  const inboundId = 3;
  const response = await client.getInbound(inboundId);
  
  if (response.success) {
    const inbound = response.obj;
    console.log('Inbound details:', inbound);
    
    // Parse configuration objects
    const settings = JSON.parse(inbound.settings);
    const streamSettings = JSON.parse(inbound.streamSettings);
    
    console.log('Parsed settings:', settings);
    console.log('Stream settings:', streamSettings);
  }
} catch (error) {
  console.error('Failed to get inbound:', error.message);
}
```

## Adding New Inbounds

Create a new inbound with your desired configuration:

### Basic VLESS Example
```javascript
const inboundConfig = {
  remark: "My New VPN Server",
  port: 8443,
  protocol: "vless",
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
      serverNames: ["google.com"],
      privateKey: "your-private-key",
      shortIds: [""]
    }
  },
  sniffing: {
    enabled: true,
    destOverride: ["http", "tls"]
  }
};

try {
  const result = await client.addInbound(inboundConfig);
  console.log('Inbound added successfully:', result);
} catch (error) {
  console.error('Failed to add inbound:', error.message);
}
```

### Trojan Example
```javascript
const trojanConfig = {
  remark: "Trojan Server",
  port: 443,
  protocol: "trojan",
  settings: {
    clients: [],
    fallbacks: []
  },
  streamSettings: {
    network: "tcp",
    security: "tls",
    tlsSettings: {
      serverName: "your-domain.com",
      certificates: [
        {
          certificateFile: "/path/to/cert.pem",
          keyFile: "/path/to/key.pem"
        }
      ]
    }
  }
};

try {
  const result = await client.addInbound(trojanConfig);
  console.log('Trojan inbound added:', result);
} catch (error) {
  console.error('Failed to add trojan inbound:', error.message);
}
```

## Updating Inbounds

Modify an existing inbound's configuration:

```javascript
const updatedConfig = {
  remark: "Updated VPN Server Name",
  port: 8443, // Keep same port or change it
  protocol: "vless", // Keep same protocol
  settings: {
    // Updated settings
    clients: [], // Existing clients will be preserved
    decryption: "none"
  },
  // You can update any field from the original config
  sniffing: {
    enabled: false // Disable sniffing
  }
};

try {
  const inboundId = 1;
  const result = await client.updateInbound(inboundId, updatedConfig);
  console.log('Inbound updated successfully:', result);
} catch (error) {
  console.error('Failed to update inbound:', error.message);
}
```

## Deleting Inbounds

Remove an inbound permanently:

```javascript
try {
  const inboundId = 1;
  const result = await client.deleteInbound(inboundId);
  
  if (result.success) {
    console.log('Inbound deleted successfully');
  } else {
    console.error('Failed to delete inbound:', result.msg);
  }
} catch (error) {
  console.error('Error deleting inbound:', error.message);
}
```

⚠️ **Warning**: Deleting an inbound will also remove all associated clients and their configurations. This action cannot be undone.

## Error Handling

Common error scenarios and how to handle them:

```javascript
try {
  const inbounds = await client.getInbounds();
} catch (error) {
  if (error.message.includes('Login failed')) {
    console.error('Authentication error - check credentials');
  } else if (error.response?.status === 404) {
    console.error('Inbound not found');
  } else if (error.response?.status === 400) {
    console.error('Invalid inbound configuration');
  } else if (error.response?.status === 409) {
    console.error('Port already in use');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Best Practices

### 1. Port Management
- Use unique ports for each inbound
- Avoid common ports (80, 22, 21) unless necessary
- Check port availability before creating inbounds

### 2. Security Configuration
- Always use encryption (TLS/Reality) for production
- Use strong certificates for TLS configurations
- Regularly update Reality configurations

### 3. Naming Convention
- Use descriptive remarks for easy identification
- Include purpose, location, or protocol in the name
- Example: "US-East-VLESS-Reality", "Backup-Trojan-TLS"

### 4. Configuration Validation
```javascript
function validateInboundConfig(config) {
  if (!config.remark || config.remark.trim() === '') {
    throw new Error('Remark is required');
  }
  
  if (!config.port || config.port < 1 || config.port > 65535) {
    throw new Error('Valid port number is required (1-65535)');
  }
  
  if (!['vless', 'vmess', 'trojan', 'shadowsocks'].includes(config.protocol)) {
    throw new Error('Unsupported protocol');
  }
  
  return true;
}

// Use before creating inbound
try {
  validateInboundConfig(inboundConfig);
  const result = await client.addInbound(inboundConfig);
} catch (error) {
  console.error('Configuration error:', error.message);
}
```

### 5. Bulk Operations
```javascript
// Creating multiple inbounds safely
const inboundConfigs = [
  { remark: "Server 1", port: 8443, protocol: "vless", /* ... */ },
  { remark: "Server 2", port: 8444, protocol: "vmess", /* ... */ },
  { remark: "Server 3", port: 8445, protocol: "trojan", /* ... */ }
];

for (const config of inboundConfigs) {
  try {
    await client.addInbound(config);
    console.log(`Created inbound: ${config.remark}`);
    
    // Add delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error(`Failed to create ${config.remark}:`, error.message);
  }
}
```

---

## Next Steps

- [Client Management Guide](Client-Management.md) - Add users to your inbounds
- [Security Best Practices](Security-Best-Practices.md) - Secure your server
- [Troubleshooting](Troubleshooting.md) - Common issues and solutions 