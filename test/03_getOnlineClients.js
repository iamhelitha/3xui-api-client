// Test 03: Get Online Clients with Zero Session Complexity
async function test03_getOnlineClients(testState) {
    try {
        console.log('👥 Getting online clients with auto-session...');

        // OLD WAY: Manual session checking
        // if (!client.cookie) await client.login();
        // const result = await client.getOnlineClients();

        // NEW WAY: Zero session management needed!
        const result = await testState.client.getOnlineClients();

        if (result.success && result.obj) {
            const onlineCount = result.obj.length;
            console.log(`📊 Found ${onlineCount} online client(s)`);

            if (onlineCount > 0) {
                console.log('🔍 Online client details:');
                result.obj.forEach((client, index) => {
                    console.log(`   ${index + 1}. Email: ${client.email || 'N/A'}`);
                    console.log(`      Inbound: ${client.inbound || 'N/A'}`);
                    console.log(`      Traffic: ${client.traffic || 'N/A'}`);
                });
            }

            return {
                ...result,
                analysis: {
                    totalOnlineClients: onlineCount,
                    hasActiveUsers: onlineCount > 0,
                    sessionAutoManaged: true
                },
                coding_comparison: {
                    oldWay: 'Session check + API call = 2+ lines',
                    newWay: 'Just API call = 1 line'
                }
            };
        }

        return {
            ...result,
            analysis: {
                totalOnlineClients: 0,
                hasActiveUsers: false,
                sessionAutoManaged: true
            }
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message,
            note: 'Session auto-managed even during errors!'
        };
    }
}

module.exports = test03_getOnlineClients;