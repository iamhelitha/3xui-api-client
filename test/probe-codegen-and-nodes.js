// Probe script (scratch, not part of the suite):
// - Verifies the panel's built-in credential/key generation routes
//   (getNewUUID, getNewX25519Cert, getNewmldsa65, getNewmlkem768,
//   getNewVlessEnc, getNewEchCert, getWebCertFiles)
// - Verifies the node lifecycle (addNode, getNode, updateNode,
//   setNodeEnable, testNode, probeNode, getNodeHistory, deleteNode)
//   using the TEST server registered as a node of itself
//   (allowPrivateAddress: true + its own apiToken).
require('dotenv').config();
const { URL } = require('url');
const ThreeXUI = require('../index.js');

const results = [];

async function run(name, route, fn) {
    let entry;
    try {
        const data = await fn();
        entry = { name, route, status: 'OK', data };
        console.log(`[OK]   ${name}  (${route})`);
        console.log(`       ${JSON.stringify(data).slice(0, 300)}`);
    } catch (err) {
        const data = err.response ? err.response.data : err.message;
        entry = { name, route, status: 'FAIL', data };
        console.log(`[FAIL] ${name}  (${route})`);
        console.log(`       ${JSON.stringify(data).slice(0, 300)}`);
    }
    results.push(entry);
    console.log('');
    return entry;
}

(async() => {
    const client = new ThreeXUI(process.env.TEST_PANEL_URL, process.env.TEST_PANEL_USERNAME, process.env.TEST_PANEL_PASSWORD);
    await client.login();

    console.log('=== Credential / key generation routes ===\n');

    await run('getNewUUID', 'GET /panel/api/server/getNewUUID', () => client.getNewUUID());
    await run('getNewX25519Cert', 'GET /panel/api/server/getNewX25519Cert', () => client.getNewX25519Cert());
    await run('getNewmldsa65', 'GET /panel/api/server/getNewmldsa65', () => client.getNewmldsa65());
    await run('getNewmlkem768', 'GET /panel/api/server/getNewmlkem768', () => client.getNewmlkem768());
    await run('getNewVlessEnc', 'GET /panel/api/server/getNewVlessEnc', () => client.getNewVlessEnc());

    // getNewEchCert reads `sni` via c.PostForm, which only parses
    // x-www-form-urlencoded / multipart bodies, NOT a JSON body.
    await run('getNewEchCert (current impl, no sni)', 'POST /panel/api/server/getNewEchCert', () => client.getNewEchCert());

    // getWebCertFiles is not yet wrapped by the client - probe with raw axios
    await run('getWebCertFiles (raw, not yet wrapped)', 'GET /panel/api/server/getWebCertFiles', async() => {
        const r = await client.api.get('/panel/api/server/getWebCertFiles', { headers: client._buildRequestHeaders('get') });
        return r.data;
    });

    console.log('\n=== Node lifecycle (TEST server registered as a node of itself) ===\n');

    const testUrl = new URL(process.env.TEST_PANEL_URL);
    const nodeName = `selfnode_${Date.now()}`;
    let nodeId = null;

    const addNodeEntry = await run('addNode', 'POST /panel/api/nodes/add', () => client.addNode({
        name: nodeName,
        remark: 'probe-codegen-and-nodes self-registration',
        scheme: testUrl.protocol.replace(':', ''),
        address: testUrl.hostname,
        port: Number(testUrl.port) || 443,
        basePath: testUrl.pathname.endsWith('/') ? testUrl.pathname : testUrl.pathname + '/',
        apiToken: process.env.TEST_API_TOKEN,
        enable: true,
        allowPrivateAddress: true
    }));

    if (addNodeEntry.data && addNodeEntry.data.success) {
        const nodes = await client.getNodes();
        const created = (nodes.obj || []).find((n) => n.name === nodeName);
        if (created) {
            nodeId = created.id;
            console.log(`       -> created node id=${nodeId}\n`);
        }
    }

    await run('getNodes', 'GET /panel/api/nodes/list', () => client.getNodes());

    if (nodeId !== null) {
        await run('getNode', `GET /panel/api/nodes/get/${nodeId}`, () => client.getNode(nodeId));
        await run('updateNode', `POST /panel/api/nodes/update/${nodeId}`, () => client.updateNode(nodeId, {
            name: nodeName,
            remark: 'probe-codegen-and-nodes self-registration (updated)',
            scheme: testUrl.protocol.replace(':', ''),
            address: testUrl.hostname,
            port: Number(testUrl.port) || 443,
            basePath: testUrl.pathname.endsWith('/') ? testUrl.pathname : testUrl.pathname + '/',
            apiToken: process.env.TEST_API_TOKEN,
            enable: true,
            allowPrivateAddress: true
        }));
        await run('setNodeEnable (no body, current impl)', `POST /panel/api/nodes/setEnable/${nodeId}`, () => client.setNodeEnable(nodeId));
        await run('probeNode', `POST /panel/api/nodes/probe/${nodeId}`, () => client.probeNode(nodeId));
        await run('getNodeHistory', `GET /panel/api/nodes/history/${nodeId}/cpu/60`, () => client.getNodeHistory(nodeId, 'cpu', 60));
    }

    await run('testNode', 'POST /panel/api/nodes/test', () => client.testNode({
        scheme: testUrl.protocol.replace(':', ''),
        address: testUrl.hostname,
        port: Number(testUrl.port) || 443,
        basePath: testUrl.pathname.endsWith('/') ? testUrl.pathname : testUrl.pathname + '/',
        apiToken: process.env.TEST_API_TOKEN,
        allowPrivateAddress: true
    }));

    if (nodeId !== null) {
        await run('deleteNode (cleanup)', `POST /panel/api/nodes/del/${nodeId}`, () => client.deleteNode(nodeId));
    }

    console.log('\n=== SUMMARY ===');
    for (const r of results) {
        console.log(`${r.status === 'OK' ? 'OK  ' : 'FAIL'}  ${r.name}`);
    }
})();
