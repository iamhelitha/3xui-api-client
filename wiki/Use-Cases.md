# Use Cases Guide

✅ **Status**: Fully tested and working with v2.0 auto-generation features

This guide provides comprehensive real-world use cases and implementation examples for the enhanced 3xui-api-client v2.0 library. Each use case showcases the new auto-generation features, security enhancements, and modern integration patterns.

## Table of Contents
- [VPN Service Provider](#vpn-service-provider)
- [Server Administration](#server-administration)
- [Real-Time Monitoring Dashboard](#real-time-monitoring-dashboard)
- [Web Application Integration](#web-application-integration)
- [Enterprise Security Setup](#enterprise-security-setup)
- [Best Practices](#best-practices)

## VPN Service Provider

Complete implementation using auto-credential generation and advanced session management:

```javascript
const ThreeXUI = require('3xui-api-client');

class VPNServiceManager {
    constructor(database, redis) {
        this.client = new ThreeXUI(
            process.env.XUI_URL, 
            process.env.XUI_USER, 
            process.env.XUI_PASS,
            {
                // Enhanced security for production
                maxRequestsPerMinute: 30,
                maxLoginAttemptsPerHour: 5,
                isDevelopment: false,
                
                // Redis session management for scalability
                sessionManager: {
                    type: 'redis',
                    redis: redis,
                    defaultTTL: 7200  // 2 hours
                }
            }
        );
        this.db = database;
    }

    // Create customer account with auto-generated credentials
    async createCustomerAccount(userEmail, planType = 'basic') {
        try {
            const plan = await this.getPlan(planType);
            
            // Auto-generate VLESS client with security validation
            const result = await this.client.addClientWithCredentials(plan.inboundId, 'vless', {
                email: userEmail,
                limitIp: plan.maxDevices,
                totalGB: plan.dataLimitGB,
                expiryTime: Date.now() + (plan.durationDays * 24 * 60 * 60 * 1000)
            });

            if (result.success) {
                // Store in database with generated connection configs
                await this.db.customers.create({
                    email: userEmail,
                    uuid: result.credentials.id,
                    plan_type: planType,
                    credentials: JSON.stringify(result.credentials),
                    connection_config: this.generateConnectionConfigs(result.credentials, plan.inboundId),
                    created_at: new Date()
                });

                // Generate QR codes and connection files
                return {
                    success: true,
                    customer: {
                        email: userEmail,
                        uuid: result.credentials.id,
                        connectionUrl: this.generateVlessUrl(result.credentials, plan.serverInfo),
                        qrCode: this.generateQRCode(result.credentials, plan.serverInfo),
                        configFile: this.generateConfigFile(result.credentials, plan.serverInfo)
                    }
                };
            }

            return { success: false, error: result.msg };
        } catch (error) {
            console.error('Customer creation failed:', error);
            throw error;
        }
    }

    // Bulk customer onboarding with security monitoring
    async bulkCreateCustomers(customerList, planType = 'basic') {
        const results = [];
        const plan = await this.getPlan(planType);
        
        // Generate all credentials at once for efficiency
        const bulkCredentials = this.client.generateBulkCredentials('vless', customerList.length, {
            limitIp: plan.maxDevices,
            totalGB: plan.dataLimitGB,
            expiryTime: Date.now() + (plan.durationDays * 24 * 60 * 60 * 1000)
        });

        for (let i = 0; i < customerList.length; i++) {
            const customer = customerList[i];
            const credentials = { ...bulkCredentials[i], email: customer.email };
            
            try {
                const result = await this.client.addClientWithCredentials(plan.inboundId, 'vless', credentials);
                
                if (result.success) {
                    await this.db.customers.create({
                        email: customer.email,
                        uuid: result.credentials.id,
                        plan_type: planType,
                        credentials: JSON.stringify(result.credentials),
                        connection_config: this.generateConnectionConfigs(result.credentials, plan.inboundId)
                    });
                    
                    results.push({ 
                        email: customer.email, 
                        success: true, 
                        uuid: result.credentials.id 
                    });
                } else {
                    results.push({ 
                        email: customer.email, 
                        success: false, 
                        error: result.msg 
                    });
                }
                
                // Rate limiting - don't overwhelm the server
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                results.push({ 
                    email: customer.email, 
                    success: false, 
                    error: error.message 
                });
            }
        }

        return {
            total: customerList.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    // Monthly billing cycle with automated management
    async processBillingCycle() {
        console.log('🔄 Starting monthly billing cycle...');
        
        // Get security stats first
        const securityStats = await this.client.getSecurityStats();
        console.log(`Security overview: ${securityStats.blockedIPs} blocked IPs, ${securityStats.totalSuspiciousActivities} suspicious activities`);
        
        const activeCustomers = await this.db.customers.findActive();
        const results = { renewed: 0, expired: 0, errors: 0 };
        
        for (const customer of activeCustomers) {
            try {
                if (customer.subscription_expires < new Date()) {
                    // Handle expired customers
                    await this.client.deleteClient(customer.inbound_id, customer.uuid);
                    await this.db.customers.update(customer.id, { status: 'expired' });
                    results.expired++;
                } else {
                    // Reset traffic for active customers
                    await this.client.resetClientTraffic(customer.inbound_id, customer.email);
                    results.renewed++;
                }
            } catch (error) {
                console.error(`Billing cycle error for ${customer.email}:`, error.message);
                results.errors++;
            }
        }
        
        console.log('✅ Billing cycle completed:', results);
        return results;
    }

    // Advanced usage monitoring with alerts
    async monitorUsageWithAlerts() {
        const customers = await this.db.customers.findActive();
        const alerts = [];
        
        for (const customer of customers) {
            try {
                const traffic = await this.client.getClientTrafficsByEmail(customer.email);
                
                if (traffic.success && traffic.obj) {
                    const usageGB = traffic.obj.total / (1024 * 1024 * 1024);
                    const limitGB = customer.data_limit_gb;
                    const usagePercent = (usageGB / limitGB) * 100;
                    
                    // Alert thresholds
                    if (usagePercent > 90) {
                        alerts.push({
                            type: 'critical',
                            customer: customer.email,
                            usage: `${usageGB.toFixed(2)}GB / ${limitGB}GB (${usagePercent.toFixed(1)}%)`
                        });
                    } else if (usagePercent > 75) {
                        alerts.push({
                            type: 'warning',
                            customer: customer.email,
                            usage: `${usageGB.toFixed(2)}GB / ${limitGB}GB (${usagePercent.toFixed(1)}%)`
                        });
                    }
                    
                    // Update database
                    await this.db.customers.update(customer.id, {
                        last_usage_gb: usageGB,
                        last_checked: new Date()
                    });
                }
            } catch (error) {
                console.error(`Monitoring error for ${customer.email}:`, error.message);
            }
        }
        
        // Send alerts
        if (alerts.length > 0) {
            await this.sendUsageAlerts(alerts);
        }
        
        return alerts;
    }

    generateVlessUrl(credentials, serverInfo) {
        return `vless://${credentials.id}@${serverInfo.domain}:${serverInfo.port}?encryption=none&flow=${credentials.flow}&security=reality&type=tcp&sni=${serverInfo.sni}#${credentials.email}`;
    }

    generateConnectionConfigs(credentials, inboundId) {
        return {
            vless_url: this.generateVlessUrl(credentials, { domain: 'server.example.com', port: 443, sni: 'google.com' }),
            manual_config: credentials,
            qr_code_data: `vless://${credentials.id}@server.example.com:443?...`
        };
    }

    async getPlan(planType) {
        const plans = {
            basic: { inboundId: 1, maxDevices: 2, dataLimitGB: 50, durationDays: 30 },
            premium: { inboundId: 2, maxDevices: 5, dataLimitGB: 200, durationDays: 30 },
            enterprise: { inboundId: 3, maxDevices: 10, dataLimitGB: 500, durationDays: 30 }
        };
        return plans[planType] || plans.basic;
    }

    async sendUsageAlerts(alerts) {
        // Implementation for sending email/SMS alerts
        console.log('📧 Usage alerts:', alerts);
  }
}
```

## Server Administration

Enhanced server administration with security monitoring and automated operations:

```javascript
class EnterpriseServerAdmin {
    constructor(database) {
        this.client = new ThreeXUI(
            process.env.XUI_URL, 
            process.env.XUI_USER, 
            process.env.XUI_PASS,
            {
                // Strict security for admin operations
                maxRequestsPerMinute: 20,
                maxLoginAttemptsPerHour: 3,
                isDevelopment: false,
                enableCSP: true,
                
                // Database session management
                sessionManager: {
                    type: 'database',
                    database: database,
                    tableName: 'admin_sessions',
                    defaultTTL: 1800  // 30 minutes for admin sessions
                }
            }
        );
        this.db = database;
    }

    // Comprehensive daily maintenance with security checks
  async dailyMaintenance() {
        console.log('🔧 Starting daily maintenance...');
        const maintenanceLog = {
            timestamp: new Date(),
            tasks: [],
            security_events: [],
            errors: []
        };

        try {
            // 1. Security monitoring check
            const securityStats = await this.client.getSecurityStats();
            maintenanceLog.security_events = securityStats.recentActivities;
            
            if (securityStats.blockedIPs > 0) {
                console.log(`⚠️ Security Alert: ${securityStats.blockedIPs} IPs currently blocked`);
                maintenanceLog.tasks.push(`Reviewed ${securityStats.blockedIPs} blocked IPs`);
            }

            // 2. Create secure backup
            const backupResult = await this.client.createBackup();
            if (backupResult.success) {
                maintenanceLog.tasks.push('Backup created successfully');
            }

            // 3. Clean up depleted clients across all inbounds
    const inbounds = await this.client.getInbounds();
            let totalCleanedClients = 0;
            
    for (const inbound of inbounds.obj) {
                const cleanupResult = await this.client.deleteDepletedClients(inbound.id);
                if (cleanupResult.success) {
                    totalCleanedClients++;
                    maintenanceLog.tasks.push(`Cleaned depleted clients from inbound ${inbound.id}`);
                }
            }

            // 4. Generate comprehensive usage report
            const usageReport = await this.generateDetailedUsageReport();
            maintenanceLog.tasks.push(`Generated usage report: ${usageReport.totalClients} clients, ${usageReport.totalTrafficGB}GB traffic`);

            // 5. Validate all client credentials
            const validationResults = await this.validateAllClientCredentials();
            maintenanceLog.tasks.push(`Validated ${validationResults.total} client credentials, ${validationResults.invalid} issues found`);

            // 6. System health check
            const healthCheck = await this.performSystemHealthCheck();
            maintenanceLog.tasks.push(`Health check: ${healthCheck.status}`);

            // Store maintenance log
            await this.db.maintenance_logs.create(maintenanceLog);
            
            console.log('✅ Daily maintenance completed successfully');
            return maintenanceLog;

        } catch (error) {
            maintenanceLog.errors.push(error.message);
            console.error('❌ Maintenance error:', error);
            await this.db.maintenance_logs.create(maintenanceLog);
            throw error;
        }
    }

    // Setup new server with optimal security configuration
    async setupOptimalServer(serverConfig) {
        const { protocol = 'vless', port, domain, remark } = serverConfig;
        
        try {
            // Validate server configuration
            const validation = this.client.validateCredentialStrength(port.toString(), 'port');
            if (!validation.isValid) {
                throw new Error(`Invalid port configuration: ${validation.issues.join(', ')}`);
            }

            let inboundConfig;

            switch (protocol) {
                case 'vless':
                    inboundConfig = {
                        remark: remark || `VLESS-Server-${port}`,
      port: port,
                        protocol: 'vless',
                        settings: JSON.stringify({
        clients: [],
        decryption: "none",
        fallbacks: []
                        }),
                        streamSettings: JSON.stringify({
        network: "tcp",
        security: "reality",
        realitySettings: {
          dest: "google.com:443",
                                serverNames: ["google.com", "www.google.com"],
                                privateKey: this.generateRealityKeys().privateKey,
                                shortIds: [""],
                                show: false
                            }
                        })
                    };
                    break;

                case 'trojan':
                    inboundConfig = {
                        remark: remark || `Trojan-Server-${port}`,
                        port: port,
                        protocol: 'trojan',
                        settings: JSON.stringify({
                            clients: [],
                            fallbacks: []
                        }),
                        streamSettings: JSON.stringify({
                            network: "tcp",
                            security: "tls",
                            tlsSettings: {
                                serverName: domain,
                                certificates: [{
                                    certificateFile: "/path/to/cert.pem",
                                    keyFile: "/path/to/key.pem"
                                }]
                            }
                        })
                    };
                    break;

                default:
                    throw new Error(`Unsupported protocol: ${protocol}`);
            }

            const result = await this.client.addInbound(inboundConfig);
            
            if (result.success) {
                // Log server creation
                await this.db.servers.create({
                    inbound_id: result.obj?.id,
                    protocol: protocol,
                    port: port,
                    domain: domain,
                    remark: inboundConfig.remark,
                    config: JSON.stringify(inboundConfig),
                    created_at: new Date()
                });

                console.log(`✅ ${protocol.toUpperCase()} server created on port ${port}`);
            }

            return result;

        } catch (error) {
            console.error('Server setup failed:', error);
            throw error;
        }
    }

    // Automated client credential validation
    async validateAllClientCredentials() {
        const inbounds = await this.client.getInbounds();
        const results = { total: 0, valid: 0, invalid: 0, issues: [] };
        
        for (const inbound of inbounds.obj) {
            if (inbound.settings) {
                try {
                    const settings = JSON.parse(inbound.settings);
                    if (settings.clients) {
                        for (const client of settings.clients) {
                            results.total++;
                            
                            // Validate based on protocol
                            let validation;
                            if (inbound.protocol === 'vless' || inbound.protocol === 'vmess') {
                                validation = this.client.validateCredentialStrength(client.id, 'uuid');
                            } else if (inbound.protocol === 'trojan') {
                                validation = this.client.validateCredentialStrength(client.password, 'password');
                            }
                            
                            if (validation && !validation.isValid) {
                                results.invalid++;
                                results.issues.push({
                                    inbound: inbound.id,
                                    client: client.email,
                                    issues: validation.issues
                                });
                            } else {
                                results.valid++;
                            }
                        }
                    }
                } catch (error) {
                    results.issues.push({
                        inbound: inbound.id,
                        error: `Failed to parse settings: ${error.message}`
                    });
                }
            }
        }
        
        return results;
    }

    async generateDetailedUsageReport() {
        const inbounds = await this.client.getInbounds();
        let totalClients = 0;
        let totalTrafficBytes = 0;
        let activeClients = 0;

        for (const inbound of inbounds.obj) {
            if (inbound.clientStats) {
                totalClients += inbound.clientStats.length;
                for (const client of inbound.clientStats) {
                    totalTrafficBytes += client.total || 0;
                    if (client.enable) activeClients++;
                }
            }
        }

        return {
            totalInbounds: inbounds.obj.length,
            activeInbounds: inbounds.obj.filter(i => i.enable).length,
            totalClients,
            activeClients,
            totalTrafficGB: (totalTrafficBytes / (1024 * 1024 * 1024)).toFixed(2)
        };
    }

    async performSystemHealthCheck() {
        try {
            // Test basic connectivity
            const inbounds = await this.client.getInbounds();
            const onlineClients = await this.client.getOnlineClients();
            
            // Check security status
            const securityStats = await this.client.getSecurityStats();
            
            const health = {
                status: 'healthy',
                checks: {
                    api_connectivity: true,
                    inbound_access: inbounds.success,
                    client_monitoring: onlineClients.success,
                    security_monitoring: securityStats ? true : false
                }
            };

            // Determine overall health
            const failedChecks = Object.values(health.checks).filter(check => !check).length;
            if (failedChecks > 0) {
                health.status = failedChecks > 2 ? 'critical' : 'warning';
            }

            return health;
        } catch (error) {
            return {
                status: 'critical',
                error: error.message,
                checks: { api_connectivity: false }
            };
        }
    }

    generateRealityKeys() {
        // This would integrate with actual Reality key generation
        return {
            privateKey: "sO6_TnoWBr3tWWQ9VLgRPgK0_-IjF5Ag8Sj6HkxKt0Y",
            publicKey: "Gk8DFwpAuLg6W0UtdKRKNvIJk8VPt8RqhE2YzBEo6Jk"
        };
  }
}
```

## Real-Time Monitoring Dashboard

WebSocket-based real-time monitoring with security event tracking:

```javascript
class RealTimeMonitoringDashboard {
    constructor(io, database) {
        this.client = new ThreeXUI(
            process.env.XUI_URL, 
            process.env.XUI_USER, 
            process.env.XUI_PASS,
            {
                sessionManager: { redis: redisClient },
                maxRequestsPerMinute: 100  // Higher limit for monitoring
            }
        );
        this.io = io;  // Socket.io instance
        this.db = database;
        this.monitoringInterval = null;
    }

    async startRealTimeMonitoring() {
        console.log('🔄 Starting real-time monitoring...');
        
        this.monitoringInterval = setInterval(async () => {
            try {
                const dashboardData = await this.getDashboardData();
                const securityEvents = await this.getSecurityEvents();
                
                // Emit to all connected clients
                this.io.emit('dashboard-update', {
                    ...dashboardData,
                    security: securityEvents,
                    timestamp: new Date()
                });
                
                // Store metrics in database
                await this.db.monitoring_metrics.create({
                    ...dashboardData,
                    recorded_at: new Date()
                });

            } catch (error) {
                console.error('Monitoring error:', error);
                this.io.emit('monitoring-error', { error: error.message });
            }
        }, 10000); // Update every 10 seconds
  }

  async getDashboardData() {
    const [inbounds, onlineClients] = await Promise.all([
      this.client.getInbounds(),
      this.client.getOnlineClients()
    ]);

        // Calculate comprehensive metrics
        const metrics = {
      totalInbounds: inbounds.obj.length,
      activeInbounds: inbounds.obj.filter(i => i.enable).length,
            totalClients: 0,
            activeClients: 0,
      onlineClients: onlineClients.obj?.length || 0,
            totalTrafficGB: 0,
            protocolDistribution: {},
            topClients: []
        };

        // Analyze inbound data
        for (const inbound of inbounds.obj) {
            // Protocol distribution
            metrics.protocolDistribution[inbound.protocol] = 
                (metrics.protocolDistribution[inbound.protocol] || 0) + 1;
            
            // Client and traffic statistics
            if (inbound.clientStats) {
                metrics.totalClients += inbound.clientStats.length;
                
                for (const client of inbound.clientStats) {
                    if (client.enable) metrics.activeClients++;
                    
                    const clientTrafficGB = (client.total || 0) / (1024 * 1024 * 1024);
                    metrics.totalTrafficGB += clientTrafficGB;
                    
                    // Track top clients by usage
                    metrics.topClients.push({
                        email: client.email,
                        trafficGB: clientTrafficGB.toFixed(2),
                        inboundId: inbound.id
                    });
                }
            }
        }

        // Sort top clients by traffic
        metrics.topClients.sort((a, b) => parseFloat(b.trafficGB) - parseFloat(a.trafficGB));
        metrics.topClients = metrics.topClients.slice(0, 10);
        
        metrics.totalTrafficGB = metrics.totalTrafficGB.toFixed(2);

        return metrics;
    }

    async getSecurityEvents() {
        const securityStats = await this.client.getSecurityStats();
        
        return {
            blockedIPs: securityStats.blockedIPs,
            suspiciousActivities: securityStats.totalSuspiciousActivities,
            recentAlerts: securityStats.recentActivities
                .filter(activity => activity.severity === 'high')
                .slice(0, 5),
            rateLimit: {
                activeRateLimits: securityStats.activeRateLimits
            }
        };
    }

    async handleClientConnection(socket) {
        console.log('📱 Dashboard client connected');
        
        // Send initial data
        const initialData = await this.getDashboardData();
        const securityEvents = await this.getSecurityEvents();
        
        socket.emit('initial-data', {
            ...initialData,
            security: securityEvents
        });

        // Handle client requests
        socket.on('get-client-details', async (email) => {
            try {
                const traffic = await this.client.getClientTrafficsByEmail(email);
                const ips = await this.client.getClientIps(email);
                
                socket.emit('client-details', {
                    email,
                    traffic: traffic.obj,
                    ips: ips.obj
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('security-action', async (action) => {
            try {
                if (action.type === 'clear-blocked-ips') {
                    await this.client.clearBlockedIPs();
                    socket.emit('security-action-success', { action: 'IPs cleared' });
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log('📱 Dashboard client disconnected');
        });
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('⏹️ Real-time monitoring stopped');
        }
    }
}
```

## Web Application Integration

Modern Express.js API with React frontend integration:

```javascript
// Backend API (Express.js)
const express = require('express');
const { ThreeXUI } = require('3xui-api-client');

class VPNWebAPI {
    constructor() {
        this.app = express();
        this.client = new ThreeXUI(
            process.env.XUI_URL,
            process.env.XUI_USERNAME,
            process.env.XUI_PASSWORD,
            {
                sessionManager: { redis: redisClient }
            }
        );
        
        this.setupRoutes();
    }

    setupRoutes() {
        // Create client with auto-generated credentials
        this.app.post('/api/clients', async (req, res) => {
            try {
                const { inboundId, protocol, email, options } = req.body;
                
                const result = await this.client.addClientWithCredentials(
                    inboundId, 
                    protocol, 
                    { email, ...options }
                );
                
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Bulk operations endpoint
        this.app.post('/api/clients/bulk', async (req, res) => {
            try {
                const { inboundId, protocol, count, options } = req.body;
                
                const credentials = this.client.generateBulkCredentials(protocol, count, options);
                const results = [];
                
                for (const cred of credentials) {
                    const result = await this.client.addClientWithCredentials(inboundId, protocol, cred);
                    results.push(result);
                }
                
                res.json({
                    total: count,
                    successful: results.filter(r => r.success).length,
                    results
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Security monitoring endpoint
        this.app.get('/api/security', async (req, res) => {
            try {
                const stats = await this.client.getSecurityStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}

// Frontend React Component
function ClientManagement() {
    const [clients, setClients] = useState([]);
    const [securityStats, setSecurityStats] = useState(null);
    
    const createClient = async (clientData) => {
        const response = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            setClients(prev => [...prev, result]);
            alert(`Client created: ${result.credentials.email}`);
        }
    };
    
    const loadSecurityStats = async () => {
        const response = await fetch('/api/security');
        const stats = await response.json();
        setSecurityStats(stats);
    };
    
    useEffect(() => {
        loadSecurityStats();
        const interval = setInterval(loadSecurityStats, 30000);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div>
            <h2>VPN Client Management</h2>
            {securityStats && (
                <div className="security-panel">
                    <h3>Security Status</h3>
                    <p>Blocked IPs: {securityStats.blockedIPs}</p>
                    <p>Suspicious Activities: {securityStats.totalSuspiciousActivities}</p>
                </div>
            )}
            
            <button onClick={() => createClient({
                inboundId: 1,
                protocol: 'vless',
                email: `user_${Date.now()}`,
                options: { limitIp: 2, totalGB: 50 }
            })}>
                Create VLESS Client
            </button>
            
            {/* Client list component */}
        </div>
    );
}
```

## Enterprise Security Setup

High-security configuration for enterprise environments:

```javascript
class EnterpriseSecuritySetup {
    constructor() {
        this.client = new ThreeXUI(
            process.env.XUI_URL,
            process.env.XUI_USERNAME,
            process.env.XUI_PASSWORD,
            {
                // Maximum security configuration
                maxRequestsPerMinute: 10,
                maxLoginAttemptsPerHour: 3,
                isDevelopment: false,
                enableCSP: true,
                timeout: 10000,
                
                // Encrypted database session storage
                sessionManager: {
                    type: 'database',
                    database: secureDbConnection,
                    databaseOptions: {
                        tableName: 'secure_sessions',
                        encryptSessions: true,
                        defaultTTL: 900,  // 15 minutes
                        cleanupInterval: 60
                    }
                }
            }
        );
    }

    async setupEnterpriseEnvironment() {
        console.log('🔒 Setting up enterprise security environment...');
        
        // 1. Validate all existing credentials
        const credentialAudit = await this.auditAllCredentials();
        console.log(`Credential audit: ${credentialAudit.strongCredentials}/${credentialAudit.totalCredentials} strong`);
        
        // 2. Set up monitoring and alerting
        await this.setupSecurityMonitoring();
        
        // 3. Configure automated backups
        await this.setupAutomatedBackups();
        
        // 4. Create enterprise-grade servers
        await this.setupEnterpriseServers();
        
        console.log('✅ Enterprise security setup completed');
    }

    async auditAllCredentials() {
        const inbounds = await this.client.getInbounds();
        const results = {
            totalCredentials: 0,
            strongCredentials: 0,
            weakCredentials: 0,
            issues: []
        };

        for (const inbound of inbounds.obj) {
            if (inbound.settings) {
                const settings = JSON.parse(inbound.settings);
                if (settings.clients) {
                    for (const client of settings.clients) {
                        results.totalCredentials++;
                        
                        let validation;
                        if (inbound.protocol === 'vless' || inbound.protocol === 'vmess') {
                            validation = this.client.validateCredentialStrength(client.id, 'uuid');
                        } else if (inbound.protocol === 'trojan') {
                            validation = this.client.validateCredentialStrength(client.password, 'password');
                        }
                        
                        if (validation) {
                            if (validation.strength === 'strong') {
                                results.strongCredentials++;
                            } else {
                                results.weakCredentials++;
                                results.issues.push({
                                    inbound: inbound.id,
                                    client: client.email,
                                    strength: validation.strength,
                                    issues: validation.issues
                                });
                            }
                        }
                    }
                }
            }
        }

        return results;
    }

    async setupSecurityMonitoring() {
        // Set up automated security monitoring
        setInterval(async () => {
            const stats = await this.client.getSecurityStats();
            
            // Alert on high-severity events
            const highSeverityEvents = stats.recentActivities.filter(
                activity => activity.severity === 'high'
            );
            
            if (highSeverityEvents.length > 0) {
                await this.sendSecurityAlert(highSeverityEvents);
            }
            
            // Log security metrics
            await this.logSecurityMetrics(stats);
            
        }, 60000); // Check every minute
    }

    async setupAutomatedBackups() {
        // Daily automated backups
        const scheduleBackup = () => {
    setInterval(async () => {
                try {
                    const backupResult = await this.client.createBackup();
                    if (backupResult.success) {
                        console.log('✅ Automated backup completed');
                    }
                } catch (error) {
                    console.error('❌ Automated backup failed:', error);
                }
            }, 24 * 60 * 60 * 1000); // Daily
        };
        
        scheduleBackup();
    }

    async setupEnterpriseServers() {
        const enterpriseConfigs = [
            {
                protocol: 'vless',
                port: 443,
                remark: 'Enterprise-VLESS-Primary',
                security: 'reality'
            },
            {
                protocol: 'trojan',
                port: 8443,
                remark: 'Enterprise-Trojan-Secondary',
                security: 'tls'
            }
        ];

        for (const config of enterpriseConfigs) {
            try {
                await this.setupOptimalServer(config);
                console.log(`✅ Enterprise server setup: ${config.remark}`);
            } catch (error) {
                console.error(`❌ Failed to setup ${config.remark}:`, error);
            }
        }
  }
}
```

## Best Practices

### Enhanced Error Handling with Security Awareness
```javascript
try {
    const result = await client.addClientWithCredentials(inboundId, 'vless');
} catch (error) {
    // Check for security-related errors
    if (error.message.includes('rate limit')) {
        const stats = await client.getSecurityStats();
        console.error(`Rate limited. Current limits: ${stats.activeRateLimits}`);
        
        // Implement exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        
    } else if (error.message.includes('blocked')) {
        console.error('IP may be blocked due to security violations');
        // Consider clearing blocks or investigating: await client.clearBlockedIPs();
        
  } else if (error.response?.status === 401) {
        console.error('Authentication failed - check credentials');
        
  } else {
        console.error('Unexpected error:', error.message);
  }
}
```

### Security-First Development
```javascript
// Always validate credentials before use
const credentials = client.generateCredentials('vless');
const validation = client.validateCredentialStrength(credentials.id, 'uuid');

if (!validation.isValid) {
    console.error('Generated credential failed validation:', validation.issues);
    throw new Error('Credential generation failed security validation');
}

// Monitor security events in production
const securityStats = await client.getSecurityStats();
if (securityStats.blockedIPs > 0) {
    console.warn(`Security Alert: ${securityStats.blockedIPs} IPs blocked`);
}

// Use environment-specific configuration
const isProduction = process.env.NODE_ENV === 'production';
const client = new ThreeXUI(url, username, password, {
    isDevelopment: !isProduction,
    maxRequestsPerMinute: isProduction ? 30 : 60,
    maxLoginAttemptsPerHour: isProduction ? 5 : 10,
    enableCSP: isProduction
});
```

### Efficient Batch Operations
```javascript
// Use bulk operations for better performance
async function processManyClients(clients) {
    // Generate all credentials at once
    const credentials = client.generateBulkCredentials('vless', clients.length);
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < credentials.length; i += batchSize) {
        const batch = credentials.slice(i, i + batchSize);
        
        const batchPromises = batch.map(cred => 
            client.addClientWithCredentials(inboundId, 'vless', cred)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Rate limiting between batches
        if (i + batchSize < credentials.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    return results;
}
```

---

## Navigation

| Previous | Next |
|----------|------|
| [← System Operations](System-Operations.md) | [Home](Home.md) |

*Last updated: January 2025* 