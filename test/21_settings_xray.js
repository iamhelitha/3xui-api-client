// Test 21: Settings & Xray Configuration

async function test21_settings_xray(testState) {
    try {
        console.log('⚙️  Testing Settings & Xray Configuration...');

        const results = {};

        // 1. Panel Settings
        console.log('   Fetching Panel Settings...');
        const settings = await testState.client.getAllSettings();
        results.settings = settings.success;

        // 2. Default Settings
        console.log('   Fetching Default Settings...');
        const defaults = await testState.client.getDefaultSettings();
        results.defaults = defaults.success;

        // 3. Xray Config
        console.log('   Fetching Xray Config...');
        const xrayConfig = await testState.client.getXrayConfig();
        results.xrayConfig = xrayConfig.success;

        // 4. Outbound Traffic
        console.log('   Fetching Outbound Traffic...');
        const traffic = await testState.client.getOutboundsTraffic();
        results.traffic = traffic.success;

        return {
            success: true,
            message: 'Settings & Xray endpoints tested successfully',
            data: {
                settingsCount: settings.obj ? Object.keys(settings.obj).length : 0,
                xrayConfigLength: xrayConfig.obj ? xrayConfig.obj.length : 0,
                outboundTraffic: traffic.obj
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

module.exports = test21_settings_xray;