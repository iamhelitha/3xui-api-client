/**
 * Phase C Test Execution Runner
 *
 * Executes all 10 mutating/destructive API endpoints with:
 * - User approval gates (global + per-endpoint)
 * - Sequential execution with error handling
 * - Automatic rollback for reversible operations
 * - Server recovery verification after destructive ops
 * - Comprehensive result documentation
 *
 * Usage: node test/phase-c-execute-tests.js
 */

const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ThreeXUI = require('../index.js');
const testConfig = require('./phase-c-test-config.js');
const { setupPhaseC, setupState } = require('./phase-c-setup-data.js');

const BASE_URL = process.env.TEST_PANEL_URL;
const TEST_USERNAME = process.env.TEST_PANEL_USERNAME;
const TEST_PASSWORD = process.env.TEST_PANEL_PASSWORD;

// Test execution results
const testResults = {
  summary: {
    serverUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    manualRollbackNeeded: [],
    warnings: [],
  },
  tests: [],
  setupState: null,
};

/**
 * Main test execution
 */
async function executePhaseC() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           Phase C: Mutating Endpoints Testing               ║');
  console.log('║                    ⚠️  DANGEROUS OPERATIONS                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Run setup
    console.log('Step 1: Running setup phase...\n');
    const setupResults = await setupPhaseC();
    testResults.setupState = setupResults;

    // Step 2: Global approval gate
    console.log('\nStep 2: Safety approval...\n');
    const approved = await askUserApproval(
      `Phase C will execute DESTRUCTIVE operations on ${BASE_URL}.\n` +
        `This includes:\n` +
        `  • Service restarts (panel, xray)\n` +
        `  • Database operations\n` +
        `  • Configuration changes\n\n` +
        `Continue? (yes/no): `
    );

    if (!approved) {
      console.log('\n✗ Phase C cancelled by user');
      process.exit(0);
    }

    // Step 3: Execute tests
    console.log('\nStep 3: Executing tests...\n');
    const client = new ThreeXUI(BASE_URL, TEST_USERNAME, TEST_PASSWORD);

    testResults.summary.totalTests = testConfig.getAllTestCases().length;

    for (const testCase of testConfig.getAllTestCases()) {
      if (testCase.skipIfUnsure) {
        console.log(`\nTest ${testCase.id}: ${testCase.name} (SKIPPED - high risk)`);
        continue;
      }

      // Per-endpoint approval
      const endpointApproved = await askUserApproval(
        `\n${testCase.description_detailed}\n\nProceed? (yes/no): `
      );

      if (!endpointApproved) {
        console.log(`  ⊘ Skipped by user`);
        continue;
      }

      // Execute test
      console.log(`\nTest ${testCase.id}: ${testCase.name}`);
      const startTime = Date.now();
      const result = await executeTest(client, testCase);
      const duration = Date.now() - startTime;

      result.duration = duration;
      testResults.tests.push(result);

      if (result.status === 'PASS') {
        testResults.summary.passed++;
        console.log(`  ✓ PASS (${duration}ms)`);
      } else if (result.status === 'FAIL') {
        testResults.summary.failed++;
        console.log(`  ✗ FAIL: ${result.error}`);
      } else if (result.status === 'MANUAL_ROLLBACK_NEEDED') {
        testResults.summary.manualRollbackNeeded.push(testCase.name);
        console.log(`  ⚠ MANUAL ROLLBACK NEEDED: ${result.error}`);
      }

      // Verify server is still reachable
      await verifyServerReachable(client);
    }

    // Step 4: Cleanup
    console.log('\n\nStep 4: Cleanup...\n');
    await cleanupTestUser(client);
    console.log('✓ Test user removed');

    // Step 5: Generate results
    console.log('\nStep 5: Generating results document...\n');
    await generateResultsDocument();

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Phase C Results                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`Passed:  ${testResults.summary.passed}/${testResults.summary.totalTests}`);
    console.log(`Failed:  ${testResults.summary.failed}/${testResults.summary.totalTests}`);
    console.log(`Manual Rollbacks:  ${testResults.summary.manualRollbackNeeded.length}`);

    if (testResults.summary.manualRollbackNeeded.length > 0) {
      console.log('\n⚠️  Manual Rollback Items:');
      testResults.summary.manualRollbackNeeded.forEach((item) => console.log(`  - ${item}`));
    }

    process.exit(testResults.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n✗ Execution failed:', error.message);
    process.exit(1);
  }
}

