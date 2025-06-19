// Test 06: Update Inbound (update the inbound just created)
async function test06_updateInbound(testState) {
    try {
        if (!testState.createdInbound) {
            return {
                success: false,
                message: 'No inbound was created in previous test to update',
                error: 'Missing created inbound'
            };
        }
        
        console.log(`🔄 Updating inbound ID: ${testState.createdInbound.id}...`);
        
        // Parse existing settings to modify them
        let existingSettings = {};
        try {
            existingSettings = JSON.parse(testState.createdInbound.settings);
        } catch (e) {
            console.log('   Using default settings structure');
            existingSettings = { clients: [], decryption: "none" };
        }
        
        // Update the remark and some other details
        const updatedConfig = {
            ...testState.createdInbound,
            remark: `Updated_Test_Inbound_${Date.now()}`,
            enable: true, // Make sure it's enabled
            settings: JSON.stringify({
                ...existingSettings,
                decryption: "none" // Ensure decryption is set
            }),
            streamSettings: testState.createdInbound.streamSettings,
            sniffing: testState.createdInbound.sniffing,
            allocate: testState.createdInbound.allocate
        };
        
        console.log(`   Old remark: ${testState.createdInbound.remark}`);
        console.log(`   New remark: ${updatedConfig.remark}`);
        
        const result = await testState.client.updateInbound(testState.createdInbound.id, updatedConfig);
        
        if (result.success) {
            console.log('✅ Inbound updated successfully');
        }
        
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

module.exports = test06_updateInbound; 