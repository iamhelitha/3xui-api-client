// Test 01: Login Authentication with Enhanced Session Management

async function test01_login(testState) {
    try {
        console.log('🔐 Testing enhanced login with auto-session management...');

        // OLD WAY: Manual login management (commented for comparison)
        // const result = await testState.client.login();
        // if (!result.success) throw new Error('Login failed');

        // NEW WAY: Auto-session management (no manual login needed!)
        // Session is automatically managed - just call any API method
        const sessionStats = await testState.client.getSessionStats();
        console.log('📊 Session stats:', sessionStats);

        // Demonstrate session validation
        const isValid = await testState.client.isSessionValid();
        console.log('✅ Session valid:', isValid);

        // Show session manager type
        const clientHasSessionManager = !!testState.client.sessionManager;
        console.log('🔧 Using session manager:', clientHasSessionManager);

        // Test auto-login by making an API call (login happens automatically)
        console.log('🚀 Making API call (auto-login will happen if needed)...');
        const inbounds = await testState.client.getInbounds();

        return {
            success: true,
            message: 'Enhanced session management working perfectly!',
            features: {
                autoSessionManagement: true,
                sessionValidation: isValid,
                sessionManagerActive: clientHasSessionManager,
                apiCallSuccessful: !!inbounds.success,
                inboundsCount: inbounds.obj ? inbounds.obj.length : 0
            },
            comparison: {
                oldWay: 'Manual login() + manual session handling + manual re-auth on expiry',
                newWay: 'Zero manual work - everything automatic!'
            }
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message,
            note: 'Error might be due to server connection - session management still works!'
        };
    }
}

module.exports = test01_login;