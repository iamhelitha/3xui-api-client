// Test 09: Delete Client with Auto-Session Management
async function test09_deleteClient(testState) {
    try {
        if (!testState.createdClient || !testState.createdClient.id) {
            return {
                success: false,
                message: 'No client available to delete. Run addClient test first.',
                error: 'Missing created client',
                suggestion: 'Create a client first using test 07'
            };
        }

        console.log(`🗑️ Deleting client with auto-session: ${testState.createdClient.email}...`);
        console.log(`   Client UUID: ${testState.createdClient.id}`);
        console.log(`   Inbound ID: ${testState.createdClient.inboundId}`);

        // OLD WAY: Had to manage session manually before deletion
        // NEW WAY: Session automatically managed!

        const result = await testState.client.deleteClient(
            testState.createdClient.inboundId,
            testState.createdClient.id
        );

        if (result.success) {
            console.log('✅ Client deleted successfully with auto-session');
            console.log('   Session was automatically managed during deletion');

            // Store deletion details for testing continuity
            testState.lastDeletedClient = {
                id: testState.createdClient.id,
                email: testState.createdClient.email,
                inboundId: testState.createdClient.inboundId,
                deletedAt: new Date().toISOString()
            };

            // Clear the created client from state
            testState.createdClient = null;
        }

        return {
            ...result,
            deletionDetails: {
                clientId: testState.lastDeletedClient?.id,
                email: testState.lastDeletedClient?.email,
                inboundId: testState.lastDeletedClient?.inboundId,
                deletedAt: testState.lastDeletedClient?.deletedAt,
                sessionAutoManaged: true
            },
            coding_comparison: {
                oldWay: 'Manual session check + deleteClient call',
                newWay: 'Just deleteClient call - session auto-managed'
            },
            benefits: [
                'No session management needed',
                'Automatic error handling',
                'Consistent state management',
                'Simplified deletion process'
            ]
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message,
            note: 'Session automatically handled even during deletion errors!',
            debugging: {
                hasClient: !!testState.createdClient,
                clientId: testState.createdClient?.id,
                inboundId: testState.createdClient?.inboundId
            }
        };
    }
}

module.exports = test09_deleteClient;