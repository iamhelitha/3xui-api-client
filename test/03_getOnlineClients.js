// Test 03: Get Online Clients
async function test03_getOnlineClients(testState) {
    try {
        console.log('👥 Getting online clients...');

        const result = await testState.client.getOnlineClients();

        // Return the raw API response
        return result;
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message
        };
    }
}

module.exports = test03_getOnlineClients;