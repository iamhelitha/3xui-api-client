// Setup script (scratch, not part of the suite):
// Populates the TEST server with a handful of inbounds + clients across
// different protocols, so Phase B (system/server endpoints) and later
// phases have realistic data (xray config, traffic stats, logs, etc.)
// to report on instead of an empty panel. Left in place (not cleaned up)
// for use across phases.
require('dotenv').config();
const ThreeXUI = require('../index.js');
const { ProtocolBuilder } = require('../src/builders/ProtocolBuilders');

(async() => {
    const client = new ThreeXUI(process.env.TEST_PANEL_URL, process.env.TEST_PANEL_USERNAME, process.env.TEST_PANEL_PASSWORD);
    await client.login();

    const created = [];

    const configs = [
        ProtocolBuilder.vless()
            .remark(`phaseb_vless_reality_${Date.now()}`)
            .randomPort()
            .reality({ dest: 'google.com:443' })
            .addClient({ email: `phaseb_vless_a_${Date.now()}` })
            .addClient({ email: `phaseb_vless_b_${Date.now()}` })
            .build(),
        ProtocolBuilder.vmess()
            .remark(`phaseb_vmess_tcp_${Date.now()}`)
            .randomPort()
            .addClient({ email: `phaseb_vmess_a_${Date.now()}` })
            .addClient({ email: `phaseb_vmess_b_${Date.now()}` })
            .build(),
        ProtocolBuilder.shadowsocks()
            .remark(`phaseb_ss_${Date.now()}`)
            .randomPort()
            .generatePassword()
            .build()
    ];

    for (const config of configs) {
        try {
            const result = await client.addInbound(config);
            if (result && result.success) {
                created.push({ id: result.obj.id, remark: result.obj.remark, protocol: result.obj.protocol });
                console.log(`[OK] created inbound id=${result.obj.id} remark=${result.obj.remark} protocol=${result.obj.protocol}`);
            } else {
                console.log(`[FAIL] ${JSON.stringify(result).slice(0, 300)}`);
            }
        } catch (err) {
            const data = err.response ? err.response.data : err.message;
            console.log(`[FAIL] ${JSON.stringify(data).slice(0, 300)}`);
        }
    }

    // Enable all created inbounds
    for (const inb of created) {
        try {
            const current = await client.getInbound(inb.id);
            await client.updateInbound(inb.id, { ...current.obj, enable: true });
            console.log(`[OK] enabled inbound id=${inb.id}`);
        } catch (err) {
            const data = err.response ? err.response.data : err.message;
            console.log(`[FAIL] enable id=${inb.id}: ${JSON.stringify(data).slice(0, 200)}`);
        }
    }

    console.log('\n=== Created inbounds ===');
    console.log(JSON.stringify(created, null, 2));
})();
