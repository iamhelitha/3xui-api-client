// Test 04: Get Specific Inbound with Smart ID Management
async function test04_getInbound(testState) {
    try {
        console.log('🔍 Getting specific inbound with smart ID management...');

        // NEW APPROACH: Use data from previous tests instead of brute force
        let targetId = testState.firstInboundId || testState.createdInboundId;

        if (!targetId) {
            // Fallback: Try to get inbounds list first
            console.log('   No stored inbound ID, fetching inbounds list...');
            const inboundsResult = await testState.client.getInbounds();
            if (inboundsResult.success && inboundsResult.obj && inboundsResult.obj.length > 0) {
                targetId = inboundsResult.obj[0].id;
                testState.firstInboundId = targetId;
                console.log(`   Using first available inbound ID: ${targetId}`);
            } else {
                return {
                    success: false,
                    message: 'No inbounds available to query',
                    suggestion: 'Create an inbound first using test 05'
                };
            }
        }

        console.log(`   Querying inbound ID: ${targetId}`);

        // AUTO-SESSION: No manual login needed!
        const result = await testState.client.getInbound(targetId);

        if (result.success && result.obj) {
            const inbound = result.obj;
            console.log('✅ Inbound details retrieved:');
            console.log(`   Remark: ${inbound.remark}`);
            console.log(`   Protocol: ${inbound.protocol}`);
            console.log(`   Port: ${inbound.port}`);
            console.log(`   Status: ${inbound.enable ? 'Enabled' : 'Disabled'}`);

            // Parse client count
            let clientCount = 0;
            try {
                const settings = JSON.parse(inbound.settings);
                clientCount = settings.clients ? settings.clients.length : 0;
            } catch {
                console.log('   Could not parse clients from settings');
            }

            console.log(`   Clients: ${clientCount}`);

            return {
                ...result,
                analysis: {
                    inboundId: targetId,
                    protocol: inbound.protocol,
                    port: inbound.port,
                    enabled: inbound.enable,
                    clientCount: clientCount,
                    smartIdRetrieval: true
                },
                coding_comparison: {
                    oldWay: 'Brute force loop through IDs 0-20, multiple try-catch blocks',
                    newWay: 'Smart ID management from previous test data'
                },
                efficiency_improvement: 'Eliminated 20 unnecessary API calls'
            };
        }

        return {
            success: false,
            message: `Inbound ID ${targetId} not found or inaccessible`,
            targetId: targetId
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message,
            note: 'Session automatically managed even during errors'
        };
    }
}

module.exports = test04_getInbound;