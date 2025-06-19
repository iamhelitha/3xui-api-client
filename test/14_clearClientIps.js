// Test 14: Clear Client IPs
async function test14_clearClientIps(testState, rl) {
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
    try {
        console.log('🧹 Clearing client IPs...');

        const email = await askQuestion('Enter client email to clear IPs (⚠️  This will clear all IPs for this client): ');

        if (!email.trim()) {
            return {
                success: false,
                message: 'No email provided',
                error: 'Email is required'
            };
        }

        const confirmation = await askQuestion(`Are you sure you want to clear all IPs for ${email}? (yes/y/no/n): `);

        // More flexible confirmation check
        const isConfirmed = confirmation.toLowerCase().startsWith('y') || confirmation.toLowerCase() === 'yes';

        if (!isConfirmed) {
            return {
                success: false,
                message: 'Operation cancelled by user',
                cancelled: true
            };
        }

        console.log(`   Clearing IPs for: ${email}`);

        // Call the API and return raw response
        const result = await testState.client.clearClientIps(email);

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

module.exports = test14_clearClientIps;