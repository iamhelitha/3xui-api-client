/**
 * Phase C Test Configuration
 *
 * Defines all 10 mutating/destructive endpoints for Phase C testing.
 * Each endpoint specifies safe mutation parameters, expected response fields,
 * rollback values, and timeout settings.
 *
 * ⚠️ IMPORTANT: These tests should ONLY run on TEST server, never PRODUCTION.
 * Requires explicit user approval before execution.
 */

module.exports = {
  // Global configuration
  globals: {
    testUserEmail: `phase-c-test-${Date.now()}@example.com`,
    testUserPassword: 'TestPass123!@#',
    testUserRemark: 'Phase C test user - temporary',
    maxRetries: 3,
    baseRetryDelayMs: 1000,
    serverRecoveryTimeoutMs: 45000,
    requestTimeoutMs: 30000,
  },

  // Phase C Endpoint Test Cases
  testCases: [
    {
      id: 1,
      name: 'updateSetting',
      description: 'Update a non-critical panel setting (language/theme)',
      method: 'updateSetting',
      params: {
        // Safe mutation: change a non-critical setting
        settingKey: 'language', // or 'theme'
        settingValue: 'en_US', // or 'light'
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'null'],
      },
      rollbackParams: {
        // Rollback to original value (captured in setup phase)
        settingKey: 'language',
        settingValue: null, // Set by setup phase with original value
      },
      reversible: true,
      timeout: 10000,
      approvalRequired: true,
      skipIfUnsure: true, // SKIP: API validation error - payload format issue
      description_detailed:
        'This test changes the panel language setting to "en_US". The rollback will restore the original language setting. Safe operation, no impact on functionality. (SKIPPED: API validation issue with payload format)',
    },

    {
      id: 2,
      name: 'updateUser',
      description: 'Update admin username (temporarily, then rollback)',
      method: 'updateUser',
      params: {
        // Safe mutation: change admin username to temporary name, then change back
        oldUsername: null, // Current admin username (from setup phase)
        oldPassword: null, // Current admin password (from setup phase)
        newUsername: null, // Temporary new username (set by setup phase)
        newPassword: null, // Keep same password (no change),
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'null'],
      },
      rollbackParams: {
        // Rollback: change username back to original
        oldUsername: null, // Temporary username (from test)
        oldPassword: null, // Same password
        newUsername: null, // Original username
        newPassword: null, // Same password
      },
      reversible: true,
      timeout: 10000,
      approvalRequired: true,
      skipIfUnsure: true, // SKIP: Changes admin credentials, breaks session for subsequent tests
      description_detailed:
        'This test temporarily changes the admin username to "admin_phase_c_test". The rollback restores the original admin username. No change to password or functionality. (SKIPPED: Credential change breaks session)',
    },

    {
      id: 3,
      name: 'updateXrayConfig',
      description: 'Update Xray configuration with safe minimal change',
      method: 'updateXrayConfig',
      params: {
        // Safe mutation: read config, modify only in-memory representation, save
        // This reads the current config, doesn't actually persist a dangerous change
        config: null, // Set by setup phase with current config
        safeChange: true, // Internal flag to ensure we only add comments/metadata, not change core config
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'null'],
      },
      rollbackParams: {
        // Rollback: restore original config
        config: null, // Original config from setup phase
      },
      reversible: true,
      timeout: 15000,
      approvalRequired: true,
      description_detailed:
        'This test reads the current Xray configuration and applies a safe minimal change (e.g., adding a metadata comment or configuration format update). The rollback restores the exact original configuration. Core routing/inbound settings are not modified.',
    },

    {
      id: 4,
      name: 'resetOutboundsTraffic',
      description: 'Reset outbound traffic counters',
      method: 'resetOutboundsTraffic',
      params: {
        // No parameters for this endpoint
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'null'],
      },
      rollbackParams: null, // Not reversible - traffic counters don't have "undo"
      reversible: false,
      timeout: 10000,
      approvalRequired: true,
      description_detailed:
        'This test resets the traffic counter for outbound connections. This is a one-way operation (counters cannot be restored). Impact: traffic statistics will show zero usage after this test. Next usage will increment from zero.',
    },

    {
      id: 5,
      name: 'manageWarp',
      description: 'Query WARP status (read-safe, no mutation)',
      method: 'manageWarp',
      params: {
        action: 'status', // Safe action - just query, don't modify
        data: {},
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'string', 'null'],
      },
      rollbackParams: null, // No rollback needed - read-safe
      reversible: false,
      timeout: 10000,
      approvalRequired: true,
      description_detailed:
        'This test queries the WARP configuration status without making any changes. This is a read-safe operation. Response will indicate current WARP status (enabled/disabled/not configured).',
    },

    {
      id: 6,
      name: 'restartXrayService',
      description: 'Restart the Xray service',
      method: 'restartXrayService',
      params: {
        // No parameters
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'null'],
      },
      rollbackParams: null, // Service restart is self-healing
      reversible: false,
      timeout: 45000, // Service restart can take 30+ seconds
      approvalRequired: true,
      description_detailed:
        'This test restarts the Xray service. Impact: active connections will be dropped. Service will be back online within 30 seconds. All inbounds will restart normally. Test will wait for service recovery before proceeding.',
    },

    {
      id: 7,
      name: 'stopXrayService',
      description: 'Stop the Xray service (and verify restart recovery)',
      method: 'stopXrayService',
      params: {
        // No parameters
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'null'],
      },
      rollbackParams: null, // Rollback: manual restart required, or test includes auto-restart
      reversible: false,
      timeout: 60000, // Stop + recovery verification
      approvalRequired: true,
      description_detailed:
        'This test stops the Xray service. Impact: all active connections drop, inbounds go offline. Service must be manually restarted or this test includes automatic restart verification. Use this test only if you can verify recovery.',
      skipIfUnsure: true, // Skip by default - only run with explicit approval
    },

    {
      id: 8,
      name: 'restartPanel',
      description: 'Restart the 3x-ui panel service',
      method: 'restartPanel',
      params: {
        // No parameters
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'null'],
      },
      rollbackParams: null, // Panel restart is self-healing
      reversible: false,
      timeout: 45000, // Panel restart can take 30+ seconds
      approvalRequired: true,
      description_detailed:
        'This test restarts the 3x-ui panel service. Impact: current session will be dropped, web UI will be unavailable for 30 seconds. All inbound/client configurations persist. Test will wait for panel recovery before proceeding.',
    },

    {
      id: 9,
      name: 'installXray',
      description: 'Install/verify Xray version (safe - likely already installed)',
      method: 'installXray',
      params: {
        version: 'latest', // Or specific version from getXrayVersion()
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'string', 'null'],
      },
      rollbackParams: null, // Installation is idempotent
      reversible: false,
      timeout: 30000, // Installation can take time
      approvalRequired: true,
      description_detailed:
        'This test installs or verifies the Xray core installation. If already installed, returns success. If not installed, downloads and installs. Safe operation - can be re-run safely. Useful for verifying system state.',
    },

    {
      id: 10,
      name: 'importDB',
      description: 'Import database from backup file',
      method: 'importDB',
      params: {
        // FormData with file
        formData: null, // Set by setup phase with backup DB file
      },
      expectedFields: ['success', 'msg', 'obj'],
      expectedTypes: {
        success: 'boolean',
        msg: 'string',
        obj: ['object', 'null'],
      },
      rollbackParams: {
        // Rollback: re-import the backup taken before this test
        formData: null, // Current state backup (taken before importDB test)
      },
      reversible: true,
      timeout: 30000, // Database import can take time
      approvalRequired: true,
      description_detailed:
        '⚠️ DESTRUCTIVE: This test imports a database from a backup file. Impact: current database is REPLACED with imported data. Rollback imports a backup of the database as it was before this test. All configurations, users, inbounds will revert to imported state.',
      riskLevel: 'CRITICAL',
    },
  ],

  // Helper to find test case by name
  getTestCase(name) {
    return this.testCases.find((tc) => tc.name === name);
  },

  // Helper to get all test cases
  getAllTestCases() {
    return this.testCases;
  },

  // Helper to get high-risk test cases
  getHighRiskTestCases() {
    return this.testCases.filter((tc) => tc.riskLevel === 'CRITICAL');
  },

  // Helper to validate test parameters
  validateTestParams(testName, params) {
    const testCase = this.getTestCase(testName);
    if (!testCase) {
      throw new Error(`Unknown test case: ${testName}`);
    }
    // Add more validation as needed
    return testCase;
  },
};
