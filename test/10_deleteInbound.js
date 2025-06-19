// Test 10: Delete Inbound (delete the inbound created)
async function test10_deleteInbound(testState) {
    try {
        if (!testState.createdInbound) {
            return {
                success: false,
                message: 'No inbound was created in previous test to delete',
                error: 'Missing created inbound'
            };
        }

        console.log(`🗑️  Deleting inbound ID: ${testState.createdInbound.id}...`);
        console.log(`   Remark: ${testState.createdInbound.remark}`);
        console.log(`   Port: ${testState.createdInbound.port}`);

        const result = await testState.client.deleteInbound(testState.createdInbound.id);

        if (result.success) {
            console.log('✅ Inbound deleted successfully');
            // Clear the created inbound from state
            testState.createdInbound = null;
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

module.exports = test10_deleteInbound;