# API Routes Testing & Documentation Plan

## Overview

This document tracks all API routes implemented in [index.js](../index.js), their testing status, and required documentation. As we progress through testing each route, we'll create dedicated wiki pages with practical examples and use cases.

⚠️ **Important**: This package is **server-side only** due to session cookie security requirements. All examples and documentation emphasize secure server-side implementation with database session storage.

## Testing & Documentation Workflow

1. **Implement** - Add method to ThreeXUI class in [index.js](../index.js)
2. **Test** - Create test file and verify with real 3x-ui server
3. **Document** - Create wiki page with response examples and use cases
4. **Update Status** - Mark as ✅ when tested and documented

## API Routes Inventory

### 🔐 Authentication (Core)
| Method | Endpoint | Test File | Wiki Page | Status |
|--------|----------|-----------|-----------|---------|
| `login()` | `POST /login` | `test/login-test.js` | [Authentication-Guide.md](Authentication-Guide.md) | ✅ Tested & Documented |

**Use Cases:**
- Session establishment
- Credential validation
- Server-side session storage

---

### 📋 Inbound Management (5 routes)
| Method | Endpoint | Test File | Wiki Page | Status |
|--------|----------|-----------|-----------|---------|
| `getInbounds()` | `GET /panel/api/inbounds/list` | `test/inbounds-test.js` | [Inbound-Management.md](Inbound-Management.md) | ✅ Tested & Documented |
| `getInbound(id)` | `GET /panel/api/inbounds/get/{id}` | `test/inbounds-test.js` | [Inbound-Management.md](Inbound-Management.md) | ✅ Tested & Documented |
| `addInbound(config)` | `POST /panel/api/inbounds/add` | `test/inbounds-test.js` | [Inbound-Management.md](Inbound-Management.md) | ✅ Tested & Documented |
| `updateInbound(id, config)` | `POST /panel/api/inbounds/update/{id}` | `test/inbounds-test.js` | [Inbound-Management.md](Inbound-Management.md) | ✅ Tested & Documented |
| `deleteInbound(id)` | `POST /panel/api/inbounds/del/{id}` | `test/inbounds-test.js` | [Inbound-Management.md](Inbound-Management.md) | ✅ Tested & Documented |

**Use Cases:**
- VPN server management
- Port configuration
- Protocol setup (VLESS, VMess, Trojan)
- Traffic monitoring

---

### 👥 Client Management (7 routes)
| Method | Endpoint | Test File | Wiki Page | Status |
|--------|----------|-----------|-----------|---------|
| `addClient(config)` | `POST /panel/api/inbounds/addClient` | `test/07_addClient.js` | [Client-Management.md](Client-Management.md) | ✅ Tested & Documented |
| `updateClient(clientId, config)` | `POST /panel/api/inbounds/updateClient/{clientId}` | `test/08_updateClient.js` | [Client-Management.md](Client-Management.md) | ✅ Tested & Documented |
| `deleteClient(inboundId, clientId)` | `POST /panel/api/inbounds/{inboundId}/delClient/{clientId}` | `test/09_deleteClient.js` | [Client-Management.md](Client-Management.md) | ✅ Tested & Documented |
| `getClientTrafficsByEmail(email)` | `GET /panel/api/inbounds/getClientTraffics/{email}` | `test/11_getClientTrafficsByEmail.js` | [Client-Management.md](Client-Management.md) | ✅ Tested & Documented |
| `getClientTrafficsById(id)` | `GET /panel/api/inbounds/getClientTrafficsById/{id}` | `test/12_getClientTrafficsById.js` | [Client-Management.md](Client-Management.md) | ✅ Tested & Documented |
| `getClientIps(email)` | `POST /panel/api/inbounds/clientIps/{email}` | `test/13_getClientIps.js` | [Client-Management.md](Client-Management.md) | ✅ Tested & Documented |
| `clearClientIps(email)` | `POST /panel/api/inbounds/clearClientIps/{email}` | `test/14_clearClientIps.js` | [Client-Management.md](Client-Management.md) | ✅ Tested & Documented |

**Use Cases:**
- User account management
- Access control
- Traffic monitoring per user
- IP address management
- Subscription handling

---

### 📊 Traffic Management (4 routes)
| Method | Endpoint | Test File | Wiki Page | Status |
|--------|----------|-----------|-----------|---------|
| `resetClientTraffic(inboundId, email)` | `POST /panel/api/inbounds/{inboundId}/resetClientTraffic/{email}` | `test/15_resetClientTraffic.js` | [Traffic-Management.md](Traffic-Management.md) | ✅ Tested & Documented |
| `resetAllTraffics()` | `POST /panel/api/inbounds/resetAllTraffics` | `test/16_resetAllTraffics.js` | [Traffic-Management.md](Traffic-Management.md) | ✅ Tested & Documented |
| `resetAllClientTraffics(inboundId)` | `POST /panel/api/inbounds/resetAllClientTraffics/{inboundId}` | `test/17_resetAllClientTraffics.js` | [Traffic-Management.md](Traffic-Management.md) | ✅ Tested & Documented |
| `deleteDepletedClients(inboundId)` | `POST /panel/api/inbounds/delDepletedClients/{inboundId}` | `test/18_deleteDepletedClients.js` | [Traffic-Management.md](Traffic-Management.md) | ✅ Tested & Documented |

**Use Cases:**
- Billing cycle resets
- Data limit management
- Automated cleanup
- Usage analytics

---

