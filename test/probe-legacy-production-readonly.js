// Probe script (scratch, not part of the suite):
// Phase 1 (production cross-check) - read-only Legacy API routes that
// returned HTTP 404 on the TEST server (v3.3.0 React panel). Checks whether
// the older Vue-based PRODUCTION panel still serves these routes.
// Uses an EXISTING inbound/client already on the panel - no create/delete,
// no traffic resets, no client mutation.
require('dotenv').config();
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
        if (err.response) {
            const data = err.response.data;
            entry = { name, route, status: 'FAIL', data, httpStatus: err.response.status };
            console.log(`[FAIL] ${name}  (${route})  HTTP ${err.response.status}`);
            console.log(`       content-type=${err.response.headers && err.response.headers['content-type']}`);
            console.log(`       ${JSON.stringify(data).slice(0, 300)}`);
        } else {
            entry = { name, route, status: 'FAIL', data: err.message };
            console.log(`[FAIL] ${name}  (${route})  ${err.message}`);
        }
    }
    results.push(entry);
    console.log('');
    return entry;
}

(async() => {
    const client = new ThreeXUI(process.env.PANEL_URL, process.env.PANEL_USERNAME, process.env.PANEL_PASSWORD);
    await client.login();

    console.log('=== Locate an existing inbound + client ===\n');

    const inboundsResp = await client.getInbounds();
    const inbounds = inboundsResp.obj || [];
    let targetInbound = null;
    let targetClient = null;

    for (const inb of inbounds) {
        const rawSettings = inb.settings;
        const settings = typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings;
        const clients = (settings && settings.clients) || [];
        if (clients.length > 0) {
            targetInbound = inb;
            targetClient = clients[0];
            break;
        }
    }

    if (!targetInbound || !targetClient) {
        console.log('No inbound with clients found on production - aborting.');
        return;
    }

    console.log(`-> inbound id=${targetInbound.id}, client email=${targetClient.email}, client id=${targetClient.id}\n`);

    console.log('=== Read-only routes that 404\'d on TEST ===\n');

    await run('getLastOnline', 'POST /panel/api/inbounds/lastOnline', () => client.getLastOnline());
    await run('getOnlineClients', 'POST /panel/api/inbounds/onlines', () => client.getOnlineClients());
    await run('getClientTrafficsByEmail', `GET /panel/api/inbounds/getClientTraffics/${targetClient.email}`, () => client.getClientTrafficsByEmail(targetClient.email));
    await run('getClientTrafficsById', `GET /panel/api/inbounds/getClientTrafficsById/${targetClient.id}`, () => client.getClientTrafficsById(targetClient.id));
    await run('getClientIps', `POST /panel/api/inbounds/clientIps/${targetClient.email}`, () => client.getClientIps(targetClient.email));
    await run('createBackup', 'GET /panel/api/inbounds/createbackup', () => client.createBackup());

    console.log('\n=== SUMMARY ===');
    for (const r of results) {
        console.log(`${r.status === 'OK' ? 'OK  ' : 'FAIL'}  ${r.name}`);
    }
})();
