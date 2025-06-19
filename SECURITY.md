# Security Policy

## Supported Versions

We take security seriously and actively maintain the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

### For Users

**🔒 Server-Side Only Usage**
- This package is designed for **server-side use only**
- Never use this package in browser/client-side applications
- Session cookies contain sensitive authentication data

**🛡️ Credential Security**
- Store credentials in environment variables, not in code
- Use secure session storage (Redis, Database) for production
- Implement proper access controls for your server

**🔄 Session Management**
- Sessions expire after 1 hour and are automatically renewed
- Monitor for unusual authentication patterns
- Implement rate limiting on your server

**📝 Example Secure Implementation:**
```javascript
const ThreeXUI = require('3xui-api-client');

// ✅ Good: Use environment variables
const client = new ThreeXUI(
  process.env.XUI_URL,
  process.env.XUI_USERNAME, 
  process.env.XUI_PASSWORD
);

// ✅ Good: Store sessions securely
class SecureXUIManager {
  constructor(database) {
    this.client = client;
    this.db = database;
  }
  
  async ensureAuthenticated() {
    const session = await this.db.getValidSession();
    if (!session) {
      await this.client.login();
      await this.db.storeSession(this.client.cookie);
    }
  }
}
```

## Reporting a Vulnerability

We appreciate responsible disclosure of security vulnerabilities.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email security reports to: [your-security-email@example.com]
3. Include detailed information about the vulnerability
4. Allow up to 48 hours for initial response

### What to Include

- **Description**: Clear description of the vulnerability
- **Impact**: Potential security impact and affected versions
- **Reproduction**: Steps to reproduce the issue
- **Fix Suggestion**: If you have ideas for fixes

### Our Response Process

1. **Acknowledgment**: We'll confirm receipt within 48 hours
2. **Investigation**: We'll investigate and assess the impact
3. **Fix Development**: We'll develop and test a fix
4. **Release**: We'll release a security update
5. **Disclosure**: We'll publicly disclose after users have time to update

### Security Update Process

- Security fixes are released as patch versions (e.g., 1.0.1)
- We'll publish security advisories on GitHub
- Critical vulnerabilities may trigger emergency releases
- We'll notify users through multiple channels

## Security Features

### Built-in Security

✅ **Automatic Session Management**
- Sessions expire after 1 hour
- Automatic re-authentication on expiry
- Secure cookie handling

✅ **Input Validation** 
- Required parameter validation
- URL sanitization
- Error message sanitization

✅ **HTTP Security**
- 30-second request timeouts
- Connection validation
- Redirect limits (max 5)
- Security headers

✅ **Error Handling**
- No sensitive data in error messages
- Proper exception handling
- Network error management

### Dependencies Security

- All dependencies are regularly audited
- No known vulnerabilities in current dependencies
- Minimal dependency footprint (only axios)

## Security Considerations

### Network Security
- Always use HTTPS for production deployments
- Implement proper firewall rules
- Use VPN or private networks when possible

### Access Control
- Limit access to 3x-ui admin accounts
- Use strong, unique passwords
- Implement IP whitelisting where possible
- Monitor access logs regularly

### Data Protection
- Never log credentials or session cookies
- Implement proper data retention policies
- Use encryption for stored session data
- Regular security audits of your implementation

## Contact

For security-related questions or concerns:
- GitHub Issues: For non-security bugs only
- Documentation: Check our [Wiki](https://github.com/iamhelitha/3xui-api-client/wiki) for security guides

---

**Note**: This security policy applies to the 3xui-api-client library itself. Security of your 3x-ui server and infrastructure remains your responsibility. 