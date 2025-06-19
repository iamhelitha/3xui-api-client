// Test 11: Get Client Traffics by Email
async function test11_getClientTrafficsByEmail(testState, rl) {
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    try {
        console.log('📧 Getting client traffics by email...');

        const email = await askQuestion('Enter client email to check traffics: ');

        if (!email.trim()) {
            return {
                success: false,
                message: 'No email provided',
                error: 'Email is required'
            };
        }

        console.log(`   Checking traffics for: ${email}`);

        const result = await testState.client.getClientTrafficsByEmail(email);

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

module.exports = test11_getClientTrafficsByEmail;