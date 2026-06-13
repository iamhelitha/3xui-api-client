// Probe script (scratch, not part of the suite):
// Verifies the new/updated wrappers added after probe-codegen-and-nodes.js:
// - getNewEchCert(sni) with form-encoded sni
// - getWebCertFiles()
// - setNodeEnable(id, enable) with explicit boolean body
require('dotenv').config();
const { URL } = require('url');
const ThreeXUI = require('../index.js');

(async() => {
    const client = new ThreeXUI(process.env.TEST_PANEL_URL, process.env.TEST_PANEL_USERNAME, process.env.TEST_PANEL_PASSWORD);
    await client.login();

    console.log('--- getNewEchCert() no sni ---');
    console.log(JSON.stringify(await client.getNewEchCert()).slice(0, 200));

    console.log('\n--- getNewEchCert("example.com") ---');
    console.log(JSON.stringify(await client.getNewEchCert('example.com')).slice(0, 200));

    console.log('\n--- getWebCertFiles() ---');
    console.log(JSON.stringify(await client.getWebCertFiles()));

    console.log('\n--- node setEnable(id, false/true) ---');
    const testUrl = new URL(process.env.TEST_PANEL_URL);
    const nodeName = `wrapcheck_${Date.now()}`;
    const addRes = await client.addNode({
        name: nodeName,
        remark: 'probe-new-wrappers',
        scheme: testUrl.protocol.replace(':', ''),
        address: testUrl.hostname,
        port: Number(testUrl.port) || 443,
        basePath: testUrl.pathname.endsWith('/') ? testUrl.pathname : testUrl.pathname + '/',
        apiToken: process.env.TEST_API_TOKEN,
        enable: true,
        allowPrivateAddress: true
    });
    console.log('addNode:', JSON.stringify(addRes).slice(0, 150));

    const nodes = await client.getNodes();
    const created = (nodes.obj || []).find((n) => n.name === nodeName);
    if (!created) {
        console.log('FAIL: could not find created node');
        return;
    }
    const nodeId = created.id;

    const disableRes = await client.setNodeEnable(nodeId, false);
    console.log('setNodeEnable(id, false):', JSON.stringify(disableRes));
    const afterDisable = await client.getNode(nodeId);
    console.log('  -> node.enable after disable:', afterDisable.obj.enable);

    const enableRes = await client.setNodeEnable(nodeId, true);
    console.log('setNodeEnable(id, true):', JSON.stringify(enableRes));
    const afterEnable = await client.getNode(nodeId);
    console.log('  -> node.enable after enable:', afterEnable.obj.enable);

    await client.deleteNode(nodeId);
    console.log('\ncleanup: deleted node', nodeId);
})();
