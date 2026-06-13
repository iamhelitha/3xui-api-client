/**
 * Live test of the "Modern API" routes (clients/groups/nodes/custom-geo)
 * against a real, freshly provisioned 3x-ui test server.
 *
 * Uses TEST_PANEL_URL / TEST_PANEL_USERNAME / TEST_PANEL_PASSWORD from the
 * project root .env file (NOT the production PANEL_* credentials).
 *
 * Goal: capture the *actual* shapes/types returned by each endpoint so they
 * can be diffed against wiki/Modern-API.md and index.d.ts.
 *
 * This script creates and deletes its own temporary inbound/clients/groups
 * so it is safe to run repeatedly against a disposable test server.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ThreeXUI = require('../index.js');
const { ProtocolBuilder } = require('../src/builders/ProtocolBuilders');

const BASE_URL = process.env.TEST_PANEL_URL;
const API_TOKEN = process.env.TEST_API_TOKEN;

if (!BASE_URL || !API_TOKEN) {
    console.error('Missing TEST_PANEL_URL / TEST_API_TOKEN in .env');
    process.exit(1);
}

const results = [];

/**
 * Produce a compact, type-focused summary of a value so we can compare
 * actual API shapes against documented shapes without dumping huge blobs.
 */
function describeShape(value, depth = 2) {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return 'array(empty)';
        }
        return `array[${value.length}] of ${depth > 0 ? describeShape(value[0], depth - 1) : typeof value[0]}`;
    }
    if (typeof value === 'object') {
        if (depth <= 0) {
            return 'object{...}';
        }
        const entries = Object.entries(value).map(([k, v]) => `${k}: ${describeShape(v, depth - 1)}`);
        return `{ ${entries.join(', ')} }`;
    }
    if (typeof value === 'string') {
        return `string("${value.length > 40 ? value.slice(0, 40) + '...' : value}")`;
    }
    return `${typeof value}(${value})`;
}

async function run(name, route, fn) {
    const entry = { name, route };
    try {
        const result = await fn();
        entry.success = result && result.success;
        entry.msg = result && result.msg;
        entry.shape = describeShape(result, 3);
        entry.raw = result;
        console.log(`\n[OK]   ${name}  (${route})`);
        console.log(`       success=${entry.success} msg=${JSON.stringify(entry.msg)}`);
        console.log(`       shape: ${entry.shape}`);
    } catch (error) {
        entry.success = false;
        entry.error = error.message;
        console.log(`\n[ERR]  ${name}  (${route})`);
        console.log(`       error: ${error.message}`);
    }
    results.push(entry);
    return entry;
}

