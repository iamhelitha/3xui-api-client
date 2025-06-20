// Test 07: Add Client to Inbound
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function test07_addClient(testState) {
    try {
        if (!testState.createdInbound) {
            return {
                success: false,
                message: 'No inbound was created in previous test to add client to',
                error: 'Missing created inbound'
            };
        }

        console.log(`👤 Adding client to inbound ID: ${testState.createdInbound.id}...`);

        const clientId = generateUUID();
        const email = `client_${Date.now()}23c5n7`;

        const clientConfig = {
            id: testState.createdInbound.id,
            settings: JSON.stringify({
                clients: [{
                    id: clientId,
                    email: email,
                    limitIp: 0,
                    totalGB: 0,
                    expiryTime: 0,
                    enable: true,
                    tgId: '',
                    subId: ''
                }]
            })
        };

        console.log(`   Client UUID: ${clientId}`);
        console.log(`   Client Email: ${email}`);

        const result = await testState.client.addClient(clientConfig);

        if (result.success) {
            // Store created client for later tests
            testState.createdClient = {
                id: clientId,
                email: email,
                inboundId: testState.createdInbound.id
            };
            console.log('✅ Client added successfully');
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

module.exports = test07_addClient;