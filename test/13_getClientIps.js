// Test 13: Get Client IPs
async function test13_getClientIps(testState, rl) {
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    try {
        console.log('🌐 Getting client IPs...');

        const email = await askQuestion('Enter client email to get IPs: ');

        if (!email.trim()) {
            return {
                success: false,
                message: 'No email provided',
                error: 'Email is required'
            };
        }

        console.log(`   Getting IPs for: ${email}`);

        const result = await testState.client.getClientIps(email);

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

module.exports = test13_getClientIps;