// Test 18: Delete Depleted Clients
async function test18_deleteDepletedClients(testState, rl) {
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    try {
        console.log('🗑️  Deleting depleted clients...');
        
        const inboundIdInput = await askQuestion('Enter inbound ID to delete depleted clients from: ');
        
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
        
        console.log(`⚠️  WARNING: This will delete clients who have exceeded their traffic limits in inbound ${inboundId}!`);
        
        const confirmation = await askQuestion(`Are you sure you want to delete depleted clients from inbound ${inboundId}? (yes/y/no/n): `);
        
        const isConfirmed = confirmation.toLowerCase().startsWith('y') || confirmation.toLowerCase() === 'yes';
        
        if (!isConfirmed) {
            return {
                success: false,
                message: 'Operation cancelled by user',
                cancelled: true
            };
        }
        
        console.log(`   Deleting depleted clients from inbound ${inboundId}...`);
        
        const result = await testState.client.deleteDepletedClients(inboundId);
        
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

module.exports = test18_deleteDepletedClients; 