(async() => {
    console.log('='.repeat(70));
    console.log('Live Modern API test');
    console.log('Target:', BASE_URL);
    console.log('='.repeat(70));

    const client = new ThreeXUI(BASE_URL, { token: API_TOKEN });

    // --- Phase 1: read-only / list endpoints ---
    await run('getClients', 'GET /panel/api/clients/list', () => client.getClients());
    await run('getPagedClients', 'GET /panel/api/clients/list/paged', () => client.getPagedClients({ page: 1, size: 10 }));
    await run('getGroups', 'GET /panel/api/clients/groups', () => client.getGroups());
    await run('getOnlines', 'POST /panel/api/clients/onlines', () => client.getOnlines());
    await run('getModernLastOnline', 'POST /panel/api/clients/lastOnline', () => client.getModernLastOnline());
    await run('getNodes', 'GET /panel/api/nodes/list', () => client.getNodes());
    await run('getCustomGeos', 'GET /panel/api/custom-geo/list', () => client.getCustomGeos());
    await run('getGeoAliases', 'GET /panel/api/custom-geo/aliases', () => client.getGeoAliases());
    await run('getInbounds (baseline)', 'GET /panel/api/inbounds/list', () => client.getInbounds());

    // --- Phase 2: create a temporary inbound to attach test clients to ---
    const testEmail = `modern_api_test_${Date.now()}`;
    const testUUID = client.generateUUID();
    let createdInboundId = null;

    const inboundConfig = ProtocolBuilder.vless()
        .remark(`ModernApiTest_${Date.now()}`)
        .randomPort()
        .reality({ dest: 'google.com:443' })
        .addClient({ email: testEmail, id: testUUID })
        .build();

    const addInboundEntry = await run('addInbound (setup)', 'POST /panel/api/inbounds/add', () => client.addInbound(inboundConfig));
    if (addInboundEntry.raw && addInboundEntry.raw.success && addInboundEntry.raw.obj) {
        createdInboundId = addInboundEntry.raw.obj.id;
        console.log(`       -> created inbound id=${createdInboundId}`);
    }

    // --- Phase 3: client detail/traffic/links endpoints (depend on test client) ---
    await run('getClient', `GET /panel/api/clients/get/${testEmail}`, () => client.getClient(testEmail));
    await run('getClientTraffic', `GET /panel/api/clients/traffic/${testEmail}`, () => client.getClientTraffic(testEmail));
    await run('getClientLinks', `GET /panel/api/clients/links/${testEmail}`, () => client.getClientLinks(testEmail));

    let subId = null;
    const clientDetail = results.find((r) => r.name === 'getClient');
    if (clientDetail && clientDetail.raw && clientDetail.raw.obj) {
        subId = clientDetail.raw.obj.subId || clientDetail.raw.obj.subID || null;
    }
    if (subId) {
        await run('getSubLinks', `GET /panel/api/clients/subLinks/${subId}`, () => client.getSubLinks(subId));
    } else {
        console.log('\n[SKIP] getSubLinks - no subId found on client object');
    }

    await run('getModernClientIps', `POST /panel/api/clients/ips/${testEmail}`, () => client.getModernClientIps(testEmail));
    await run('clearModernClientIps', `POST /panel/api/clients/clearIps/${testEmail}`, () => client.clearModernClientIps(testEmail));

    // --- Phase 4: modern client mutation endpoints ---
    const secondInboundConfig = ProtocolBuilder.vless()
        .remark(`ModernApiTest2_${Date.now()}`)
        .randomPort()
        .reality({ dest: 'google.com:443' })
        .build();
    const secondInboundEntry = await run('addInbound (second, for attach/detach)', 'POST /panel/api/inbounds/add', () => client.addInbound(secondInboundConfig));
    let secondInboundId = null;
    if (secondInboundEntry.raw && secondInboundEntry.raw.success && secondInboundEntry.raw.obj) {
        secondInboundId = secondInboundEntry.raw.obj.id;
        console.log(`       -> created inbound id=${secondInboundId}`);
    }

    await run('updateModernClient', `POST /panel/api/clients/update/${testEmail}`, () => client.updateModernClient(testEmail, {
        id: testUUID,
        email: testEmail,
        enable: true,
        totalGB: 5,
        expiryTime: 0,
        limitIp: 2,
        inboundIds: createdInboundId ? [createdInboundId] : []
    }));

    if (secondInboundId) {
        await run('attachClientToInbounds', `POST /panel/api/clients/${testEmail}/attach`, () => client.attachClientToInbounds(testEmail, { inboundIds: [secondInboundId] }));
        await run('detachClientFromInbounds', `POST /panel/api/clients/${testEmail}/detach`, () => client.detachClientFromInbounds(testEmail, { inboundIds: [secondInboundId] }));
    }

    await run('resetModernClientTrafficByEmail', `POST /panel/api/clients/resetTraffic/${testEmail}`, () => client.resetModernClientTrafficByEmail(testEmail));
    await run('updateModernClientTrafficByEmail', `POST /panel/api/clients/updateTraffic/${testEmail}`, () => client.updateModernClientTrafficByEmail(testEmail, { up: 0, down: 0 }));

    // --- Phase 5: groups ---
    const testGroup = `modern_api_test_group_${Date.now()}`;
    await run('createGroup', 'POST /panel/api/clients/groups/create', () => client.createGroup({ name: testGroup }));
    await run('getGroups (after create)', 'GET /panel/api/clients/groups', () => client.getGroups());
    await run('bulkAddGroups', 'POST /panel/api/clients/groups/bulkAdd', () => client.bulkAddGroups({ emails: [testEmail], group: testGroup }));
    await run('getGroupEmails', `GET /panel/api/clients/groups/${testGroup}/emails`, () => client.getGroupEmails(testGroup));
    await run('bulkRemoveGroups', 'POST /panel/api/clients/groups/bulkRemove', () => client.bulkRemoveGroups({ emails: [testEmail] }));

    const renamedGroup = `${testGroup}_renamed`;
    await run('renameGroup', 'POST /panel/api/clients/groups/rename', () => client.renameGroup({ oldName: testGroup, newName: renamedGroup }));
    await run('deleteGroup', 'POST /panel/api/clients/groups/delete', () => client.deleteGroup({ name: renamedGroup }));

    // --- Phase 6: bulk client endpoints (separate temp clients) ---
    const bulkEmails = [`modern_bulk_a_${Date.now()}`, `modern_bulk_b_${Date.now()}`];
    const bulkUUIDs = bulkEmails.map(() => client.generateUUID());

    await run('bulkCreateModernClients', 'POST /panel/api/clients/bulkCreate', () => client.bulkCreateModernClients(
        bulkEmails.map((email, i) => ({
            inboundIds: createdInboundId ? [createdInboundId] : [],
            client: {
                email,
                id: bulkUUIDs[i],
                enable: true,
                totalGB: 0,
                expiryTime: 0
            }
        }))
    ));

    await run('bulkAdjustModernClients', 'POST /panel/api/clients/bulkAdjust', () => client.bulkAdjustModernClients({
        emails: bulkEmails,
        addDays: 30,
        addBytes: 1073741824
    }));

    if (secondInboundId) {
        await run('bulkAttachModernClients', 'POST /panel/api/clients/bulkAttach', () => client.bulkAttachModernClients({
            emails: bulkEmails,
            inboundIds: [secondInboundId]
        }));
        await run('bulkDetachModernClients', 'POST /panel/api/clients/bulkDetach', () => client.bulkDetachModernClients({
            emails: bulkEmails,
            inboundIds: [secondInboundId]
        }));
    }

    await run('bulkResetTrafficModernClients', 'POST /panel/api/clients/bulkResetTraffic', () => client.bulkResetTrafficModernClients({
        emails: bulkEmails
    }));

    await run('bulkDeleteModernClients (cleanup)', 'POST /panel/api/clients/bulkDel', () => client.bulkDeleteModernClients({
        emails: bulkEmails
    }));

    // --- Phase 7: addModernClient via /add (separate client, then delete via modern API) ---
    const addEmail = `modern_add_${Date.now()}`;
    const addUUID = client.generateUUID();
    await run('addModernClient', 'POST /panel/api/clients/add', () => client.addModernClient({
        inboundIds: createdInboundId ? [createdInboundId] : [],
        client: {
            email: addEmail,
            id: addUUID,
            enable: true,
            totalGB: 0,
            expiryTime: 0
        }
    }));
    await run('deleteModernClient (cleanup)', `POST /panel/api/clients/del/${addEmail}`, () => client.deleteModernClient(addEmail));

    await run('deleteDepletedModernClients', 'POST /panel/api/clients/delDepleted', () => client.deleteDepletedModernClients());
    await run('resetAllModernClientTraffics', 'POST /panel/api/clients/resetAllTraffics', () => client.resetAllModernClientTraffics());

    // --- Phase 8: nodes ---
    let nodeId = null;
    const addNodeEntry = await run('addNode', 'POST /panel/api/nodes/add', () => client.addNode({
        name: `ModernApiTestNode_${Date.now()}`,
        address: '127.0.0.1',
        port: 2053,
        apiToken: 'modern_api_test_token_1234567890',
        enable: false
    }));
    if (addNodeEntry.raw && addNodeEntry.raw.success && addNodeEntry.raw.obj) {
        nodeId = addNodeEntry.raw.obj.id;
        console.log(`       -> created node id=${nodeId}`);
    }
    await run('getNodes (after add)', 'GET /panel/api/nodes/list', () => client.getNodes());
    if (nodeId !== null) {
        await run('getNode', `GET /panel/api/nodes/get/${nodeId}`, () => client.getNode(nodeId));
        await run('getNodeHistory', `GET /panel/api/nodes/history/${nodeId}/cpu/1h`, () => client.getNodeHistory(nodeId, 'cpu', '1h'));
        await run('updateNode', `POST /panel/api/nodes/update/${nodeId}`, () => client.updateNode(nodeId, { name: 'ModernApiTestNode_renamed', enable: false }));
        await run('setNodeEnable', `POST /panel/api/nodes/setEnable/${nodeId}`, () => client.setNodeEnable(nodeId));
        await run('probeNode', `POST /panel/api/nodes/probe/${nodeId}`, () => client.probeNode(nodeId));
    }
    await run('testNode', 'POST /panel/api/nodes/test', () => client.testNode({ address: '127.0.0.1', port: 2053 }));
    if (nodeId !== null) {
        await run('deleteNode (cleanup)', `POST /panel/api/nodes/del/${nodeId}`, () => client.deleteNode(nodeId));
    }

    // --- Phase 9: custom geo ---
    let geoId = null;
    const geoAlias = `modern_api_test_geo_${Date.now()}`;
    // addCustomGeo returns obj: null - it doesn't echo back the created
    // resource, so the new entry's id must be looked up via getCustomGeos.
    await run('addCustomGeo', 'POST /panel/api/custom-geo/add', () => client.addCustomGeo({
        type: 'geosite',
        alias: geoAlias,
        url: 'https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/geosite.dat'
    }));
    const geoListEntry = await run('getCustomGeos (after add)', 'GET /panel/api/custom-geo/list', () => client.getCustomGeos());
    if (geoListEntry.raw && geoListEntry.raw.success && Array.isArray(geoListEntry.raw.obj)) {
        const created = geoListEntry.raw.obj.find((g) => g.alias === geoAlias);
        if (created) {
            geoId = created.id;
            console.log(`       -> created geo id=${geoId}`);
        }
    }
    if (geoId !== null) {
        await run('updateCustomGeo', `POST /panel/api/custom-geo/update/${geoId}`, () => client.updateCustomGeo(geoId, {
            type: 'geosite',
            alias: `modern_api_test_geo_updated_${Date.now()}`,
            url: 'https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/geosite.dat'
        }));
        await run('downloadCustomGeo', `POST /panel/api/custom-geo/download/${geoId}`, () => client.downloadCustomGeo(geoId));
    }
    await run('updateAllCustomGeo', 'POST /panel/api/custom-geo/update-all', () => client.updateAllCustomGeo());
    if (geoId !== null) {
        await run('deleteCustomGeo (cleanup)', `POST /panel/api/custom-geo/delete/${geoId}`, () => client.deleteCustomGeo(geoId));
    }

    // --- Cleanup: delete temp clients/inbounds ---
    await run('deleteModernClient (testEmail cleanup)', `POST /panel/api/clients/del/${testEmail}`, () => client.deleteModernClient(testEmail));
    if (createdInboundId) {
        await run('deleteInbound (cleanup)', `POST /panel/api/inbounds/del/${createdInboundId}`, () => client.deleteInbound(createdInboundId));
    }
    if (secondInboundId) {
        await run('deleteInbound (cleanup 2)', `POST /panel/api/inbounds/del/${secondInboundId}`, () => client.deleteInbound(secondInboundId));
    }

    // --- Summary ---
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    for (const r of results) {
        const status = r.error ? 'ERROR' : (r.success ? 'OK' : 'FAIL');
        console.log(`${status.padEnd(6)} ${r.name}`);
    }

    // Dump full raw results to a file for diffing against docs
    const fs = require('fs');
    const outPath = path.join(__dirname, 'live-modern-api-results.json');
    fs.writeFileSync(outPath, JSON.stringify(results.map((r) => ({
        name: r.name,
        route: r.route,
        success: r.success,
        error: r.error,
        raw: r.raw
    })), null, 2));
    console.log(`\nFull raw results written to ${outPath}`);
})().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
