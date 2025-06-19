// Test 12: Get Client Traffics by Client UUID
async function test12_getClientTrafficsById(testState, rl) {
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
    try {
        console.log('🆔 Getting client traffics by client UUID...');
        console.log('   Note: This API expects a client UUID (like from VLESS/VMESS), not a numeric ID');
        
        const clientUuid = await askQuestion('Enter client UUID to check traffics: ');
        
        if (!clientUuid.trim()) {
            return {
                success: false,
                message: 'No UUID provided',
                error: 'Client UUID is required'
            };
        }
        
        console.log(`   Checking traffics for UUID: ${clientUuid}`);
        
        // Call the API and return raw response
        const result = await testState.client.getClientTrafficsById(clientUuid);
        
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

module.exports = test12_getClientTrafficsById; 