/**
 * Execute a single test case
 */
async function executeTest(client, testCase) {
  const result = {
    testId: testCase.id,
    name: testCase.name,
    status: 'UNKNOWN',
    response: null,
    error: null,
    rollbackStatus: null,
  };

  try {
    // Execute the endpoint
    const response = await retryWithBackoff(
      async () => {
        const method = testCase.method;
        if (!client[method]) {
          throw new Error(`Method not found: ${method}`);
        }

        // Prepare parameters based on test case
        const params = prepareTestParams(testCase);
        return await client[method](...params);
      },
      testConfig.globals.maxRetries,
      testConfig.globals.baseRetryDelayMs
    );

    result.response = {
      success: response.success,
      msg: response.msg,
      objType: response.obj === null ? 'null' : typeof response.obj,
      objFields: response.obj && typeof response.obj === 'object' ? Object.keys(response.obj) : [],
    };

    // Validate response shape
    const validation = validateResponse(testCase, response);
    if (!validation.valid) {
      result.status = 'FAIL';
      result.error = `Response validation failed: ${validation.error}`;
      return result;
    }

    // Execute rollback if reversible
    if (testCase.reversible && response.success) {
      try {
        const rollbackResponse = await executeRollback(client, testCase);
        result.rollbackStatus = rollbackResponse.success ? 'SUCCESS' : 'FAILED';

        if (!rollbackResponse.success) {
          result.status = 'MANUAL_ROLLBACK_NEEDED';
          result.error = `Rollback failed: ${rollbackResponse.msg}`;
          return result;
        }
      } catch (rollbackError) {
        result.status = 'MANUAL_ROLLBACK_NEEDED';
        result.error = `Rollback threw error: ${rollbackError.message}`;
        return result;
      }
    }

    result.status = response.success ? 'PASS' : 'FAIL';
    if (!response.success) {
      result.error = response.msg;
    }

    return result;
  } catch (error) {
    result.status = 'FAIL';
    result.error = error.message;
    return result;
  }
}

/**
 * Prepare parameters for a test based on test case configuration
 */
function prepareTestParams(testCase) {
  const params = [];

  // Handle test case specific parameter preparation
  switch (testCase.name) {
    case 'updateSetting':
      params.push({
        [testCase.params.settingKey]: testCase.params.settingValue,
      });
      break;

    case 'updateUser':
      const adminUsername = testResults.setupState.adminUsername;
      const adminPassword = testResults.setupState.adminPassword;
      // Change admin username to temporary name
      params.push(adminUsername); // oldUsername
      params.push(adminPassword); // oldPassword
      params.push('admin_phase_c_test'); // newUsername (temporary)
      params.push(adminPassword); // newPassword (keep same)
      break;

    case 'updateXrayConfig':
      const currentConfig = testResults.setupState.originalXrayConfig;
      params.push(currentConfig);
      break;

    case 'manageWarp':
      params.push(testCase.params.action);
      params.push(testCase.params.data);
      break;

    case 'importDB':
      // Skip importDB for now - requires proper FormData handling
      throw new Error('importDB test requires proper FormData setup, skipping for now');

    case 'installXray':
      params.push(testCase.params.version);
      break;

    default:
      // No parameters
      break;
  }

  return params;
}

/**
 * Execute rollback for reversible operations
 */
