// Probe script (scratch, not part of the suite):
// Phase 1 - Legacy API (`/panel/api/inbounds/*`, `/panel/api/backuptotgbot`)
// Exercises every route in the "Legacy API" table of API-VERIFICATION-STATUS.md
// against the TEST server, creating/cleaning up its own inbound + clients.
require('dotenv').config();
const ThreeXUI = require('../index.js');
const { ProtocolBuilder } = require('../src/builders/ProtocolBuilders');

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
    const client = new ThreeXUI(process.env.TEST_PANEL_URL, process.env.TEST_PANEL_USERNAME, process.env.TEST_PANEL_PASSWORD);
    await client.login();

    let inboundId = null;
    let importedInboundId = null;
    const emailB = `legacy_probe_b_${Date.now()}`;
    let clientAId = null;
    let clientB = null;

    console.log('=== Inbounds ===\n');

    const addInboundConfig = ProtocolBuilder.vless()
        .remark(`legacy_probe_${Date.now()}`)
        .randomPort()
        .reality({ dest: 'google.com:443' })
        .addClient({ email: `legacy_probe_a_${Date.now()}` })
        .build();

    const addInboundEntry = await run('addInbound', 'POST /panel/api/inbounds/add', () => client.addInbound(addInboundConfig));
    if (addInboundEntry.data && addInboundEntry.data.success) {
        inboundId = addInboundEntry.data.obj.id;
        const rawSettings = addInboundEntry.data.obj.settings;
        const settings = typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings;
        clientAId = settings.clients[0].id;
        console.log(`       -> created inbound id=${inboundId}, clientA id=${clientAId}\n`);
    }

    await run('getInbounds', 'GET /panel/api/inbounds/list', () => client.getInbounds());

    if (inboundId !== null) {
        await run('getInbound', `GET /panel/api/inbounds/get/${inboundId}`, () => client.getInbound(inboundId));

        // updateInbound: fetch current, tweak remark, send back
        const current = await client.getInbound(inboundId);
        const updatedConfig = {
            ...current.obj,
            remark: `${current.obj.remark}_updated`
        };
        await run('updateInbound', `POST /panel/api/inbounds/update/${inboundId}`, () => client.updateInbound(inboundId, updatedConfig));
    }

    // importInbounds - import a fresh standalone inbound config
    const importConfig = ProtocolBuilder.vless()
        .remark(`legacy_probe_import_${Date.now()}`)
        .randomPort()
        .reality({ dest: 'google.com:443' })
        .addClient({ email: `legacy_probe_import_client_${Date.now()}` })
        .build();
    const importEntry = await run('importInbounds', 'POST /panel/api/inbounds/import', () => client.importInbounds([importConfig]));
    if (importEntry.data && importEntry.data.success) {
        const allInbounds = await client.getInbounds();
        const created = (allInbounds.obj || []).find((i) => i.remark === importConfig.remark);
        if (created) {
            importedInboundId = created.id;
            console.log(`       -> imported inbound id=${importedInboundId}\n`);
        }
    }

    await run('getLastOnline', 'POST /panel/api/inbounds/lastOnline', () => client.getLastOnline());

    console.log('\n=== Clients ===\n');

    if (inboundId !== null) {
        await run('addClient', 'POST /panel/api/inbounds/addClient', () => client.addClient({
            id: inboundId,
            settings: JSON.stringify({
                clients: [{
                    id: require('crypto').randomUUID(),
                    flow: 'xtls-rprx-vision',
                    email: emailB,
                    limitIp: 0,
                    totalGB: 0,
                    expiryTime: 0,
                    enable: true,
                    tgId: '',
                    subId: require('crypto').randomUUID().replace(/-/g, '').slice(0, 16),
                    comment: '',
                    reset: 0
                }]
            })
        }));

        // Re-fetch inbound to get clientB's id
        const afterAdd = await client.getInbound(inboundId);
        const rawSettingsAfterAdd = afterAdd.obj.settings;
        const settingsAfterAdd = typeof rawSettingsAfterAdd === 'string' ? JSON.parse(rawSettingsAfterAdd) : rawSettingsAfterAdd;
        clientB = settingsAfterAdd.clients.find((c) => c.email === emailB);
        if (clientB) {
            console.log(`       -> clientB id=${clientB.id} email=${clientB.email}\n`);
        }

        await run('getClientTrafficsByEmail', `GET /panel/api/inbounds/getClientTraffics/${emailB}`, () => client.getClientTrafficsByEmail(emailB));

        if (clientB) {
            await run('getClientTrafficsById', `GET /panel/api/inbounds/getClientTrafficsById/${clientB.id}`, () => client.getClientTrafficsById(clientB.id));
        }

        await run('getClientIps', `POST /panel/api/inbounds/clientIps/${emailB}`, () => client.getClientIps(emailB));
        await run('clearClientIps', `POST /panel/api/inbounds/clearClientIps/${emailB}`, () => client.clearClientIps(emailB));

        if (clientB) {
            const updatedClientConfig = {
                id: inboundId,
                settings: JSON.stringify({
                    clients: [{
                        ...clientB,
                        limitIp: 5,
                        comment: 'updated by legacy probe'
                    }]
                })
            };
            await run('updateClient', `POST /panel/api/inbounds/updateClient/${clientB.id}`, () => client.updateClient(clientB.id, updatedClientConfig));
        }

        await run('updateClientTraffic', `POST /panel/api/inbounds/updateClientTraffic/${emailB}`, () => client.updateClientTraffic(emailB, {
            totalGB: 0,
            expiryTime: 0
        }));

        await run('resetClientTraffic', `POST /panel/api/inbounds/${inboundId}/resetClientTraffic/${emailB}`, () => client.resetClientTraffic(inboundId, emailB));
        await run('resetAllClientTraffics', `POST /panel/api/inbounds/resetAllClientTraffics/${inboundId}`, () => client.resetAllClientTraffics(inboundId));
        await run('deleteDepletedClients', `POST /panel/api/inbounds/delDepletedClients/${inboundId}`, () => client.deleteDepletedClients(inboundId));
    }

    console.log('\n=== System ===\n');

    await run('getOnlineClients', 'POST /panel/api/inbounds/onlines', () => client.getOnlineClients());
    await run('resetAllTraffics', 'POST /panel/api/inbounds/resetAllTraffics', () => client.resetAllTraffics());
    await run('createBackup', 'GET /panel/api/inbounds/createbackup', () => client.createBackup());
    await run('backupToTgBot', 'POST /panel/api/backuptotgbot', () => client.backupToTgBot());

    console.log('\n=== Cleanup ===\n');

    if (inboundId !== null && clientB) {
        await run('deleteClientByEmail (cleanup clientB)', `POST /panel/api/inbounds/${inboundId}/delClientByEmail/${emailB}`, () => client.deleteClientByEmail(inboundId, emailB));
    }
    if (inboundId !== null && clientAId) {
        await run('deleteClient (cleanup clientA)', `POST /panel/api/inbounds/${inboundId}/delClient/${clientAId}`, () => client.deleteClient(inboundId, clientAId));
    }
    if (inboundId !== null) {
        await run('deleteInbound (cleanup)', `POST /panel/api/inbounds/del/${inboundId}`, () => client.deleteInbound(inboundId));
    }
    if (importedInboundId !== null) {
        await run('deleteInbound (cleanup imported)', `POST /panel/api/inbounds/del/${importedInboundId}`, () => client.deleteInbound(importedInboundId));
    }

    console.log('\n=== SUMMARY ===');
    for (const r of results) {
        console.log(`${r.status === 'OK' ? 'OK  ' : 'FAIL'}  ${r.name}`);
    }
})();
