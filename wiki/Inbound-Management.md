# Inbound Management Guide

✅ **Status**: Fully tested and working

This guide covers all inbound management operations using the 3xui-api-client library.

Note on client identifiers: 3x-ui uses the `email` field inside client objects purely as an identifier/tag. It does not need to be a real email address. Prefer random strings like `5yhuih4hg93` for privacy.

## Table of Contents
- [Overview](#overview)
- [Protocol Authentication Methods](#protocol-authentication-methods)
- [Getting All Inbounds](#getting-all-inbounds)
- [Getting a Specific Inbound](#getting-a-specific-inbound)
- [Adding New Inbounds](#adding-new-inbounds)
- [Updating Inbounds](#updating-inbounds)
- [Deleting Inbounds](#deleting-inbounds)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

Inbounds are the entry points for your VPN connections. Each inbound represents a service listening on a specific port with specific protocol settings.

## Protocol Authentication Methods

Different protocols supported by 3X-UI use different authentication mechanisms:

### UUID-Based Protocols
These protocols use UUIDs (Universally Unique Identifiers) for client authentication:

#### VLESS
- **Authentication**: UUID (client ID)
- **Format**: Standard UUID format (e.g., `f5eb5844-dc57-412b-9ec2-82d37e0ebb9c`)
- **Usage**: Each client has a unique UUID for identification
- **Security**: Modern protocol with enhanced security features
- **Example settings**:
  ```json
  "clients": [{
    "id": "f5eb5844-dc57-412b-9ec2-82d37e0ebb9c",
    "email": "user23c5n7",
    "flow": "xtls-rprx-vision"
  }]
  ```

#### VMess
- **Authentication**: UUID (client ID) 
- **Format**: Standard UUID format (e.g., `5783a3e7-e373-51cd-8642-c83782b807c5`)
- **Usage**: Legacy V2Ray protocol, each client identified by UUID
- **Security**: Time-based authentication with optional encryption
- **Example settings**:
  ```json
  "clients": [{
    "id": "5783a3e7-e373-51cd-8642-c83782b807c5",
    "email": "user23c5n7",
    "level": 0,
    "alterId": 0
  }]
  ```

### Password-Based Protocols
These protocols use passwords or similar string-based authentication:

#### Trojan
- **Authentication**: Password (any string)
- **Format**: Plain text password (e.g., `my_secure_password_123`)
- **Usage**: SHA-224 hash of password is used for authentication
- **Security**: Works over TLS, password acts as pre-shared key
- **Example settings**:
  ```json
  "clients": [{
    "password": "my_secure_password_123",
    "email": "user23c5n7",
    "level": 0
  }]
  ```

#### Shadowsocks
- **Authentication**: Password + Encryption Method
- **Format**: Password string + cipher method (e.g., `chacha20-ietf-poly1305`)
- **Usage**: Password combined with encryption method for security
- **Security**: AEAD ciphers recommended for modern deployments
- **Example settings**:
  ```json
  {
    "method": "chacha20-ietf-poly1305",
    "password": "my_shadowsocks_password",
    "email": "user23c5n7"
  }
  ```

### Key-Based Protocols

#### WireGuard
- **Authentication**: Public/Private Key Pairs
- **Format**: Base64-encoded Curve25519 keys
- **Usage**: Each peer has a key pair, authentication via public key
- **Security**: Modern cryptography with perfect forward secrecy
- **Example settings**:
  ```json
  "peers": [{
    "publicKey": "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
    "allowedIPs": ["10.0.0.2/32"],
    "endpoint": "example.com:51820"
  }]
  ```

### Username/Password Protocols
Traditional proxy protocols with optional authentication:

#### SOCKS5
- **Authentication**: Username + Password (optional)
- **Format**: Plain text credentials or no authentication
- **Usage**: Standard SOCKS proxy with optional auth
- **Security**: No encryption by default, relies on transport security
- **Example settings**:
  ```json
  {
    "auth": "password",
    "accounts": [{
      "user": "username",
      "pass": "password"
    }]
  }
  ```

#### HTTP Proxy
- **Authentication**: Username + Password (optional) 
- **Format**: Basic Auth or no authentication
- **Usage**: Standard HTTP proxy protocol
- **Security**: No encryption by default, often used with TLS
- **Example settings**:
  ```json
  {
    "accounts": [{
      "user": "username",
      "pass": "password"
    }]
  }
  ```

### Special Purpose Protocols

#### Dokodemo-door
- **Authentication**: None (port forwarding)
- **Format**: No client authentication required
- **Usage**: Transparent proxy/port forwarding protocol
- **Security**: Relies on network-level access control
- **Note**: Forwards traffic to specified destination without client auth

### Protocol Selection Guidelines

| Protocol | Best For | Security Level | Authentication Type |
|----------|----------|----------------|-------------------|
| VLESS | Modern deployments, high performance | High | UUID |
| VMess | Legacy compatibility | Medium | UUID |
| Trojan | Stealth operations, TLS camouflage | High | Password |
| Shadowsocks | Simple setup, wide compatibility | Medium-High | Password + Cipher |
| WireGuard | VPN tunneling, mobile clients | Very High | Key Pairs |
| SOCKS5 | Local proxy, development | Low-Medium | Username/Password |
| HTTP | Web proxy, simple forwarding | Low | Username/Password |
| Dokodemo-door | Port forwarding, transparent proxy | Low | None |

### Important Notes

1. **UUID Generation**: UUIDs must be genuine random UUIDs. You can generate them using:
   - Online UUID generators
   - Command line: `uuidgen` (macOS/Linux) or `xray uuid` (Xray core)
   - Programming libraries

2. **Password Security**: For password-based protocols:
   - Use strong, unique passwords (16+ characters)
   - Avoid dictionary words or predictable patterns
   - Consider using password managers

3. **Key Management**: For WireGuard:
   - Keep private keys secure and never share them
   - Rotate keys periodically for enhanced security
   - Use proper key distribution methods

4. **Transport Security**: Many protocols benefit from additional transport-layer security:
   - TLS encryption for enhanced security
   - Proper certificate validation
   - Modern cipher suites

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
      "id": 10,
      "up": 0,
      "down": 0,
      "total": 0,
      "remark": "Example Inbound",
      "enable": true,
      "expiryTime": 0,
      "clientStats": [
        {
          "id": 20,
          "inboundId": 10,
          "enable": true,
          "email": "example23c5n7",
          "up": 0,
          "down": 0,
          "expiryTime": 0,
          "total": 0,
          "reset": 0
        }
      ],
      "listen": "",
      "port": 11726,
      "protocol": "vless",
      "settings": "{\"clients\":[{\"id\":\"example-uuid-here\",\"email\":\"example23c5n7\"}],\"decryption\":\"none\"}",
      "streamSettings": "{\"network\":\"tcp\",\"security\":\"reality\",\"realitySettings\":{\"show\":false,\"dest\":\"google.com:443\",\"xver\":0,\"serverNames\":[\"google.com\"],\"privateKey\":\"example-private-key\",\"shortIds\":[\"\"],\"settings\":{\"publicKey\":\"example-public-key\",\"fingerprint\":\"chrome\"}},\"tcpSettings\":{\"acceptProxyProtocol\":false,\"header\":{\"type\":\"none\"}}}",
      "tag": "inbound-11726",
      "sniffing": "{\"enabled\":false,\"destOverride\":[\"http\",\"tls\",\"quic\",\"fakedns\"],\"metadataOnly\":false,\"routeOnly\":false}",
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

### Add Inbound Response Example
```javascript
{
  "success": true,
  "msg": "Inbound has been successfully created.",
  "obj": {
    "id": 15,
    "up": 0,
    "down": 0,
    "total": 0,
    "remark": "Test_Inbound_Example",
    "enable": true,
    "expiryTime": 0,
    "clientStats": null,
    "listen": "",
    "port": 8443,
    "protocol": "vless",
    "settings": "{\"clients\":[{\"id\":\"example-uuid-here\",\"email\":\"test23c5n7\"}],\"decryption\":\"none\"}",
    "streamSettings": "{\"network\":\"tcp\",\"security\":\"reality\",\"realitySettings\":{\"show\":false,\"dest\":\"google.com:443\",\"xver\":0,\"serverNames\":[\"google.com\"],\"privateKey\":\"example-private-key\",\"shortIds\":[\"\"],\"settings\":{\"publicKey\":\"example-public-key\",\"fingerprint\":\"chrome\"}},\"tcpSettings\":{\"acceptProxyProtocol\":false,\"header\":{\"type\":\"none\"}}}",
    "tag": "inbound-8443",
    "sniffing": "{\"enabled\":true,\"destOverride\":[\"http\",\"tls\",\"quic\",\"fakedns\"]}",
    "allocate": "{\"strategy\":\"always\",\"refresh\":5,\"concurrency\":3}"
  }
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

### Update Inbound Response Example
```javascript
{
  "success": true,
  "msg": "Inbound has been successfully updated.",
  "obj": {
    "id": 15,
    "up": 0,
    "down": 0,
    "total": 0,
    "remark": "Updated_Test_Inbound_Example",
    "enable": true,
    "expiryTime": 0,
    "clientStats": null,
    "listen": "",
    "port": 8443,
    "protocol": "vless",
    "settings": "{\"clients\":[{\"id\":\"example-uuid-here\",\"email\":\"test23c5n7\"}],\"decryption\":\"none\"}",
    "streamSettings": "{\"network\":\"tcp\",\"security\":\"reality\",\"realitySettings\":{\"show\":false,\"dest\":\"google.com:443\",\"xver\":0,\"serverNames\":[\"google.com\"],\"privateKey\":\"example-private-key\",\"shortIds\":[\"\"],\"settings\":{\"publicKey\":\"example-public-key\",\"fingerprint\":\"chrome\"}},\"tcpSettings\":{\"acceptProxyProtocol\":false,\"header\":{\"type\":\"none\"}}}",
    "tag": "inbound-8443",
    "sniffing": "{\"enabled\":true,\"destOverride\":[\"http\",\"tls\",\"quic\",\"fakedns\"]}",
    "allocate": "{\"strategy\":\"always\",\"refresh\":5,\"concurrency\":3}"
  }
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

### Delete Inbound Response Example
```javascript
{
  "success": true,
  "msg": "Inbound has been successfully deleted.",
  "obj": 15
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

## Navigation

| Previous | Next |
|----------|------|
| [← Authentication Guide](Authentication-Guide.md) | [Client Management →](Client-Management.md) |

## Related Documentation

- [Authentication Guide](Authentication-Guide.md) - Connection & session management
- [Client Management](Client-Management.md) - User account operations  
- [Traffic Management](Traffic-Management.md) - Data monitoring & control
- [System Operations](System-Operations.md) - Admin operations
- [Home](Home.md) - Main documentation page

*Last updated: September 2025*  