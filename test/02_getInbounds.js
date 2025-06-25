// Test 02: Get Inbounds List with Auto-Session Management
async function test02_getInbounds(testState) {
    try {
        console.log('📋 Getting inbounds list with zero session management...');

        // OLD WAY: Had to ensure login first
        // await testState.client.login();
        // const result = await testState.client.getInbounds();

        // NEW WAY: Just call the method - session handled automatically!
        const result = await testState.client.getInbounds();

        if (result.success && result.obj) {
            console.log(`✅ Found ${result.obj.length} inbound(s)`);

            // Show useful information about inbounds
            const inboundSummary = result.obj.map((inbound, index) => ({
                index: index + 1,
                id: inbound.id,
                remark: inbound.remark,
                protocol: inbound.protocol,
                port: inbound.port,
                enable: inbound.enable,
                clientCount: inbound.settings ? JSON.parse(inbound.settings).clients?.length || 0 : 0
            }));

            console.log('📊 Inbound summary:', inboundSummary);

            // Store inbound IDs for future tests
            if (result.obj.length > 0) {
                testState.availableInboundIds = result.obj.map(inbound => inbound.id);
                testState.firstInboundId = result.obj[0].id;
                console.log(`💾 Stored inbound IDs for future tests: [${testState.availableInboundIds.join(', ')}]`);
            }

            return {
                ...result,
                summary: inboundSummary,
                coding_comparison: {
                    oldWay: 'await client.login(); const result = await client.getInbounds();',
                    newWay: 'const result = await client.getInbounds(); // Session auto-managed!'
                },
                lines_of_code_saved: 1
            };
        }

        return result;
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message,
            note: 'Session management still handled automatically even on errors!'
        };
    }
}

module.exports = test02_getInbounds;