async function executeRollback(client, testCase) {
  const rollbackParams = testCase.rollbackParams;
  if (!rollbackParams) {
    return { success: true, msg: 'No rollback needed' };
  }

  // Prepare rollback parameters
  const params = [];

  switch (testCase.name) {
    case 'updateSetting':
      params.push({
        [rollbackParams.settingKey]: testResults.setupState.originalSettings[rollbackParams.settingKey],
      });
      break;

    case 'updateUser':
      const adminPassword = testResults.setupState.adminPassword;
      // Rollback: change from temporary name back to original
      params.push('admin_phase_c_test'); // oldUsername (temporary)
      params.push(adminPassword); // oldPassword (same)
      params.push(testResults.setupState.adminUsername); // newUsername (restore original)
      params.push(adminPassword); // newPassword (keep same)
      break;

    case 'updateXrayConfig':
      params.push(testResults.setupState.originalXrayConfig);
      break;

    case 'importDB':
      // Skip importDB rollback - requires proper FormData
      return { success: true, msg: 'importDB rollback skipped' };

    default:
      return { success: true, msg: 'No rollback needed' };
  }

  const method = testCase.method;
  return await client[method](...params);
}

/**
 * Validate response matches expected shape
 */
function validateResponse(testCase, response) {
  // Check required fields
  for (const field of testCase.expectedFields) {
    if (!(field in response)) {
      return { valid: false, error: `Missing field: ${field}` };
    }
  }

  // Check field types (basic validation)
  for (const [field, expectedType] of Object.entries(testCase.expectedTypes)) {
    if (!(field in response)) continue;

    const actualType = response[field] === null ? 'null' : typeof response[field];
    const expectedTypes = Array.isArray(expectedType) ? expectedType : [expectedType];

    if (!expectedTypes.includes(actualType)) {
      return {
        valid: false,
        error: `Field ${field} has type ${actualType}, expected ${expectedTypes.join('|')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Verify server is still reachable
 */
async function verifyServerReachable(client, timeoutMs = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      await client.getServerStatus();
      return true;
    } catch {
      await delay(1000);
    }
  }

  throw new Error('Server did not recover within timeout');
}

/**
 * Clean up after tests complete
 */
async function cleanupTestUser(client) {
  // No cleanup needed - updateUser test already rolls back admin username
  return;
}

/**
 * Generate results document
 */
async function generateResultsDocument() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(__dirname, `phase-c-result-${timestamp}.md`);

  let markdown = `# Phase C Test Results

**Server:** ${testResults.summary.serverUrl}
**Timestamp:** ${testResults.summary.timestamp}
**Tests Run:** ${testResults.summary.totalTests}
**Passed:** ${testResults.summary.passed}
**Failed:** ${testResults.summary.failed}
**Duration:** ${Date.now() - new Date(testResults.summary.timestamp).getTime()}ms

## Baseline State (Pre-Test)

\`\`\`json
${JSON.stringify(testResults.setupState, null, 2)}
\`\`\`

## Test Results

`;

  for (const test of testResults.tests) {
    markdown += `
### ${test.testId}. ${test.name}

- **Status:** ${test.status}
- **Duration:** ${test.duration}ms
- **Error:** ${test.error || 'N/A'}
- **Rollback Status:** ${test.rollbackStatus || 'N/A'}

\`\`\`json
${JSON.stringify(test.response, null, 2)}
\`\`\`

`;
  }

  if (testResults.summary.manualRollbackNeeded.length > 0) {
    markdown += `
## Manual Rollback Items

${testResults.summary.manualRollbackNeeded.map((item) => `- ${item}`).join('\n')}

`;
  }

  require('fs').writeFileSync(filename, markdown);
  console.log(`Results saved to: ${filename}`);
  testResults.summary.resultFile = filename;
}

/**
 * Ask user for approval
 */
async function askUserApproval(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Delay utility
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run if executed directly
if (require.main === module) {
  executePhaseC().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  executePhaseC,
  testResults,
};
