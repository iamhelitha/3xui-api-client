# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-08-30

### Added
- 🔥 **Firestore Session Store Support** - Custom session handler for Firebase Firestore integration
- 📝 **Enhanced Wiki Documentation** - Comprehensive guides with real-world examples and integration patterns
- 🔍 **Client Identifier Clarification** - Clear documentation that 'email' field is an identifier, not a real email address

### Enhanced
- 📚 **Authentication Guide** - Added detailed session/cookie flow documentation and Firestore integration example
- 👥 **Client Management Guide** - Clarified email field semantics and added identifier generation examples  
- 🛠️ **Inbound Management Guide** - Added protocol-specific authentication method explanations
- 🏠 **Home Documentation** - Improved navigation and cross-references between guides

### Documentation
- **Session Management**: Added comprehensive Firestore adapter example with cleanup patterns
- **API Flow Clarification**: Documented that all API calls automatically include stored session cookies
- **Client Identifiers**: Clarified that 'email' fields use random strings (e.g., '5yhuih4hg93') for privacy
- **Integration Examples**: Enhanced web integration patterns for Express.js and Next.js
- **Security Best Practices**: Consolidated security guidance in Authentication Guide

### Removed
- Removed any references to email generation functionality for clarity
- Cleaned up duplicate content across wiki files

### Fixed
- Corrected misconceptions about email field usage in 3x-ui
- Improved consistency across documentation

## [2.0.0] - 2025-06-25

### Added
- 🎯 **Built-in Credential Generation System** - Automatic generation of random passwords, UUIDs, and client identifiers
- 🔧 **Advanced Session Management** - Intelligent session caching, automatic renewal, and multi-server support
- 🌐 **Web Integration Support** - Express.js and Next.js middleware for seamless web app integration
- 🛡️ **Enhanced Security Framework** - Input validation, security monitoring, and secure headers management
- 📦 **Modular Architecture** - New `src/` directory structure with specialized modules:
  - `CredentialGenerator.js` - Random credential generation utilities
  - `SessionManager.js` - Advanced session handling and caching
  - `WebMiddleware.js` - Express/Next.js integration helpers
  - `ProtocolBuilders.js` - Automated inbound configuration builders
  - `SecurityEnhancer.js` - Security validation and monitoring

### Enhanced
- 🔐 **Improved Authentication** - More robust session handling with automatic recovery
- 📊 **Better Error Handling** - Enhanced error messages and recovery mechanisms
- 🎨 **Developer Experience** - Improved TypeScript definitions and code documentation
- 🧪 **Testing Framework** - Updated test suite with better coverage and reliability
- 📝 **Documentation** - Comprehensive wiki updates with practical examples

### New Features
- **Credential Generation**:
  - Random password generation with customizable complexity
  - UUID v4 generation for unique client identifiers
  - Secure random string generation for API keys
  - Email-like identifier generation for client management

- **Session Management**:
  - Intelligent session caching with TTL support
  - Multi-server session handling
  - Automatic session renewal and cleanup
  - Database-ready session storage format

- **Web Integration**:
  - Express.js middleware for route protection
  - Next.js API route helpers
  - Automatic cookie management
  - Request/response transformation utilities

- **Protocol Builders**:
  - Automated VLESS configuration generation
  - VMess protocol setup helpers
  - Trojan and Shadowsocks builders
  - Reality and WireGuard configuration support

### Changed
- **Breaking Change**: Enhanced API structure with new module organization
- **Package Structure**: Moved from monolithic to modular architecture
- **Dependencies**: Updated to latest stable versions
- **Configuration**: Improved configuration options and defaults

### Security
- Enhanced input validation and sanitization
- Improved session security with automatic cleanup
- Better error handling to prevent information leakage
- Security monitoring and alerting capabilities

### Developer Experience
- Better TypeScript support with comprehensive type definitions
- Improved documentation with real-world examples
- Enhanced testing framework with automated validation
- ESLint configuration for code quality

### Performance
- Optimized session management with intelligent caching
- Reduced API call overhead through better request batching
- Improved memory usage with automatic cleanup
- Faster authentication flow with session reuse

## [1.0.0] - 2025-06-20

### Added
- Complete API client library for 3x-ui panel management
- Authentication with automatic session management
- Inbound management (5 methods): getInbounds, getInbound, addInbound, updateInbound, deleteInbound
- Client management (7 methods): addClient, updateClient, deleteClient, getClientTrafficsByEmail, getClientTrafficsById, getClientIps, clearClientIps
- Traffic management (4 methods): resetClientTraffic, resetAllTraffics, resetAllClientTraffics, deleteDepletedClients
- System operations (2 methods): getOnlineClients, createBackup
- Comprehensive error handling and automatic re-authentication
- TypeScript definitions for better developer experience
- ESM module support alongside CommonJS
- Complete documentation and wiki guides
- Interactive testing suite with 19 test files
- Security best practices implementation

### Features
- 🔐 Secure session-based authentication
- 🔄 Automatic login retry on session expiry
- 📊 Complete API coverage (19 routes tested and working)
- 🛡️ Server-side only design for security
- 📚 Comprehensive documentation with real-world examples
- 🧪 Extensive testing suite with actual API responses
- 📝 TypeScript support for better DX
- 🔗 Both CommonJS and ESM module support

### Security
- No vulnerabilities in dependencies
- Secure session cookie handling
- Server-side only architecture
- Input validation and error handling
- Automatic timeout and retry mechanisms

## [Unreleased]

### Planned
- GitHub Actions CI/CD pipeline
- Automated semantic releases
- Enhanced unit test coverage
- Performance benchmarking tools
- Advanced monitoring and analytics 