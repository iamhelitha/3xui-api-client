// Test 01: Login Authentication
async function test01_login(testState) {
    try {
        console.log('🔐 Testing login authentication...');

        const result = await testState.client.login();

        // Return the raw response but hide sensitive cookie data for security
        return {
            ...result.data,
            headers: {
                'set-cookie': result.headers['set-cookie'] ? '[Cookie data hidden for security]' : undefined
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

module.exports = test01_login;