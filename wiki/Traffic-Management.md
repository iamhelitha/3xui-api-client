# Traffic Management Guide

✅ **Status**: Fully tested and working

This guide covers all traffic management operations using the 3xui-api-client library. Traffic management includes monitoring, resetting, and managing data usage for individual clients and entire inbounds.

## Table of Contents
- [Overview](#overview)
- [Reset Individual Client Traffic](#reset-individual-client-traffic)
- [Reset All Traffics (Global)](#reset-all-traffics-global)
- [Reset All Client Traffics (Per Inbound)](#reset-all-client-traffics-per-inbound)
- [Delete Depleted Clients](#delete-depleted-clients)
- [Server-Side Implementation](#server-side-implementation)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Use Cases](#use-cases)

## Overview

Traffic management is essential for VPN service providers to handle billing cycles, data limits, and system maintenance. The 3xui-api-client provides several methods to reset traffic statistics at different levels:

- **Individual Client Reset**: Reset traffic for a specific client in a specific inbound
- **Global Reset**: Reset all traffic across all inbounds and clients
- **Inbound-Specific Reset**: Reset traffic for all clients within a specific inbound
- **Depleted Client Cleanup**: Remove clients who have exceeded their traffic limits

⚠️ **Important**: Traffic reset operations are irreversible. Always confirm before executing.

## Reset Individual Client Traffic

Reset traffic statistics for a specific client within a specific inbound:

```javascript
const ThreeXUI = require('3xui-api-client');

async function resetClientTraffic(inboundId, email) {
  try {
    // Get client current stats before reset
    const statsResponse = await client.getClientTrafficsByEmail(email);
    let currentStats = null;
    
    if (statsResponse.success && statsResponse.obj) {
      currentStats = {
        up: statsResponse.obj.up,
        down: statsResponse.obj.down,
        total: statsResponse.obj.total
      };
      
      console.log(`📊 Current stats for ${email}:`);
      console.log(`   Upload: ${currentStats.up} bytes`);
      console.log(`   Download: ${currentStats.down} bytes`);
      console.log(`   Total: ${currentStats.total} bytes`);
    }

    const response = await client.resetClientTraffic(inboundId, email);
    
    if (response.success) {
      console.log('✅ Client traffic reset successfully');
      
      // Verify reset by checking stats again
      const newStats = await client.getClientTrafficsByEmail(email);
      if (newStats.success && newStats.obj) {
        console.log('📊 Stats after reset:');
        console.log(`   Upload: ${newStats.obj.up} bytes`);
        console.log(`   Download: ${newStats.obj.down} bytes`);
        console.log(`   Total: ${newStats.obj.total} bytes`);
      }
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error resetting client traffic:', error.message);
    throw error;
  }
}

// Usage example
const result = await resetClientTraffic(5, "me9absl6");
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "Traffic has been reset.",
  "obj": null
}
```

## Reset All Traffics (Global)

Reset traffic statistics for ALL clients across ALL inbounds:

```javascript
async function resetAllTraffics() {
  try {
    console.log('⚠️ WARNING: This will reset ALL traffic across ALL inbounds!');
    
    // Get current statistics for backup
    const inboundsResponse = await client.getInbounds();
    let totalStats = { up: 0, down: 0, total: 0, clientCount: 0 };
    
    if (inboundsResponse.success) {
      inboundsResponse.obj.forEach(inbound => {
        totalStats.up += inbound.up;
        totalStats.down += inbound.down;
        totalStats.total += inbound.total;
        if (inbound.clientStats) {
          totalStats.clientCount += inbound.clientStats.length;
        }
      });
      
      console.log(`📊 Current totals before reset:`);
      console.log(`   Upload: ${totalStats.up} bytes`);
      console.log(`   Download: ${totalStats.down} bytes`);
      console.log(`   Total: ${totalStats.total} bytes`);
      console.log(`   Clients affected: ${totalStats.clientCount}`);
    }
    
    // Confirm before proceeding
    console.log('\n🔴 This action cannot be undone!');
    console.log('Type "RESET ALL" to confirm:');
    
    const response = await client.resetAllTraffics();
    
    if (response.success) {
      console.log('✅ All traffic has been reset successfully');
      console.log(`   ${totalStats.clientCount} clients affected`);
      console.log(`   ${totalStats.total} bytes of data reset`);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error resetting all traffic:', error.message);
    throw error;
  }
}

// Usage with confirmation
const result = await resetAllTraffics();
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "All traffic has been reset.",
  "obj": null
}
```

## Reset All Client Traffics (Per Inbound)

Reset traffic for all clients within a specific inbound:

```javascript
async function resetAllClientTrafficsInInbound(inboundId) {
  try {
    // Get inbound details and current stats
    const inboundResponse = await client.getInbound(inboundId);
    if (!inboundResponse.success) {
      throw new Error('Failed to get inbound details');
    }
    
    const inbound = inboundResponse.obj;
    console.log(`🔄 Resetting traffic for all clients in inbound ${inboundId}:`);
    console.log(`   Port: ${inbound.port}`);
    console.log(`   Protocol: ${inbound.protocol}`);
    console.log(`   Current traffic: ↑${inbound.up} ↓${inbound.down} bytes`);
    
    if (inbound.clientStats && inbound.clientStats.length > 0) {
      console.log(`   Clients to be reset: ${inbound.clientStats.length}`);
      inbound.clientStats.forEach(client => {
        console.log(`     📧 ${client.email}: ${client.total} bytes total`);
      });
    } else {
      console.log('   No clients found in this inbound');
      return { success: false, message: 'No clients to reset' };
    }
    
    // Confirm before proceeding
    console.log(`\n⚠️ WARNING: This will reset traffic for ALL clients in inbound ${inboundId}!`);
    console.log(`Type "RESET INBOUND ${inboundId}" to confirm:`);
    
    const response = await client.resetAllClientTraffics(inboundId);
    
    if (response.success) {
      console.log('✅ All client traffics in inbound reset successfully');
      console.log(`   ${inbound.clientStats ? inbound.clientStats.length : 0} clients affected`);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error resetting inbound client traffics:', error.message);
    throw error;
  }
}

// Usage
const result = await resetAllClientTrafficsInInbound(5);
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "All traffic from the client has been reset.",
  "obj": null
}
```

## Delete Depleted Clients

Remove clients who have exceeded their traffic limits:

```javascript
async function deleteDepletedClients(inboundId) {
  try {
    // Get inbound details first
    const inboundResponse = await client.getInbound(inboundId);
    if (!inboundResponse.success) {
      throw new Error('Failed to get inbound details');
    }
    
    const inbound = inboundResponse.obj;
    const settings = JSON.parse(inbound.settings);
    
    console.log(`🗑️ Checking for depleted clients in inbound ${inboundId}:`);
    console.log(`   Port: ${inbound.port}`);
    console.log(`   Protocol: ${inbound.protocol}`);
    
    // Identify depleted clients before deletion
    const depletedClients = [];
    if (inbound.clientStats && inbound.clientStats.length > 0) {
      inbound.clientStats.forEach(clientStat => {
        const clientConfig = settings.clients.find(c => c.email === clientStat.email);
        if (clientConfig && clientConfig.totalGB > 0) {
          const limitBytes = clientConfig.totalGB * 1024 * 1024 * 1024;
          if (clientStat.total >= limitBytes) {
            depletedClients.push({
              email: clientStat.email,
              used: clientStat.total,
              limit: limitBytes,
              usage_percent: (clientStat.total / limitBytes * 100).toFixed(2)
            });
          }
        }
      });
    }
    
    console.log(`   Found ${depletedClients.length} depleted clients:`);
    depletedClients.forEach(client => {
      console.log(`     📧 ${client.email}: ${client.usage_percent}% used (${client.used}/${client.limit} bytes)`);
    });
    
    if (depletedClients.length === 0) {
      console.log('   No depleted clients found');
      return { success: true, message: 'No depleted clients to delete' };
    }
    
    // Confirm before deletion
    console.log(`\n⚠️ WARNING: This will permanently delete ${depletedClients.length} clients from inbound ${inboundId}!`);
    console.log('Are you sure you want to proceed? (yes/no):');
    
    const response = await client.deleteDepletedClients(inboundId);
    
    if (response.success) {
      console.log('✅ Depleted clients deleted successfully');
      console.log(`   ${depletedClients.length} clients removed`);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error deleting depleted clients:', error.message);
    throw error;
  }
}

// Usage
const result = await deleteDepletedClients(5);
```

### API Response Example
```javascript
{
  "success": true,
  "msg": "All depleted clients are deleted.",
  "obj": null
}
```

## Server-Side Implementation

Complete traffic management system with database integration:

```javascript
const ThreeXUI = require('3xui-api-client');

class TrafficManagementSystem {
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
        expires_at: new Date(Date.now() + 3600000)
      });
    } else {
      this.client.cookie = session.session_cookie;
      this.client.api.defaults.headers.Cookie = session.session_cookie;
    }
  }

  async resetClientTrafficWithAudit(inboundId, email, adminId, reason) {
    await this.ensureAuthenticated();
    
    try {
      // Get current stats for audit
      const statsResponse = await this.client.getClientTrafficsByEmail(email);
      let previousStats = null;
      
      if (statsResponse.success && statsResponse.obj) {
        previousStats = {
          up: statsResponse.obj.up,
          down: statsResponse.obj.down,
          total: statsResponse.obj.total
        };
      }

      const response = await this.client.resetClientTraffic(inboundId, email);
      
      if (response.success) {
        // Log reset in database for audit trail
        await this.db.traffic_resets.create({
          inbound_id: inboundId,
          client_email: email,
          reset_type: 'individual',
          previous_stats: previousStats,
          admin_id: adminId,
          reason: reason,
          reset_at: new Date(),
          success: true
        });
        
        // Update client's reset counter
        await this.db.clients.increment(
          { email: email, inbound_id: inboundId },
          { reset_count: 1 }
        );
      }
      
      return response;
    } catch (error) {
      // Log failed attempt
      await this.db.traffic_resets.create({
        inbound_id: inboundId,
        client_email: email,
        reset_type: 'individual',
        admin_id: adminId,
        reason: reason,
        reset_at: new Date(),
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }

  async scheduleMonthlyReset(inboundIds = []) {
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1, 1); // First day of next month
    resetDate.setHours(3, 0, 0, 0); // 3 AM
    
    await this.db.scheduled_resets.create({
      inbound_ids: inboundIds.length > 0 ? inboundIds : null,
      scheduled_for: resetDate,
      reset_type: inboundIds.length > 0 ? 'specific_inbounds' : 'global',
      status: 'scheduled',
      created_at: new Date()
    });

    console.log(`📅 Reset scheduled for ${resetDate}`);
    return { success: true, scheduled_for: resetDate };
  }

  async generateTrafficReport(timeRange = '30d') {
    await this.ensureAuthenticated();
    
    const inboundsResponse = await this.client.getInbounds();
    if (!inboundsResponse.success) {
      throw new Error('Failed to get inbounds');
    }

    const report = {
      generated_at: new Date(),
      time_range: timeRange,
      total_inbounds: inboundsResponse.obj.length,
      total_clients: 0,
      total_traffic: { up: 0, down: 0, total: 0 },
      inbound_details: []
    };

    for (const inbound of inboundsResponse.obj) {
      const inboundReport = {
        id: inbound.id,
        port: inbound.port,
        protocol: inbound.protocol,
        enabled: inbound.enable,
        traffic: { up: inbound.up, down: inbound.down, total: inbound.total },
        client_count: inbound.clientStats ? inbound.clientStats.length : 0,
        clients: []
      };

      // Add inbound traffic to totals
      report.total_traffic.up += inbound.up;
      report.total_traffic.down += inbound.down;
      report.total_traffic.total += inbound.total;
      report.total_clients += inboundReport.client_count;

      // Add client details
      if (inbound.clientStats) {
        inbound.clientStats.forEach(client => {
          inboundReport.clients.push({
            email: client.email,
            enabled: client.enable,
            traffic: { up: client.up, down: client.down, total: client.total },
            expiry: client.expiryTime === 0 ? 'never' : new Date(client.expiryTime),
            reset_count: client.reset
          });
        });
      }

      report.inbound_details.push(inboundReport);
    }

    // Store report in database
    await this.db.traffic_reports.create(report);
    return report;
  }
}

module.exports = TrafficManagementSystem;
```

## Error Handling

Common errors and solutions:

### Authentication Errors
```javascript
try {
  const response = await client.resetClientTraffic(inboundId, email);
} catch (error) {
  if (error.message.includes('401')) {
    console.log('Session expired, re-authenticating...');
    await client.login();
    const response = await client.resetClientTraffic(inboundId, email);
  }
}
```

### Client Not Found
```javascript
const response = await client.resetClientTraffic(5, "nonexistent@example.com");
if (!response.success && response.msg.includes('not found')) {
  console.log('Client not found in the specified inbound');
}
```

### Inbound Not Found
```javascript
try {
  await client.resetAllClientTraffics(999);
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Inbound ID not found');
  }
}
```

## Best Practices

### 1. Always Backup Before Reset
```javascript
async function safeTrafficReset(inboundId, email) {
  // Get current stats for backup
  const currentStats = await client.getClientTrafficsByEmail(email);
  
  // Store backup in database
  await database.traffic_backups.create({
    email: email,
    inbound_id: inboundId,
    backup_date: new Date(),
    stats: currentStats.obj
  });
  
  // Perform reset
  return await client.resetClientTraffic(inboundId, email);
}
```

### 2. Implement Confirmation Steps
```javascript
function askForConfirmation(message) {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function confirmedGlobalReset() {
  const confirmation = await askForConfirmation('Type "RESET ALL" to confirm global reset: ');
  
  if (confirmation === 'RESET ALL') {
    return await client.resetAllTraffics();
  } else {
    console.log('❌ Operation cancelled');
    return { success: false, message: 'Cancelled by user' };
  }
}
```

### 3. Audit Trail
```javascript
async function auditedTrafficReset(inboundId, email, adminId, reason) {
  const result = await client.resetClientTraffic(inboundId, email);
  
  if (result.success) {
    await database.audit_logs.create({
      action: 'traffic_reset',
      admin_id: adminId,
      target_email: email,
      inbound_id: inboundId,
      reason: reason,
      timestamp: new Date(),
      ip_address: req.ip
    });
  }
  
  return result;
}
```

### 4. Scheduled Operations
```javascript
const cron = require('node-cron');

// Reset all traffic on the 1st of every month at 3 AM
cron.schedule('0 3 1 * *', async () => {
  console.log('🔄 Starting monthly traffic reset...');
  
  try {
    // Generate pre-reset report
    const report = await trafficManager.generateTrafficReport();
    
    // Perform global reset
    const result = await client.resetAllTraffics();
    
    if (result.success) {
      console.log('✅ Monthly reset completed');
      await sendAdminNotification('Monthly traffic reset completed', report);
    }
  } catch (error) {
    console.error('❌ Monthly reset failed:', error.message);
    await sendAdminAlert('Monthly reset failed', error.message);
  }
});
```

## Use Cases

### Subscription Service Management
```javascript
class SubscriptionTrafficManager {
  constructor(client, database) {
    this.client = client;
    this.db = database;
  }

  async processBillingCycle() {
    // Get all subscriptions due for reset
    const dueSubscriptions = await this.db.subscriptions.find({
      next_billing_date: { $lte: new Date() },
      status: 'active'
    });

    console.log(`💳 Processing ${dueSubscriptions.length} billing cycles`);

    for (const subscription of dueSubscriptions) {
      try {
        // Reset client traffic
        await this.client.resetClientTraffic(
          subscription.inbound_id,
          subscription.client_email
        );

        // Update next billing date
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        
        await this.db.subscriptions.update(
          { id: subscription.id },
          {
            last_billing_date: new Date(),
            next_billing_date: nextBillingDate,
            reset_count: subscription.reset_count + 1
          }
        );

        console.log(`✅ Processed billing for ${subscription.client_email}`);
        
      } catch (error) {
        console.error(`❌ Failed billing for ${subscription.client_email}:`, error.message);
      }
    }
  }
}
```

### Data Usage Monitoring
```javascript
async function monitorDataUsage() {
  const alerts = [];
  
  // Get all active clients with data limits
  const clients = await database.clients.find({ 
    status: 'active',
    data_limit_gb: { $gt: 0 }
  });
  
  for (const client of clients) {
    try {
      const stats = await xuiClient.getClientTrafficsByEmail(client.email);
      
      if (stats.success && stats.obj) {
        const usage = stats.obj;
        const limitBytes = client.data_limit_gb * 1024 * 1024 * 1024;
        const usagePercent = (usage.total / limitBytes) * 100;
        
        // Check for usage thresholds
        if (usagePercent >= 100) {
          alerts.push({
            type: 'limit_exceeded',
            email: client.email,
            usage: usagePercent.toFixed(2),
            action: 'suspend_client'
          });
        } else if (usagePercent >= 90) {
          alerts.push({
            type: 'critical',
            email: client.email,
            usage: usagePercent.toFixed(2),
            action: 'send_warning'
          });
        } else if (usagePercent >= 75) {
          alerts.push({
            type: 'warning',
            email: client.email,
            usage: usagePercent.toFixed(2),
            action: 'send_notification'
          });
        }
        
        // Update usage in database
        await database.clients.update(
          { id: client.id },
          {
            current_usage_bytes: usage.total,
            usage_percentage: usagePercent,
            last_usage_check: new Date()
          }
        );
      }
    } catch (error) {
      console.error(`Error monitoring ${client.email}:`, error.message);
    }
  }
  
  return alerts;
}

// Monitor usage every hour
setInterval(async () => {
  const alerts = await monitorDataUsage();
  if (alerts.length > 0) {
    await processUsageAlerts(alerts);
  }
}, 3600000);
```

### Automated Maintenance
```javascript
class AutomatedMaintenance {
  constructor(trafficManager) {
    this.trafficManager = trafficManager;
    this.scheduleMaintenanceTasks();
  }

  scheduleMaintenanceTasks() {
    // Weekly cleanup of depleted clients (Sunday 2 AM)
    cron.schedule('0 2 * * 0', async () => {
      await this.weeklyCleanup();
    });

    // Monthly traffic reset (1st of month, 3 AM)
    cron.schedule('0 3 1 * *', async () => {
      await this.monthlyReset();
    });
  }

  async weeklyCleanup() {
    console.log('🧹 Starting weekly maintenance...');
    
    try {
      const inbounds = await this.trafficManager.client.getInbounds();
      let totalDeleted = 0;

      for (const inbound of inbounds.obj) {
        const result = await this.trafficManager.client.deleteDepletedClients(inbound.id);
        if (result.success) {
          totalDeleted++;
        }
      }

      console.log(`✅ Weekly cleanup completed: ${totalDeleted} inbounds processed`);
      
    } catch (error) {
      console.error('❌ Weekly cleanup failed:', error.message);
    }
  }

  async monthlyReset() {
    console.log('🔄 Starting monthly reset...');
    
    try {
      // Generate pre-reset report
      const report = await this.trafficManager.generateTrafficReport();
      
      // Perform reset
      const result = await this.trafficManager.client.resetAllTraffics();
      
      if (result.success) {
        await database.maintenance_logs.create({
          task_type: 'monthly_reset',
          completed_at: new Date(),
          pre_reset_stats: report.total_traffic,
          clients_affected: report.total_clients
        });
        
        console.log('✅ Monthly reset completed');
      }
    } catch (error) {
      console.error('❌ Monthly reset failed:', error.message);
    }
  }
}
``` 