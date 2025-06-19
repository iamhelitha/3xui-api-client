// Test 15: Reset Client Traffic
async function test15_resetClientTraffic(testState, rl) {
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    try {
        console.log('🔄 Resetting client traffic...');
        
        const inboundIdInput = await askQuestion('Enter inbound ID: ');
        const email = await askQuestion('Enter client email to reset traffic: ');
        
        if (!inboundIdInput.trim() || !email.trim()) {
            return {
                success: false,
                message: 'Both inbound ID and email are required',
                error: 'Missing required parameters'
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
        
        const confirmation = await askQuestion(`Are you sure you want to reset traffic for ${email} in inbound ${inboundId}? (yes/y/no/n): `);
        
        // More flexible confirmation check
        const isConfirmed = confirmation.toLowerCase().startsWith('y') || confirmation.toLowerCase() === 'yes';
        
        if (!isConfirmed) {
            return {
                success: false,
                message: 'Operation cancelled by user',
                cancelled: true
            };
        }
        
        console.log(`   Resetting traffic for: ${email} in inbound ${inboundId}`);
        
        const result = await testState.client.resetClientTraffic(inboundId, email);
        
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

module.exports = test15_resetClientTraffic; 