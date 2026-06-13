/**
 * Phase C Test Execution - Automated (Non-Interactive)
 *
 * Executes all Phase C tests automatically without user approval prompts.
 * Useful for CI/CD or automated testing scenarios.
 *
 * Usage: node test/phase-c-execute-tests-auto.js
 */

const path = require('path');
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
    skipped: 0,
    manualRollbackNeeded: [],
    warnings: [],
  },
  tests: [],
  setupState: null,
};

/**
 * Main test execution (automated)
 */
async function executePhaseC() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    Phase C: Mutating Endpoints Testing (AUTOMATED)          ║');
  console.log('║                    ⚠️  DANGEROUS OPERATIONS                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Run setup
    console.log('Step 1: Running setup phase...\n');
    const setupResults = await setupPhaseC();
    testResults.setupState = setupResults;

    // Step 2: Execute tests (auto mode - no approval gates)
    console.log('\nStep 2: Executing tests (automated)...\n');
    const client = new ThreeXUI(BASE_URL, TEST_USERNAME, TEST_PASSWORD);

    const allTestCases = testConfig.getAllTestCases();
    testResults.summary.totalTests = allTestCases.length;

    for (const testCase of allTestCases) {
      if (testCase.skipIfUnsure) {
        console.log(`\nTest ${testCase.id}: ${testCase.name} (SKIPPED - high risk, requires manual approval)`);
        testResults.summary.skipped++;
        continue;
      }

      console.log(`\nTest ${testCase.id}: ${testCase.name}`);
      const startTime = Date.now();

      try {
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
        try {
          await verifyServerReachable(client);
        } catch (error) {
          console.log(`  ⚠  Warning: Server may not be reachable. Error: ${error.message}`);
        }
      } catch (error) {
        testResults.summary.failed++;
        console.log(`  ✗ ERROR: ${error.message}`);
        testResults.tests.push({
          testId: testCase.id,
          name: testCase.name,
          status: 'FAIL',
          error: error.message,
          response: null,
          rollbackStatus: null,
          duration: Date.now() - startTime,
        });
      }
    }

    // Step 3: Generate results
    console.log('\n\nStep 3: Generating results document...\n');
    await generateResultsDocument();

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Phase C Results                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`Passed:   ${testResults.summary.passed}/${testResults.summary.totalTests}`);
    console.log(`Failed:   ${testResults.summary.failed}/${testResults.summary.totalTests}`);
    console.log(`Skipped:  ${testResults.summary.skipped}/${testResults.summary.totalTests}`);
    console.log(`Manual Rollbacks: ${testResults.summary.manualRollbackNeeded.length}`);

    if (testResults.summary.manualRollbackNeeded.length > 0) {
      console.log('\n⚠️  Manual Rollback Items:');
      testResults.summary.manualRollbackNeeded.forEach((item) => console.log(`  - ${item}`));
    }

    console.log(`\nResults saved to: ${testResults.summary.resultFile}`);
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
    // Skip tests that are impractical to automate
    if (testCase.name === 'importDB') {
      result.status = 'FAIL';
      result.error = 'importDB requires proper FormData setup, skipped';
      return result;
    }

    if (testCase.name === 'stopXrayService') {
      result.status = 'FAIL';
      result.error = 'stopXrayService requires manual recovery verification, skipped';
      return result;
    }

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
      objFields: response.obj && typeof response.obj === 'object' ? Object.keys(response.obj).slice(0, 5) : [],
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
**Skipped:** ${testResults.summary.skipped}
**Duration:** ${Date.now() - new Date(testResults.summary.timestamp).getTime()}ms

## Baseline State (Pre-Test)

\`\`\`json
{
  "adminUsername": "${testResults.setupState.adminUsername}",
  "serverVersion": "${testResults.setupState.serverVersion}",
  "originalSettings": ${JSON.stringify(testResults.setupState.originalSettings, null, 2)},
  "trafficBaseline": ${JSON.stringify(testResults.setupState.trafficBaseline, null, 2)}
}
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

  markdown += `
## Summary

- **Total Tests:** ${testResults.summary.totalTests}
- **Passed:** ${testResults.summary.passed}
- **Failed:** ${testResults.summary.failed}
- **Skipped:** ${testResults.summary.skipped}
- **Success Rate:** ${((testResults.summary.passed / (testResults.summary.totalTests - testResults.summary.skipped)) * 100).toFixed(1)}%

`;

  require('fs').writeFileSync(filename, markdown);
  console.log(`Results saved to: ${filename}`);
  testResults.summary.resultFile = filename;
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
