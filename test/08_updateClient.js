// Test 08: Update Client (update the client just created)
async function test08_updateClient(testState) {
    try {
        if (!testState.createdClient) {
            return {
                success: false,
                message: 'No client was created in previous test to update',
                error: 'Missing created client'
            };
        }

        console.log(`🔄 Updating client: ${testState.createdClient.email}...`);

        const updatedEmail = `updated_${Date.now()}@example.com`;

        // According to 3x-ui API, updateClient expects inbound ID and settings JSON string
        const clientConfig = {
            id: testState.createdClient.inboundId, // This should be the INBOUND ID, not client ID
            settings: JSON.stringify({
                clients: [{
                    id: testState.createdClient.id, // Client UUID
                    flow: '',
                    email: updatedEmail,
                    limitIp: 2,
                    totalGB: 10737418240, // 10GB in bytes
                    expiryTime: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
                    enable: true,
                    tgId: 'updated_tg_id',
                    subId: 'updated_sub_id',
                    comment: '',
                    reset: 0
                }]
            })
        };

        console.log(`   Client UUID: ${testState.createdClient.id}`);
        console.log(`   Inbound ID: ${testState.createdClient.inboundId}`);
        console.log(`   Old Email: ${testState.createdClient.email}`);
        console.log(`   New Email: ${updatedEmail}`);
        console.log('   New Limit: 2 IPs');
        console.log('   New Total: 10GB');

        // Call the API and return the raw response
        const result = await testState.client.updateClient(testState.createdClient.id, clientConfig);

        // Update stored client info if successful
        if (result.success) {
            testState.createdClient.email = updatedEmail;
            console.log('✅ Client updated successfully');
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

module.exports = test08_updateClient;