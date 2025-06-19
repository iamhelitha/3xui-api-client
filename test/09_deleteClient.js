// Test 09: Delete Client (delete the client just created)
async function test09_deleteClient(testState) {
    try {
        if (!testState.createdClient) {
            return {
                success: false,
                message: 'No client was created in previous test to delete',
                error: 'Missing created client'
            };
        }

        console.log(`🗑️  Deleting client: ${testState.createdClient.email}...`);
        console.log(`   Client ID: ${testState.createdClient.id}`);
        console.log(`   Inbound ID: ${testState.createdClient.inboundId}`);

        // Call the API and get raw response
        const result = await testState.client.deleteClient(
            testState.createdClient.inboundId,
            testState.createdClient.id
        );

        // Clear the created client from state if successful
        if (result.success) {
            console.log('✅ Client deleted successfully');
            testState.createdClient = null;
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

module.exports = test09_deleteClient;