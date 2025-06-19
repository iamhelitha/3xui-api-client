// Test 16: Reset All Traffics
async function test16_resetAllTraffics(testState, rl) {
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    try {
        console.log('🔄 Resetting ALL traffics...');
        console.log('⚠️  WARNING: This will reset traffic for ALL clients across ALL inbounds!');

        const confirmation1 = await askQuestion('Are you absolutely sure you want to reset ALL traffics? (yes/y/no/n): ');

        const isConfirmed1 = confirmation1.toLowerCase().startsWith('y') || confirmation1.toLowerCase() === 'yes';

        if (!isConfirmed1) {
            return {
                success: false,
                message: 'Operation cancelled by user',
                cancelled: true
            };
        }

        const confirmation2 = await askQuestion('This action cannot be undone. Type "RESET ALL" to confirm: ');

        if (confirmation2 !== 'RESET ALL') {
            return {
                success: false,
                message: 'Operation cancelled - confirmation phrase not matched',
                cancelled: true
            };
        }

        console.log('   Resetting all traffics...');

        const result = await testState.client.resetAllTraffics();

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

module.exports = test16_resetAllTraffics;