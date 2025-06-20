# Authentication Guide

✅ **Status**: Fully tested and working

This guide explains how to handle authentication with the 3x-ui API, including login responses, session management, and security best practices.

## Table of Contents
- [Login Response Structure](#login-response-structure)
- [Session Cookie Management](#session-cookie-management)
- [Automatic Authentication](#automatic-authentication)
- [Manual Authentication](#manual-authentication)
- [Session Persistence](#session-persistence)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Login Response Structure

When you call the login method, the API returns both JSON data and HTTP headers with session information.

### JSON Response
```javascript
{
  "success": true,
  "msg": "",
  "obj": null
}
```

**Response Fields:**
- `success` (boolean): Indicates if login was successful
- `msg` (string): Human-readable status message
- `obj` (null): Additional data (typically null for login)

### HTTP Headers
The authentication cookie is provided in the response headers:

```http
Content-Encoding: gzip
Content-Type: application/json; charset=utf-8
Set-Cookie: 3x-ui=MTczNTUyMzMyN3xEWDhFQVFMX2dBQUJFQUVRQUFCMV80QUFBUVp6ZEhKcGJtY01EQUFLVEU5SFNVNWZWVk5GVWhoNExYVnBMMlJoZEdGaVlYTmxMMjF2WkdWc0xsVnpaWExfZ1FNQkFRUlZjMlZ5QWYtQ0FBRUVBUUpKWkFFRUFBRUlWWE5sY201aGJXVUJEQUFCQ0ZCaGMzTjNiM0prQVF3QUFRdE1iMmRwYmxObFkzSmxkQUVNQUFBQUZQLUNFUUVDQVFWaFpHMXBiZ0VGWVdSdGFXNEF8y6Y2EKU4tk9ljoHdsA7Hb8TqYbZZclkP6EfZlCy1-bs=; Path=/; Expires=Mon, 30 Dec 2024 02:48:47 GMT; Max-Age=3600; HttpOnly
Vary: Accept-Encoding
Date: Mon, 30 Dec 2024 01:48:47 GMT
Content-Length: 74
```

**Cookie Attributes:**
- **Name**: `3x-ui`
- **Value**: Base64 encoded session data
- **Path**: `/` (available for all routes)
- **Expires**: Absolute expiration time
- **Max-Age**: `3600` seconds (1 hour)
- **HttpOnly**: Prevents JavaScript access (security feature)

## Session Cookie Management

### Extracting Cookie Information

```javascript
const ThreeXUI = require('3xui-api-client');

const client = new ThreeXUI('https://your-server.com', 'username', 'password');

try {
  const loginResult = await client.login();
  
  console.log('Login Response:', loginResult.data);
  // Output: { success: true, msg: "Login Successfully", obj: null }
  
  console.log('Session Cookie:', client.cookie);
  // Output: 3x-ui=MTczNTUyMzMyN3xEWDhFQVFMX2dBQUJFQUVRQUFCMV80QUFBUVp6ZEhKcGJtY01EQUFLVEU5SFNVNWZWVk5GVWhoNExYVnBMMlJoZEdGaVlYTmxMMjF2WkdWc0xsVnpaWExfZ1FNQkFRUlZjMlZ5QWYtQ0FBRUVBUUpKWkFFRUFBRUlWWE5sY201aGJXVUJEQUFCQ0ZCaGMzTjNiM0prQVF3QUFRdE1iMmRwYmxObFkzSmxkQUVNQUFBQUZQLUNFUUVDQVFWaFpHMXBiZ0VGWVdSdGFXNEF8y6Y2EKU4tk9ljoHdsA7Hb8TqYbZZclkP6EfZlCy1-bs=
  
  console.log('Full Headers:', loginResult.headers);
  // Contains all response headers including Set-Cookie
  
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Cookie Parsing

```javascript
function parseCookieDetails(cookieString) {
  const parts = cookieString.split(';').map(part => part.trim());
  const [nameValue] = parts;
  const [name, value] = nameValue.split('=');
  
  const details = {
    name,
    value,
    attributes: {}
  };
  
  // Parse cookie attributes
  parts.slice(1).forEach(part => {
    if (part.includes('=')) {
      const [key, val] = part.split('=');
      details.attributes[key.toLowerCase()] = val;
    } else {
      details.attributes[part.toLowerCase()] = true;
    }
  });
  
  return details;
}

// Usage
const cookieHeader = loginResult.headers['set-cookie'][0];
const cookieDetails = parseCookieDetails(cookieHeader);

console.log('Cookie Details:', cookieDetails);
/* Output:
{
  name: "3x-ui",
  value: "MTczNTUyMzMyN3xEWDhFQVFMX2dBQUJFQUVRQUFCMV80QUFBUVp6ZEhKcGJtY01EQUFLVEU5SFNVNWZWVk5GVWhoNExYVnBMMlJoZEdGaVlYTmxMMjF2WkdWc0xsVnpaWExfZ1FNQkFRUlZjMlZ5QWYtQ0FBRUVBUUpKWkFFRUFBRUlWWE5sY201aGJXVUJEQUFCQ0ZCaGMzTjNiM0prQVF3QUFRdE1iMmRwYmxObFkzSmxkQUVNQUFBQUZQLUNFUUVDQVFWaFpHMXBiZ0VGWVdSdGFXNEF8y6Y2EKU4tk9ljoHdsA7Hb8TqYbZZclkP6EfZlCy1-bs=",
  attributes: {
    path: "/",
    expires: "Mon, 30 Dec 2024 02:48:47 GMT",
    "max-age": "3600",
    httponly: true
  }
}
*/
```

## Automatic Authentication

The client handles authentication automatically:

```javascript
const client = new ThreeXUI('https://your-server.com', 'username', 'password');

// No need to call login() manually
// The client will authenticate automatically on first API call
const inbounds = await client.getInbounds();

// Subsequent calls use the stored session
const specificInbound = await client.getInbound(1);
```

**How it works:**
1. First API call triggers automatic login
2. Session cookie is extracted and stored
3. Cookie is attached to all subsequent requests
4. If session expires (401 error), client re-authenticates automatically

## Manual Authentication

For more control over the authentication process:

```javascript
const client = new ThreeXUI('https://your-server.com', 'username', 'password');

try {
  // Manually trigger login
  const loginResult = await client.login();
  
  if (loginResult.data.success) {
    console.log('✅ Authentication successful');
    console.log('Session expires in 1 hour');
    
    // Now make API calls
    const inbounds = await client.getInbounds();
  } else {
    console.error('❌ Authentication failed:', loginResult.data.msg);
  }
} catch (error) {
  console.error('❌ Login error:', error.message);
}
```

## Session Persistence

### Server-Side Storage (Recommended)

Store session cookies securely on your server:

```javascript
class PersistentThreeXUIClient {
  constructor(baseURL, username, password, storage) {
    this.client = new ThreeXUI(baseURL, username, password);
    this.storage = storage; // Redis, Database, etc.
    this.sessionKey = `3xui_session_${baseURL}`;
  }

  async ensureAuthenticated() {
    // Try to restore existing session
    const storedCookie = await this.storage.get(this.sessionKey);
    
    if (storedCookie) {
      this.client.cookie = storedCookie;
      this.client.api.defaults.headers.Cookie = storedCookie;
      
      // Test if session is still valid
      try {
        await this.client.getInbounds();
        console.log('✅ Restored existing session');
        return;
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('⚠️ Stored session expired, re-authenticating...');
          await this.storage.delete(this.sessionKey);
        }
      }
    }
    
    // Login and store new session
    const loginResult = await this.client.login();
    if (loginResult.data.success) {
      // Store session with 50-minute expiration (10 minutes before actual expiry)
      await this.storage.set(this.sessionKey, this.client.cookie, 3000);
      console.log('✅ New session created and stored');
    }
  }

  async getInbounds() {
    await this.ensureAuthenticated();
    return this.client.getInbounds();
  }
  
  // Add other methods as needed
}

// Usage with Redis
const redis = require('redis').createClient();
const persistentClient = new PersistentThreeXUIClient(
  'https://your-server.com', 
  'username', 
  'password', 
  redis
);

const inbounds = await persistentClient.getInbounds();
```

### Database Storage Example

```javascript
// Example using a database
class DatabaseSessionManager {
  constructor(db) {
    this.db = db;
  }

  async storeSession(serverUrl, cookie) {
    const expiresAt = new Date(Date.now() + 3000 * 1000); // 50 minutes
    
    await this.db.query(`
      INSERT INTO sessions (server_url, cookie, expires_at, created_at)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        cookie = VALUES(cookie),
        expires_at = VALUES(expires_at),
        updated_at = NOW()
    `, [serverUrl, cookie, expiresAt, new Date()]);
  }

  async getSession(serverUrl) {
    const result = await this.db.query(`
      SELECT cookie FROM sessions 
      WHERE server_url = ? AND expires_at > NOW()
    `, [serverUrl]);
    
    return result.length > 0 ? result[0].cookie : null;
  }

  async deleteSession(serverUrl) {
    await this.db.query('DELETE FROM sessions WHERE server_url = ?', [serverUrl]);
  }
}
```

## Security Considerations

### 1. Cookie Security
- **HttpOnly**: Prevents XSS attacks (already set by 3x-ui)
- **Secure transmission**: Always use HTTPS in production
- **Storage**: Never store cookies in client-side storage (localStorage, sessionStorage)

### 2. Session Management
```javascript
class SecureSessionManager {
  constructor(client) {
    this.client = client;
    this.sessionStartTime = null;
    this.maxSessionAge = 3000 * 1000; // 50 minutes
  }

  async login() {
    const result = await this.client.login();
    this.sessionStartTime = Date.now();
    return result;
  }

  isSessionExpired() {
    if (!this.sessionStartTime) return true;
    return (Date.now() - this.sessionStartTime) > this.maxSessionAge;
  }

  async ensureValidSession() {
    if (this.isSessionExpired()) {
      console.log('Session expired, re-authenticating...');
      await this.login();
    }
  }
}
```

### 3. Credential Protection
```javascript
// Environment variables for credentials
require('dotenv').config();

const client = new ThreeXUI(
  process.env.THREEXUI_URL,
  process.env.THREEXUI_USERNAME,
  process.env.THREEXUI_PASSWORD
);

// Never hardcode credentials in your code!
// ❌ BAD
// const client = new ThreeXUI('https://server.com', 'admin', 'password123');

// ✅ GOOD  
// Use environment variables or secure configuration management
```

## Troubleshooting

### Common Authentication Issues

#### 1. Login Failed - Invalid Credentials
```javascript
try {
  await client.login();
} catch (error) {
  if (error.message.includes('Login failed')) {
    console.error('❌ Check your username and password');
    console.error('❌ Ensure the user has admin privileges');
  }
}
```

#### 2. Session Expired
```javascript
// The client handles this automatically, but you can detect it:
try {
  const inbounds = await client.getInbounds();
} catch (error) {
  if (error.response?.status === 401) {
    console.log('Session expired, client will re-authenticate automatically');
  }
}
```

#### 3. Connection Issues
```javascript
try {
  await client.login();
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('❌ Cannot connect to server - check URL and network');
  } else if (error.code === 'ENOTFOUND') {
    console.error('❌ DNS resolution failed - check server URL');
  } else if (error.response?.status === 404) {
    console.error('❌ Login endpoint not found - check 3x-ui version');
  }
}
```

#### 4. Cookie Issues
```javascript
// Check if cookie was received
const loginResult = await client.login();

if (!client.cookie) {
  console.error('❌ No session cookie received');
  console.log('Headers:', loginResult.headers);
} else {
  console.log('✅ Session cookie stored:', client.cookie.substring(0, 20) + '...');
}
```

### Debugging Authentication

```javascript
// Enable detailed logging
class DebugThreeXUIClient extends ThreeXUI {
  async login() {
    console.log('🔐 Attempting login...');
    
    try {
      const result = await super.login();
      console.log('✅ Login successful');
      console.log('📄 Response:', result.data);
      console.log('🍪 Cookie:', this.cookie ? 'Received' : 'Not received');
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      if (error.response) {
        console.error('📄 Response data:', error.response.data);
        console.error('📊 Status code:', error.response.status);
      }
      throw error;
    }
  }
}

const debugClient = new DebugThreeXUIClient('https://server.com', 'user', 'pass');
await debugClient.login();
```

---

## Navigation

| Previous | Next |
|----------|------|
| [← Home](Home.md) | [Inbound Management →](Inbound-Management.md) |

## Related Documentation

- [Inbound Management](Inbound-Management.md) - VPN server configuration
- [Client Management](Client-Management.md) - User account operations  
- [Traffic Management](Traffic-Management.md) - Data monitoring & control
- [System Operations](System-Operations.md) - Admin operations

*Last updated: January 2025* 