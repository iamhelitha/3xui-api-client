# Client Management Guide

✅ **Status**: Fully tested and working with v2.0 auto-generation features

This guide covers client management operations with automatic credential generation, security validation, and bulk operations using the enhanced 3xui-api-client library.

> Important: In 3x-ui, the `email` field is an arbitrary client identifier string, not a real email address. Use short random tags like `5yhuih4hg93`, `user_23c5n7`, etc. This library generates such identifiers by default when not provided.

## Table of Contents
- [Quick Start](#quick-start)
- [Auto-Credential Generation](#auto-credential-generation)
- [Manual Client Management](#manual-client-management)
- [Bulk Operations](#bulk-operations)
- [Traffic & IP Management](#traffic--ip-management)
- [Security & Validation](#security--validation)
- [Database Integration](#database-integration)
- [Web Integration Examples](#web-integration-examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Auto-Generated Client Creation (NEW!)
```javascript
const ThreeXUI = require('3xui-api-client');

const client = new ThreeXUI(url, username, password, {
    sessionManager: { redis: redisClient }  // Auto-session management
});

// Create VLESS client with everything auto-generated
const result = await client.addClientWithCredentials(inboundId, 'vless', {
    email: 'user_example_001'  // Optional - will auto-generate if not provided
});

console.log('Created client:', result.credentials);
/* Output:
{
  id: "a1b2c3d4-e5f6-4789-ab12-123456789abc",      // Auto-generated UUID
  email: "user_example_001",                       // Your identifier
  flow: "xtls-rprx-vision",                       // Optimal setting
  encryption: "none",                             // VLESS standard
  enable: true,                                   // Auto-enabled
  limitIp: 0,                                     // No limits
  totalGB: 0,                                     // No limits
  expiryTime: 0,                                  // No expiry
  subId: "f9e8d7c6-b5a4-4321-9876-fedcba987654"  // Auto-generated
}
*/
```

### Traditional Client Creation
```javascript
// Manual configuration (still supported)
const clientConfig = {
    id: 10,  // Inbound ID
    settings: JSON.stringify({
        clients: [{
            id: "f5eb5844-dc57-412b-9ec2-82d37e0ebb9c",  // Manual UUID
            email: "client_manual_001",
            limitIp: 0,
            totalGB: 0,
            expiryTime: 0,
            enable: true
        }]
    })
};

const result = await client.addClient(clientConfig);
```

## Auto-Credential Generation

### Protocol Support & Defaults
The package automatically generates secure credentials for all supported protocols:

```javascript
// Generate credentials without creating clients
const vlessCredentials = client.generateCredentials('vless');
const trojanCredentials = client.generateCredentials('trojan');
const shadowsocksCredentials = client.generateCredentials('shadowsocks');
const vmessCredentials = client.generateCredentials('vmess');

console.log('VLESS:', vlessCredentials);
/* Output:
{
  id: "ecc322b8-a458-4583-ac98-e343aefb5ac5",     // Secure UUID v4
  email: "client_abc1234",                        // Random identifier
  flow: "xtls-rprx-vision",                       // Best performance
  encryption: "none"                              // VLESS standard
}
*/

console.log('Trojan:', trojanCredentials);
/* Output:
{
  password: "K7mN9pQ2rT5vW8xA",                   // 16-char secure password
  email: "client_def5678",                        // Random identifier
  level: 0                                        // Standard level
}
*/
```

### Bulk Credential Generation
```javascript
// Generate multiple credentials at once
const bulkVlessCredentials = client.generateBulkCredentials('vless', 10);
const bulkTrojanCredentials = client.generateBulkCredentials('trojan', 5, {
    passwordLength: 24,  // Custom password length
    emailPrefix: 'premium_user'  // Custom identifier prefix
});

console.log(`Generated ${bulkVlessCredentials.length} VLESS credentials`);
console.log(`Generated ${bulkTrojanCredentials.length} Trojan credentials`);
```

### Custom Options
```javascript
// Customize auto-generation
const customClient = await client.addClientWithCredentials(inboundId, 'vless', {
    email: 'custom_identifier_123',     // Custom identifier
    limitIp: 2,                         // Limit to 2 concurrent IPs
    totalGB: 100,                       // 100GB data limit
    expiryTime: Date.now() + 2592000000, // Expire in 30 days
    flow: 'xtls-rprx-splice'           // Different flow control
});

const customTrojan = await client.addClientWithCredentials(inboundId, 'trojan', {
    passwordLength: 32,                 // Longer password
    level: 1                           // Different user level
});

const customShadowsocks = await client.addClientWithCredentials(inboundId, 'shadowsocks', {
    method: 'aes-256-gcm',             // Different cipher
    passwordLength: 24                  // Custom password length
});
```

### Protocol-Specific Defaults

**VLESS (Modern V2Ray):**
- **UUID**: Cryptographically secure UUID v4
- **Flow**: `xtls-rprx-vision` (best performance)
- **Encryption**: `none` (VLESS standard)
- **Identifier**: Random text like `client_abc1234`

**VMess (Legacy V2Ray):**
- **UUID**: Cryptographically secure UUID v4
- **AlterId**: `0` (modern VMess security)
- **Level**: `0` (standard user level)
- **Identifier**: Random text like `client_def5678`

**Trojan (TLS-based):**
- **Password**: 16-character alphanumeric (configurable)
- **Level**: `0` (standard user level)
- **Identifier**: Random text like `client_ghi9012`

**Shadowsocks (SOCKS5 Proxy):**
- **Method**: `chacha20-ietf-poly1305` (most secure AEAD)
- **Password**: 16-character alphanumeric (configurable)
- **Identifier**: Random text like `client_jkl3456`

## Manual Client Management

### Adding Clients
```javascript
// Traditional manual method
const clientConfig = {
    id: inboundId,
    settings: JSON.stringify({
        clients: [{
            id: "client-uuid-here",
            email: "client_identifier_001",
            limitIp: 0,      // No IP limit
            totalGB: 0,      // No data limit  
            expiryTime: 0,   // No expiry
            enable: true,
            tgId: "",        // Telegram ID (optional)
            subId: ""        // Subscription ID (optional)
        }]
    })
};

const result = await client.addClient(clientConfig);
```

### Updating Clients
```javascript
// Update existing client settings
const updateConfig = {
    id: inboundId,
    settings: JSON.stringify({
        clients: [{
            id: "existing-client-uuid",
            email: "updated_client_identifier",
            limitIp: 2,      // Limit to 2 IPs
            totalGB: 50,     // 50GB limit
            expiryTime: Date.now() + 2592000000,  // 30 days
            enable: true
        }]
    })
};

const result = await client.updateClient("existing-client-uuid", updateConfig);
```

### Deleting Clients
```javascript
// Delete client by UUID
const result = await client.deleteClient(inboundId, "client-uuid");

if (result.success) {
    console.log('✅ Client deleted successfully');
} else {
    console.error('❌ Failed to delete client:', result.msg);
}
```

## Bulk Operations

### Bulk Client Creation
```javascript
// Create multiple clients efficiently
async function createBulkClients(inboundId, protocol, count, options = {}) {
    const results = [];
    
    // Generate all credentials first
    const credentials = client.generateBulkCredentials(protocol, count, options);
    
    // Create clients in batches
    for (const cred of credentials) {
        try {
            const result = await client.addClientWithCredentials(inboundId, protocol, {
                ...cred,
                ...options
            });
            results.push({ success: true, credentials: result.credentials });
        } catch (error) {
            results.push({ success: false, error: error.message, credentials: cred });
        }
    }
    
    return results;
}

// Usage
const bulkResults = await createBulkClients(inboundId, 'vless', 10, {
    limitIp: 1,
    totalGB: 50
});

console.log(`Created ${bulkResults.filter(r => r.success).length} clients successfully`);
```

### Bulk Updates
```javascript
// Update multiple clients with same settings
async function bulkUpdateClients(updates) {
    const results = [];
    
    for (const update of updates) {
        try {
            const result = await client.updateClient(update.uuid, {
                id: update.inboundId,
                settings: JSON.stringify({
                    clients: [update.clientData]
                })
            });
            results.push({ uuid: update.uuid, success: result.success });
        } catch (error) {
            results.push({ uuid: update.uuid, success: false, error: error.message });
        }
    }
    
    return results;
}
```

### Bulk Cleanup
```javascript
// Remove expired or depleted clients
async function cleanupClients(inboundId) {
    // Remove clients with depleted traffic
    const depletedResult = await client.deleteDepletedClients(inboundId);
    
    console.log(`Cleanup result: ${depletedResult.msg}`);
    return depletedResult;
}
```

## Traffic & IP Management

### Monitor Client Traffic
```javascript
// Get traffic by client identifier
const trafficByEmail = await client.getClientTrafficsByEmail("client_identifier_001");
console.log('Traffic data:', trafficByEmail.obj);
/* Output:
{
  id: 1,
  inboundId: 10,
  enable: true,
  email: "client_identifier_001",
  up: 1024000,      // Upload bytes
  down: 5120000,    // Download bytes
  expiryTime: 0,
  total: 6144000    // Total bytes
}
*/

// Get traffic by UUID
const trafficById = await client.getClientTrafficsById("client-uuid");
console.log('Traffic by UUID:', trafficById.obj);
```

### Reset Client Traffic
```javascript
// Reset specific client traffic
const resetResult = await client.resetClientTraffic(inboundId, "client_identifier_001");

if (resetResult.success) {
    console.log('✅ Client traffic reset successfully');
}

// Reset all client traffic for an inbound
const resetAllResult = await client.resetAllClientTraffics(inboundId);
console.log('Reset all clients:', resetAllResult.msg);
```

### IP Address Management
```javascript
// Get client IP addresses
const ipsResult = await client.getClientIps("client_identifier_001");
console.log('Client IPs:', ipsResult.obj);
/* Output: Array of IP addresses the client has connected from */

// Clear client IP history
const clearIpsResult = await client.clearClientIps("client_identifier_001");
if (clearIpsResult.success) {
    console.log('✅ Client IP history cleared');
}
```

## Security & Validation

### Input Validation
All client operations include automatic security validation:

```javascript
// These validations happen automatically:
// - Client identifier length and characters (max 100 chars, no <>"&)
// - Numeric values (limitIp, totalGB, expiryTime) must be non-negative
// - UUID format validation
// - Protocol-specific credential validation
```

### Credential Strength Validation
```javascript
// Validate generated credentials
const vlessCredentials = client.generateCredentials('vless');
const validation = client.validateCredentialStrength(vlessCredentials.id, 'uuid');

if (!validation.isValid) {
    console.error('Invalid UUID:', validation.issues);
} else {
    console.log('UUID strength:', validation.strength); // 'strong'
}

// Validate Trojan password
const trojanCredentials = client.generateCredentials('trojan');
const passwordValidation = client.validateCredentialStrength(trojanCredentials.password, 'password');
console.log('Password strength:', passwordValidation.strength); // 'medium' or 'strong'
```

### Security Monitoring
```javascript
// Monitor client-related security events
const stats = await client.getSecurityStats();

stats.recentActivities
    .filter(activity => activity.type.includes('client'))
    .forEach(activity => {
        console.log(`Client security event: ${activity.type} - ${activity.details}`);
    });
```

## Database Integration

### Secure Client Manager Pattern
```javascript
class SecureClientManager {
    constructor(xuiUrl, username, password, database) {
        this.client = new ThreeXUI(xuiUrl, username, password, {
            sessionManager: {
                type: 'database',
                database: database,
                defaultTTL: 3600
            }
        });
        this.db = database;
    }
    
    async createClientAccount(inboundId, userEmail, options = {}) {
        try {
            // Create client with auto-generated credentials
            const result = await this.client.addClientWithCredentials(inboundId, 'vless', {
                email: userEmail,
                ...options
            });
            
            if (result.success) {
                // Store in database
                await this.db.clients.create({
                    uuid: result.credentials.id,
                    email: userEmail,
                    inbound_id: inboundId,
                    created_at: new Date(),
                    credentials: JSON.stringify(result.credentials),
                    ...options
                });
                
                return {
                    success: true,
                    uuid: result.credentials.id,
                    email: userEmail,
                    connectionConfig: this.generateConnectionConfig(result.credentials, inboundId)
                };
            }
            
            return { success: false, error: result.msg };
        } catch (error) {
            console.error('Failed to create client account:', error);
            throw error;
        }
    }
    
    generateConnectionConfig(credentials, inboundId) {
        // Generate connection URLs/configs for clients
        return {
            vless_url: `vless://${credentials.id}@server:port?encryption=none&flow=${credentials.flow}&security=reality&type=tcp#${credentials.email}`,
            qr_code: `data:image/png;base64,${this.generateQRCode(credentials)}`,
            manual_config: credentials
        };
    }
    
    async getClientStats(email) {
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
    }
}
```

### Session Storage Schema
```sql
-- Database schema for session management
CREATE TABLE xui_sessions (
    id VARCHAR(255) PRIMARY KEY,
    session_data TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Index for cleanup
CREATE INDEX idx_expires_at ON xui_sessions(expires_at);

-- Client management schema
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    inbound_id INT NOT NULL,
    credentials JSON,
    upload_bytes BIGINT DEFAULT 0,
    download_bytes BIGINT DEFAULT 0,
    total_bytes BIGINT DEFAULT 0,
    limit_ip INT DEFAULT 0,
    total_gb INT DEFAULT 0,
    expiry_time BIGINT DEFAULT 0,
    status ENUM('active', 'suspended', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Web Integration Examples

### Express.js API Endpoints
```javascript
const express = require('express');
const app = express();

const clientManager = new SecureClientManager(
    process.env.XUI_URL,
    process.env.XUI_USERNAME,
    process.env.XUI_PASSWORD,
    database
);

// Create client with auto-generated credentials
app.post('/api/clients', async (req, res) => {
    try {
        const { inboundId, email, limitIp, totalGB, expiryDays } = req.body;
        
        const options = {
            limitIp: limitIp || 0,
            totalGB: totalGB || 0,
            expiryTime: expiryDays ? Date.now() + (expiryDays * 24 * 60 * 60 * 1000) : 0
        };
        
        const result = await clientManager.createClientAccount(inboundId, email, options);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get client traffic stats
app.get('/api/clients/:email/traffic', async (req, res) => {
    try {
        const stats = await clientManager.getClientStats(req.params.email);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bulk create clients
app.post('/api/clients/bulk', async (req, res) => {
    try {
        const { inboundId, protocol, count, options } = req.body;
        
        const results = [];
        const credentials = clientManager.client.generateBulkCredentials(protocol, count, options);
        
        for (const cred of credentials) {
            const result = await clientManager.createClientAccount(inboundId, cred.email, options);
            results.push(result);
        }
        
        res.json({
            success: true,
            created: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### React Client Management Component
```javascript
// hooks/useClients.js
import { useState, useCallback } from 'react';

export function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const createClient = useCallback(async (clientData) => {
        setLoading(true);
        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
            const result = await response.json();
            
            if (result.success) {
                setClients(prev => [...prev, result]);
            }
            
            return result;
        } finally {
            setLoading(false);
        }
    }, []);
    
    const getClientStats = useCallback(async (email) => {
        const response = await fetch(`/api/clients/${email}/traffic`);
        return response.json();
    }, []);
    
    return { clients, loading, createClient, getClientStats };
}

// ClientManager.jsx
function ClientManager() {
    const { clients, loading, createClient } = useClients();
    const [formData, setFormData] = useState({
        inboundId: '',
        email: '',
        limitIp: 0,
        totalGB: 0,
        expiryDays: 0
    });
    
    const handleCreateClient = async (e) => {
        e.preventDefault();
        const result = await createClient(formData);
        
        if (result.success) {
            alert(`Client created successfully!\nUUID: ${result.uuid}\nEmail: ${result.email}`);
            setFormData({ inboundId: '', email: '', limitIp: 0, totalGB: 0, expiryDays: 0 });
        } else {
            alert(`Failed to create client: ${result.error}`);
        }
    };
    
    return (
        <div>
            <h2>Create New Client</h2>
            <form onSubmit={handleCreateClient}>
                <input
                    placeholder="Inbound ID"
                    value={formData.inboundId}
                    onChange={(e) => setFormData(prev => ({ ...prev, inboundId: e.target.value }))}
                    required
                />
                <input
                    placeholder="Client Email/Identifier"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                />
                <input
                    type="number"
                    placeholder="IP Limit (0 = unlimited)"
                    value={formData.limitIp}
                    onChange={(e) => setFormData(prev => ({ ...prev, limitIp: parseInt(e.target.value) }))}
                />
                <input
                    type="number"
                    placeholder="Data Limit GB (0 = unlimited)"
                    value={formData.totalGB}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalGB: parseInt(e.target.value) }))}
                />
                <input
                    type="number"
                    placeholder="Expiry Days (0 = never)"
                    value={formData.expiryDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDays: parseInt(e.target.value) }))}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Client'}
                </button>
            </form>
        </div>
    );
}
```

## API Reference

### Enhanced Client Methods (NEW!)
```javascript
// Auto-credential client creation
await client.addClientWithCredentials(inboundId, protocol, options)
// Returns: { success: boolean, credentials: object, msg: string }