### 🖥️ System Operations (2 routes)
| Method | Endpoint | Test File | Wiki Page | Status |
|--------|----------|-----------|-----------|---------|
| `getOnlineClients()` | `POST /panel/api/inbounds/onlines` | `test/03_getOnlineClients.js` | [System-Operations.md](System-Operations.md) | ✅ Tested & Documented |
| `createBackup()` | `GET /panel/api/inbounds/createbackup` | `test/19_createBackup.js` | [System-Operations.md](System-Operations.md) | ✅ Tested & Documented |

**Use Cases:**
- Real-time monitoring
- System maintenance
- Data backup procedures
- Health checking

---

## Summary Statistics

| Category | Total Routes | ✅ Tested | 🚧 Pending |
|----------|--------------|-----------|-------------|
| **Authentication** | 1 | 1 | 0 |
| **Inbound Management** | 5 | 5 | 0 |
| **Client Management** | 7 | 7 | 0 |
| **Traffic Management** | 4 | 4 | 0 |
| **System Operations** | 2 | 2 | 0 |
| **TOTAL** | **19** | **19** | **0** |

## Required Test Files

### ✅ Completed Test Files
- `test/01_login.js` - Authentication testing
- `test/02_getInbounds.js` - Get all inbounds
- `test/03_getOnlineClients.js` - Get online clients (system operation)
- `test/04_getInbound.js` - Get specific inbound
- `test/05_addInbound.js` - Add new inbound
- `test/06_updateInbound.js` - Update inbound configuration
- `test/07_addClient.js` - Add client to inbound
- `test/08_updateClient.js` - Update client settings
- `test/09_deleteClient.js` - Delete client from inbound
- `test/10_deleteInbound.js` - Delete inbound
- `test/11_getClientTrafficsByEmail.js` - Get client traffic by email
- `test/12_getClientTrafficsById.js` - Get client traffic by UUID
- `test/13_getClientIps.js` - Get client IP addresses
- `test/14_clearClientIps.js` - Clear client IP records
- `test/15_resetClientTraffic.js` - Reset individual client traffic
- `test/16_resetAllTraffics.js` - Reset all traffic globally
- `test/17_resetAllClientTraffics.js` - Reset all client traffic in inbound
- `test/18_deleteDepletedClients.js` - Delete clients exceeding limits
- `test/19_createBackup.js` - Create system backup
- `test/main-test.js` - Main test runner with interactive interface

### 📋 Test File Template
Each test file should follow this structure:
```javascript
require('dotenv').config({ path: './test/config.env' });
const ThreeXUI = require('../index.js');

const client = new ThreeXUI(
    process.env.THREEXUI_URL,
    process.env.THREEXUI_USERNAME, 
    process.env.THREEXUI_PASSWORD
);

async function testFeatureName() {
    try {
        console.log('🧪 Testing [Feature Name]...');
        
        // Test successful operations
        const result = await client.methodName();
        console.log('✅ Success:', result);
        
        // Test error scenarios
        // Document actual response structure
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testFeatureName();
```

## Documentation Requirements

### ✅ Completed Wiki Pages
1. **[Client-Management.md](Client-Management.md)** - User account operations ✅
2. **[Traffic-Management.md](Traffic-Management.md)** - Data usage and reset operations ✅
3. **[System-Operations.md](System-Operations.md)** - Server monitoring and maintenance ✅
4. **[Inbound-Management.md](Inbound-Management.md)** - VPN server configuration ✅
5. **[Authentication-Guide.md](Authentication-Guide.md)** - Login and session management ✅

### Wiki Page Template
Each wiki page must include:

```markdown
# [Feature Name] Guide

✅/🚧 **Status**: [Fully tested and working / Testing in progress]

## Overview
Brief description of what this feature does

## API Methods
List of all methods in this category

## Request/Response Examples
Actual API responses with full JSON structures

## Server-Side Implementation
```javascript
// Secure server-side usage examples
class SecureFeatureManager {
  constructor(client, database) {
    this.client = client;
    this.db = database;
  }
  
  async ensureAuthenticated() {
    // Session validation with database
  }
  
  async methodExample() {
    await this.ensureAuthenticated();
    return this.client.methodName();
  }
}
```

## Use Cases
Real-world scenarios where this feature is useful

## Error Handling
Common errors and solutions

## Security Considerations
Database storage requirements and session management
```

## Database Session Management

### Required Database Schema
Users implementing this package must create a sessions table:

```sql
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    server_url VARCHAR(255) NOT NULL,
    session_cookie TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_server (server_url)
);
```

### Session Management Pattern
```javascript
class DatabaseSessionManager {
    async storeSession(serverUrl, cookie) {
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour
        await this.db.query(
            'INSERT INTO sessions (server_url, session_cookie, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE session_cookie = VALUES(session_cookie), expires_at = VALUES(expires_at)',
            [serverUrl, cookie, expiresAt]
        );
    }
    
    async getValidSession(serverUrl) {
        const result = await this.db.query(
            'SELECT session_cookie FROM sessions WHERE server_url = ? AND expires_at > NOW()',
            [serverUrl]
        );
        return result.length > 0 ? result[0].session_cookie : null;
    }
}
```

## Next Steps

1. **Priority Testing**: Start with Client Management as it's most commonly used
2. **Progressive Documentation**: Create wiki pages immediately after successful testing
3. **Integration Examples**: Add practical server-side examples to each wiki page
4. **Security Emphasis**: Highlight database storage requirements in all documentation

---

*This document is updated as each API route is tested and documented. All routes marked as 🚧 need testing and wiki documentation.* 