// Test 17: Reset All Client Traffics (in specific inbound)
async function test17_resetAllClientTraffics(testState, rl) {
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    try {
        console.log('🔄 Resetting all client traffics in specific inbound...');

        const inboundIdInput = await askQuestion('Enter inbound ID to reset all client traffics: ');

        if (!inboundIdInput.trim()) {
            return {
                success: false,
                message: 'Inbound ID is required',
                error: 'Missing inbound ID'
            };
        }

        const inboundId = parseInt(inboundIdInput);
        if (isNaN(inboundId)) {
            return {
                success: false,
                message: 'Invalid inbound ID format',
                error: 'Inbound ID must be a number'
            };
        }

        console.log(`⚠️  WARNING: This will reset traffic for ALL clients in inbound ${inboundId}!`);

        const confirmation1 = await askQuestion(`Are you sure you want to reset all client traffics in inbound ${inboundId}? (yes/y/no/n): `);

        const isConfirmed1 = confirmation1.toLowerCase().startsWith('y') || confirmation1.toLowerCase() === 'yes';

        if (!isConfirmed1) {
            return {
                success: false,
                message: 'Operation cancelled by user',
                cancelled: true
            };
        }

        const confirmation2 = await askQuestion(`Type "RESET INBOUND ${inboundId}" to confirm: `);

        if (confirmation2 !== `RESET INBOUND ${inboundId}`) {
            return {
                success: false,
                message: 'Operation cancelled - confirmation phrase not matched',
                cancelled: true
            };
        }

        console.log(`   Resetting all client traffics in inbound ${inboundId}...`);

        const result = await testState.client.resetAllClientTraffics(inboundId);

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

module.exports = test17_resetAllClientTraffics;