// Auto-credential client update
await client.updateClientWithCredentials(clientUuid, inboundId, options)
// Returns: { success: boolean, msg: string }

// Generate credentials without creating client
client.generateCredentials(protocol, options)
// Returns: object with protocol-specific credentials

// Generate multiple credentials
client.generateBulkCredentials(protocol, count, options)
// Returns: array of credential objects

// Individual generators
client.generateUUID(secure = true)
client.generatePassword(length = 16, options = {})
client.generateIdentifier(prefix = 'client')
```

### Standard Client Methods
```javascript
// Traditional client management
await client.addClient(config)
await client.updateClient(clientUuid, config)
await client.deleteClient(inboundId, clientUuid)

// Traffic monitoring
await client.getClientTrafficsByEmail(email)
await client.getClientTrafficsById(uuid)
await client.resetClientTraffic(inboundId, email)
await client.resetAllClientTraffics(inboundId)

// IP management
await client.getClientIps(email)
await client.clearClientIps(email)

// Cleanup operations
await client.deleteDepletedClients(inboundId)
```

### Response Formats

**Add Client Success:**
```javascript
{
  "success": true,
  "msg": "Inbound client(s) have been added.",
  "obj": null
}
```

**Traffic Response:**
```javascript
{
  "success": true,
  "msg": "",
  "obj": {
    "id": 1,
    "inboundId": 10,
    "enable": true,
    "email": "client_identifier_001",
    "up": 1024000,      // Upload bytes
    "down": 5120000,    // Download bytes
    "expiryTime": 0,
    "total": 6144000    // Total bytes
  }
}
```

## Troubleshooting

### Common Issues

**Auto-Generation Failures:**
```javascript
try {
    const client = await api.addClientWithCredentials(inboundId, 'vless');
} catch (error) {
    if (error.message.includes('Invalid protocol')) {
        console.error('Unsupported protocol. Use: vless, vmess, trojan, shadowsocks');
    } else if (error.message.includes('Inbound not found')) {
        console.error('Invalid inbound ID. Check with getInbounds()');
    }
}
```

**Client Not Found:**
```javascript
const response = await client.getClientTrafficsByEmail("nonexistent_client");
if (response.success && !response.obj) {
    console.log('Client not found - check identifier spelling');
}
```

**Rate Limiting:**
```javascript
// Check for rate limiting
const stats = await client.getSecurityStats();
if (stats.recentActivities.some(a => a.type === 'rate_limit_exceeded')) {
    console.warn('Rate limiting active - reduce request frequency');
}
```

**Credential Validation:**
```javascript
// Validate generated credentials
const credentials = client.generateCredentials('vless');
const validation = client.validateCredentialStrength(credentials.id, 'uuid');

if (!validation.isValid) {
    console.error('Generated credential failed validation:', validation.issues);
    // Regenerate credentials
    const newCredentials = client.generateCredentials('vless');
}
```

**Database Integration Issues:**
```javascript
// Check session store connectivity
try {
    const sessionStats = await client.getSessionStats();
    console.log('Session store connected:', sessionStats.connected);
} catch (error) {
    console.error('Session store error:', error.message);
    // Fallback to memory storage
    client.options.sessionManager = { type: 'memory' };
}
```

---

## Navigation

| Previous | Next |
|----------|------|
| [← Inbound Management](Inbound-Management.md) | [Traffic Management →](Traffic-Management.md) |

*Last updated: September 2025* 
```