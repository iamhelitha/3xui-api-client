# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Unit test coverage with Jest
- ESLint configuration
- Contribution guidelines 