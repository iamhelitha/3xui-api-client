const ThreeXUI = require('../index.js');
require('dotenv').config({ path: './test/config.env' });
const readline = require('readline');

// Test file imports
const test01_login = require('./01_login.js');
const test02_getInbounds = require('./02_getInbounds.js');
const test03_getOnlineClients = require('./03_getOnlineClients.js');
const test04_getInbound = require('./04_getInbound.js');
const test05_addInbound = require('./05_addInbound.js');
const test06_updateInbound = require('./06_updateInbound.js');
const test07_addClient = require('./07_addClient.js');
const test08_updateClient = require('./08_updateClient.js');
const test09_deleteClient = require('./09_deleteClient.js');
const test10_deleteInbound = require('./10_deleteInbound.js');
const test11_getClientTrafficsByEmail = require('./11_getClientTrafficsByEmail.js');
const test12_getClientTrafficsById = require('./12_getClientTrafficsById.js');
const test13_getClientIps = require('./13_getClientIps.js');
const test14_clearClientIps = require('./14_clearClientIps.js');
const test15_resetClientTraffic = require('./15_resetClientTraffic.js');
const test16_resetAllTraffics = require('./16_resetAllTraffics.js');
const test17_resetAllClientTraffics = require('./17_resetAllClientTraffics.js');
const test18_deleteDepletedClients = require('./18_deleteDepletedClients.js');
const test19_createBackup = require('./19_createBackup.js');

// Shared test state
const testState = {
    client: null,
    createdInbound: null,
    createdClient: null
};

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function waitForEnter(message = "Press Enter to continue...") {
    return new Promise((resolve) => {
        rl.question(`\n${message}\n`, () => {
            resolve();
        });
    });
}

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

function printHeader(testNumber, testName) {
    console.log('\n' + '='.repeat(60));
    console.log(`TEST ${testNumber}: ${testName}`);
    console.log('='.repeat(60));
}

function printRawResponse(result) {
    console.log('\n📋 RAW API Response:');
    console.log(JSON.stringify(result, null, 2));
}

async function handleTestResult(testFunction, testState, testNumber, testName) {
    let result;
    let attempt = 1;
    
    while (true) {
        try {
            // Pass the readline interface to tests that need user input
            result = await testFunction(testState, rl);
            printRawResponse(result);
            
            // Determine if test passed based on actual API response
            const apiSuccess = result.success !== false && !result.error;
            const testPassed = apiSuccess && !result.cancelled;
            
            if (testPassed) {
                console.log('✅ Test passed successfully');
                return true;
            } else {
                console.log('❌ Test failed');
                if (result.error) {
                    console.log(`   Error: ${result.error}`);
                }
                if (result.message) {
                    console.log(`   Message: ${result.message}`);
                }
                if (result.cancelled) {
                    console.log('   (Operation was cancelled by user)');
                }
                
                // Ask user what to do with failed test
                const action = await askQuestion('\n❓ Test failed. What would you like to do?\n   (r)etry / (s)kip / (q)uit: ');
                
                if (action.toLowerCase() === 'r' || action.toLowerCase() === 'retry') {
                    attempt++;
                    console.log(`\n🔄 Retrying test (attempt ${attempt})...`);
                    continue;
                } else if (action.toLowerCase() === 's' || action.toLowerCase() === 'skip') {
                    console.log('⏭️  Skipping test...');
                    return false;
                } else if (action.toLowerCase() === 'q' || action.toLowerCase() === 'quit') {
                    console.log('🚪 Exiting tests...');
                    process.exit(0);
                } else {
                    console.log('Invalid option. Skipping test...');
                    return false;
                }
            }
        } catch (error) {
            console.log('💥 Test threw an exception:');
            console.log(error.message);
            
            const action = await askQuestion('\n❓ Test threw an error. What would you like to do?\n   (r)etry / (s)kip / (q)uit: ');
            
            if (action.toLowerCase() === 'r' || action.toLowerCase() === 'retry') {
                attempt++;
                console.log(`\n🔄 Retrying test (attempt ${attempt})...`);
                continue;
            } else if (action.toLowerCase() === 's' || action.toLowerCase() === 'skip') {
                console.log('⏭️  Skipping test...');
                return false;
            } else if (action.toLowerCase() === 'q' || action.toLowerCase() === 'quit') {
                console.log('🚪 Exiting tests...');
                process.exit(0);
            } else {
                console.log('Invalid option. Skipping test...');
                return false;
            }
        }
    }
}

