// Test 04: Get Specific Inbound (try IDs starting from 0 until success)
async function test04_getInbound(testState) {
    try {
        console.log('🔍 Finding a valid inbound by trying IDs starting from 0...');
        
        let foundInbound = null;
        let attemptedId = 0;
        const maxAttempts = 20; // Prevent infinite loop
        
        while (attemptedId < maxAttempts) {
            try {
                console.log(`   Trying ID: ${attemptedId}`);
                const result = await testState.client.getInbound(attemptedId);
                
                if (result.success && result.obj) {
                    console.log(`✅ Found valid inbound with ID: ${attemptedId}`);
                    foundInbound = result;
                    testState.foundInboundId = attemptedId;
                    break;
                }
            } catch (error) {
                // Continue to next ID if this one fails
                console.log(`   ID ${attemptedId}: ${error.message}`);
            }
            
            attemptedId++;
        }
        
        if (foundInbound) {
            // Return the raw API response from the successful call
            return foundInbound;
        } else {
            return {
                success: false,
                message: `No valid inbound found after trying IDs 0-${maxAttempts-1}`,
                attemptedIds: `0-${maxAttempts-1}`,
                attemptsRequired: maxAttempts
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message
        };
    }
}

module.exports = test04_getInbound; 