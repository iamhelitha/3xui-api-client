// Test 05: Add New Inbound
function generateRandomPort() {
    return Math.floor(Math.random() * (65535 - 10000)) + 10000;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function test05_addInbound(testState) {
    try {
        console.log('➕ Creating new inbound...');
        
        const port = generateRandomPort();
        const clientId = generateUUID();
        const email = `test_${Date.now()}@example.com`;
        
        const inboundConfig = {
            up: 0,
            down: 0,
            total: 0,
            remark: `Test_Inbound_${Date.now()}`,
            enable: true,
            expiryTime: 0,
            listen: "",
            port: port,
            protocol: "vless",
            settings: JSON.stringify({
                clients: [{
                    id: clientId,
                    email: email
                }],
                decryption: "none"
            }),
            streamSettings: JSON.stringify({
                network: "tcp",
                security: "reality",
                realitySettings: {
                    show: false,
                    dest: "google.com:443",
                    xver: 0,
                    serverNames: ["google.com"],
                    privateKey: "sO6_TnoWBr3tWWQ9VLgRPgK0_-IjF5Ag8Sj6HkxKt0Y",
                    shortIds: [""],
                    settings: {
                        publicKey: "Gk8DFwpAuLg6W0UtdKRKNvIJk8VPt8RqhE2YzBEo6Jk",
                        fingerprint: "chrome"
                    }
                },
                tcpSettings: {
                    acceptProxyProtocol: false,
                    header: {
                        type: "none"
                    }
                }
            }),
            sniffing: JSON.stringify({
                enabled: true,
                destOverride: ["http", "tls", "quic", "fakedns"]
            }),
            allocate: JSON.stringify({
                strategy: "always",
                refresh: 5,
                concurrency: 3
            })
        };
        
        console.log(`   Port: ${port}`);
        console.log(`   Email: ${email}`);
        
        const result = await testState.client.addInbound(inboundConfig);
        
        if (result.success && result.obj) {
            // Store created inbound for later tests
            testState.createdInbound = result.obj;
            console.log(`✅ Inbound created with ID: ${result.obj.id}`);
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

module.exports = test05_addInbound; 