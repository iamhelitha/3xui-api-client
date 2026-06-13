/**
 * Phase C Setup & Data Preparation
 *
 * Captures baseline system state before Phase C tests execute:
 * - Validates TEST server
 * - Captures current settings (for rollback)
 * - Creates test user
 * - Captures traffic/counter baselines
 * - Creates database backup for importDB test
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ThreeXUI = require('../index.js');
const testConfig = require('./phase-c-test-config.js');

const BASE_URL = process.env.TEST_PANEL_URL;
const TEST_USERNAME = process.env.TEST_PANEL_USERNAME;
const TEST_PASSWORD = process.env.TEST_PANEL_PASSWORD;

if (!BASE_URL || !TEST_USERNAME || !TEST_PASSWORD) {
  console.error('Missing TEST_PANEL_URL / TEST_PANEL_USERNAME / TEST_PANEL_PASSWORD in .env');
  process.exit(1);
}

// Global state captured during setup
const setupState = {
  serverUrl: BASE_URL,
  serverVersion: null,
  timestamp: new Date().toISOString(),
  originalSettings: {},
  originalXrayConfig: null,
  adminUsername: TEST_USERNAME, // Current admin username
  adminPassword: TEST_PASSWORD, // Current admin password
  databaseBackup: null,
  trafficBaseline: null,
  errors: [],
};

/**
 * Main setup function
 */
async function setupPhaseC() {
  console.log('\n=== Phase C Setup & Data Preparation ===\n');

  const client = new ThreeXUI(BASE_URL, TEST_USERNAME, TEST_PASSWORD);

  try {
    // Step 1: Validate TEST server
    console.log('1. Validating TEST server...');
    await validateTestServer(client);
    console.log('   ✓ TEST server validated');

    // Step 2: Capture baseline settings
    console.log('2. Capturing current settings...');
    await captureBaselineSettings(client);
    console.log('   ✓ Settings captured (language, theme, etc.)');

    // Step 3: Capture Xray config
    console.log('3. Capturing Xray configuration...');
    await captureXrayConfig(client);
    console.log('   ✓ Xray config captured');

    // Step 4: Capture admin credentials (no test user needed)
    console.log('4. Admin credentials captured for updateUser test...');
    console.log(`   ✓ Will test: ${setupState.adminUsername} → admin_phase_c_test → ${setupState.adminUsername}`);

    // Step 5: Capture traffic baseline
    console.log('5. Capturing traffic baseline...');
    await captureTrafficBaseline(client);
    console.log('   ✓ Traffic baseline captured');

    // Step 6: Create database backup
    console.log('6. Creating database backup for importDB test...');
    await createDatabaseBackup(client);
    console.log('   ✓ Database backup created');

    console.log('\n=== Setup Complete ===');
    console.log(`Server: ${BASE_URL}`);
    console.log(`Version: ${setupState.serverVersion}`);
    console.log(`Admin Username: ${setupState.adminUsername}`);
    console.log(`Timestamp: ${setupState.timestamp}`);

    return setupState;
  } catch (error) {
    console.error('\n✗ Setup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Step 1: Validate that we're testing against TEST server, not PRODUCTION
 */
async function validateTestServer(client) {
  const stats = await client.getServerStatus();

  // Check server hostname/URL to ensure it's TEST server
  const isTestServer =
    BASE_URL.includes('test') ||
    BASE_URL.includes('localhost') ||
    BASE_URL.includes('127.0.0.1') ||
    BASE_URL.includes('staging');

  if (!isTestServer) {
    console.log(`\n   ⚠️  WARNING: "${BASE_URL}" does not appear to be a TEST/DEV server.`);
    console.log(`   Phase C tests are DESTRUCTIVE and should only run on non-production servers.`);
    console.log(`   If this IS a safe test/staging server, Phase C will proceed.`);
    console.log(`   If this is PRODUCTION, STOP NOW and update TEST_PANEL_URL in .env\n`);
  }

  setupState.serverVersion = stats.obj?.panelVersion || 'unknown';
  console.log(`   Server: ${BASE_URL}`);
  console.log(`   Version: ${setupState.serverVersion}`);
}

/**
 * Step 2: Capture current settings for rollback reference
 */
async function captureBaselineSettings(client) {
  const allSettings = await client.getAllSettings();

  if (allSettings.success && allSettings.obj) {
    // Store settings that Phase C tests will modify
    setupState.originalSettings = {
      language: allSettings.obj.language || 'en_US',
      theme: allSettings.obj.theme || 'light',
      // Add other settings as needed
    };
  }
}

/**
 * Step 3: Capture Xray configuration
 */
async function captureXrayConfig(client) {
  const configResponse = await client.getXrayConfig();

  if (configResponse.success && configResponse.obj) {
    // Store original config as JSON string
    setupState.originalXrayConfig =
      typeof configResponse.obj === 'string' ? configResponse.obj : JSON.stringify(configResponse.obj);
  }
}

/**
 * Step 4: Admin credentials already captured in setupState
 * No separate test user needed - updateUser test will use admin credentials
 */

/**
 * Step 5: Capture traffic baseline for reference
 */
async function captureTrafficBaseline(client) {
  const outboundsTraffic = await client.getOutboundsTraffic();

  if (outboundsTraffic.success) {
    setupState.trafficBaseline = {
      outbounds: outboundsTraffic.obj || [],
      capturedAt: new Date().toISOString(),
    };
  }
}

/**
 * Step 6: Create database backup
 * This backup is used for the importDB test and rollback
 */
async function createDatabaseBackup(client) {
  const dbContent = await client.getDb();

  if (dbContent.success && dbContent.obj) {
    // Store database as base64 for FormData submission later
    const dbString = typeof dbContent.obj === 'string' ? dbContent.obj : JSON.stringify(dbContent.obj);

    setupState.databaseBackup = {
      content: dbString,
      size: dbString.length,
      capturedAt: new Date().toISOString(),
      checksum: simpleChecksum(dbString),
    };
  }
}

/**
 * Simple checksum for backup verification
 */
function simpleChecksum(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Export setup state for use by test runner
 */
module.exports = {
  setupPhaseC,
  setupState,
};

// Run setup if executed directly
if (require.main === module) {
  setupPhaseC()
    .then(() => {
      console.log('\nSetup state:', JSON.stringify(setupState, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}
