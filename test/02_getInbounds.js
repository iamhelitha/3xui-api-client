// Test 02: Get Inbounds List
async function test02_getInbounds(testState) {
    try {
        console.log('📋 Getting inbounds list...');

        const result = await testState.client.getInbounds();

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

module.exports = test02_getInbounds;