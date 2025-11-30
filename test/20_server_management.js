// Test 20: Server Management & Generators

async function test20_server_management(testState) {
    try {
        console.log('🖥️  Testing Server Management & Generators...');

        const results = {};

        // 1. Server Status
        console.log('   Checking Server Status...');
        const status = await testState.client.getServerStatus();
        results.status = status.success;

        // 2. Xray Version
        console.log('   Checking Xray Version...');
        const version = await testState.client.getXrayVersion();
        results.version = version.success;

        // 3. CPU History
        console.log('   Checking CPU History...');
        const cpu = await testState.client.getCPUHistory();
        results.cpu = cpu.success;

        // 4. Logs
        console.log('   Checking Panel Logs...');
        const logs = await testState.client.getPanelLogs(10);
        results.logs = logs.success;

        // 5. Generators
        console.log('   Testing Generators...');
        const uuid = await testState.client.getNewUUID();
        const cert = await testState.client.getNewX25519Cert();

        results.generators = {
            uuid: uuid.success,
            cert: cert.success
        };

        return {
            success: true,
            message: 'Server management endpoints tested successfully',
            data: {
                serverStatus: status.obj,
                xrayVersion: version.obj,
                generators: {
                    newUUID: uuid.obj,
                    newCert: cert.obj
                }
            }
        };

    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message
        };
    }
}

module.exports = test20_server_management;