async function runMainTests() {
    console.log('🚀 3X-UI API Testing Suite');
    console.log('=' .repeat(60));
    console.log('📊 Total Tests: 19');
    console.log('🔗 Base URL:', process.env.XUI_BASE_URL);
    console.log('👤 Username:', process.env.XUI_USERNAME);
    console.log('=' .repeat(60));

    await waitForEnter("Press Enter to START testing...");

    try {
        // Initialize client
        testState.client = new ThreeXUI(
            process.env.XUI_BASE_URL,
            process.env.XUI_USERNAME,
            process.env.XUI_PASSWORD
        );

        // Main test sequence (steps 1-10)
        const mainTests = [
            { test: test01_login, name: "Login Authentication", number: "01" },
            { test: test02_getInbounds, name: "Get Inbounds List", number: "02" },
            { test: test03_getOnlineClients, name: "Get Online Clients", number: "03" },
            { test: test04_getInbound, name: "Get Specific Inbound", number: "04" },
            { test: test05_addInbound, name: "Add New Inbound", number: "05" },
            { test: test06_updateInbound, name: "Update Inbound", number: "06" },
            { test: test07_addClient, name: "Add Client to Inbound", number: "07" },
            { test: test08_updateClient, name: "Update Client", number: "08" },
            { test: test09_deleteClient, name: "Delete Client", number: "09" },
            { test: test10_deleteInbound, name: "Delete Inbound", number: "10" }
        ];

        // Run main test sequence
        for (const { test, name, number } of mainTests) {
            printHeader(number, name);
            await handleTestResult(test, testState, number, name);
            await waitForEnter();
        }

        // Additional tests (steps 11-19) - with user confirmation
        const additionalTests = [
            { test: test11_getClientTrafficsByEmail, name: "Get Client Traffics by Email", number: "11" },
            { test: test12_getClientTrafficsById, name: "Get Client Traffics by ID", number: "12" },
            { test: test13_getClientIps, name: "Get Client IPs", number: "13" },
            { test: test14_clearClientIps, name: "Clear Client IPs", number: "14" },
            { test: test15_resetClientTraffic, name: "Reset Client Traffic", number: "15" },
            { test: test16_resetAllTraffics, name: "Reset All Traffics", number: "16" },
            { test: test17_resetAllClientTraffics, name: "Reset All Client Traffics", number: "17" },
            { test: test18_deleteDepletedClients, name: "Delete Depleted Clients", number: "18" },
            { test: test19_createBackup, name: "Create Backup", number: "19" }
        ];

        console.log('\n' + '='.repeat(60));
        console.log('🔧 ADDITIONAL API TESTS');
        console.log('⚠️  These tests require user input and confirmation');
        console.log('='.repeat(60));

        for (const { test, name, number } of additionalTests) {
            const runTest = await askQuestion(`\n❓ Do you want to run Test ${number}: ${name}? (y/n): `);

            if (!(runTest.toLowerCase().startsWith('y'))) {
                console.log(`⏭️  Skipping Test ${number}`);
                continue;
            }

            printHeader(number, name);
            await handleTestResult(test, testState, number, name);
            await waitForEnter();
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 ALL TESTS COMPLETED!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('💥 Fatal error:', error.message);
    } finally {
        rl.close();
        console.log('\n👋 Test session ended. You can run "npm test" again to restart.');
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n👋 Testing interrupted by user');
    rl.close();
    process.exit(0);
});

// Run the tests
if (require.main === module) {
    runMainTests();
}

module.exports = { runMainTests, testState }; 