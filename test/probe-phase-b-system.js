// Probe script (scratch, not part of the suite):
// Phase B - read-only System / Server Management endpoints
// (`/panel/api/server/*`, `/panel/setting/*`, `/panel/xray/*`).
// Run against the TEST server only, after test/setup-phase-b-data.js has
// populated it with inbounds/clients so responses reflect real data.
require('dotenv').config();
const ThreeXUI = require('../index.js');

const results = [];

async function run(name, route, fn) {
    let entry;
    try {
        const data = await fn();
        const isBuffer = Buffer.isBuffer(data);
        const preview = isBuffer ? `<binary ${data.length} bytes>` : JSON.stringify(data).slice(0, 400);
        entry = { name, route, status: 'OK', preview };
        console.log(`[OK]   ${name}  (${route})`);
        console.log(`       ${preview}`);
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
    const client = new ThreeXUI(process.env.TEST_PANEL_URL, process.env.TEST_PANEL_USERNAME, process.env.TEST_PANEL_PASSWORD);
    await client.login();

    console.log('=== Server Status / Metrics ===\n');
    await run('getServerStatus', 'GET /panel/api/server/status', () => client.getServerStatus());
    await run('getCPUHistory', 'GET /panel/api/server/cpuHistory/min', () => client.getCPUHistory('min'));
    await run('getXrayVersion', 'GET /panel/api/server/getXrayVersion', () => client.getXrayVersion());

    console.log('\n=== Config / DB ===\n');
    await run('getConfigJson', 'GET /panel/api/server/getConfigJson', () => client.getConfigJson());
    await run('getDb', 'GET /panel/api/server/getDb', () => client.getDb());

    console.log('\n=== Logs ===\n');
    await run('getPanelLogs', 'POST /panel/api/server/logs/10', () => client.getPanelLogs(10));
    await run('getXrayLogs', 'POST /panel/api/server/xraylogs/10', () => client.getXrayLogs(10));

    console.log('\n=== Settings ===\n');
    await run('getAllSettings', 'POST /panel/setting/all', () => client.getAllSettings());
    await run('getDefaultSettings', 'POST /panel/setting/defaultSettings', () => client.getDefaultSettings());
    await run('getDefaultJsonConfig', 'GET /panel/setting/getDefaultJsonConfig', () => client.getDefaultJsonConfig());

    console.log('\n=== Xray ===\n');
    await run('getXrayConfig', 'POST /panel/xray/', () => client.getXrayConfig());
    await run('getOutboundsTraffic', 'GET /panel/xray/getOutboundsTraffic', () => client.getOutboundsTraffic());
    await run('getXrayResult', 'GET /panel/xray/getXrayResult', () => client.getXrayResult());

    console.log('\n=== SUMMARY ===');
    for (const r of results) {
        console.log(`${r.status === 'OK' ? 'OK  ' : 'FAIL'}  ${r.name}`);
    }
})();
