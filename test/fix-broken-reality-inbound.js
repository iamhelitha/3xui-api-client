// Fix script (scratch, not part of the suite):
// test/setup-phase-b-data.js created a VLESS+Reality inbound using
// CredentialGenerator.generateRealityKeys(), which generates the
// "publicKey" as independent random bytes instead of deriving it from the
// privateKey via X25519 - producing an invalid Reality privateKey. This
// broke xray-core entirely on the TEST server (getServerStatus showed
// xray.state: "error", "Failed to build REALITY config... invalid privateKey").
//
// This script deletes that broken inbound and recreates it using a real
// X25519 keypair from the panel's own getNewX25519Cert() endpoint
// (server/panel/api/server/getNewX25519Cert, already verified working).
require('dotenv').config();
const ThreeXUI = require('../index.js');
const { ProtocolBuilder } = require('../src/builders/ProtocolBuilders');

(async() => {
    const client = new ThreeXUI(process.env.TEST_PANEL_URL, process.env.TEST_PANEL_USERNAME, process.env.TEST_PANEL_PASSWORD);
    await client.login();

    console.log('=== Locate broken reality inbound ===\n');
    const inboundsResp = await client.getInbounds();
    const broken = (inboundsResp.obj || []).find((i) => i.remark.startsWith('phaseb_vless_reality_'));
    if (broken) {
        console.log(`-> deleting broken inbound id=${broken.id} (${broken.remark})`);
        const delResult = await client.deleteInbound(broken.id);
        console.log(`   ${JSON.stringify(delResult)}`);
    } else {
        console.log('-> no phaseb_vless_reality_* inbound found, skipping delete');
    }

    console.log('\n=== Generate real X25519 keypair via panel ===\n');
    const certResp = await client.getNewX25519Cert();
    console.log(`   ${JSON.stringify(certResp).slice(0, 200)}`);
    const { privateKey, publicKey } = certResp.obj;

    console.log('\n=== Recreate VLESS+Reality inbound with valid keys ===\n');
    const config = ProtocolBuilder.vless()
        .remark(`phaseb_vless_reality_${Date.now()}`)
        .randomPort()
        .reality({ dest: 'google.com:443', keys: { privateKey, publicKey } })
        .addClient({ email: `phaseb_vless_a_${Date.now()}` })
        .addClient({ email: `phaseb_vless_b_${Date.now()}` })
        .build();

    const result = await client.addInbound(config);
    if (result && result.success) {
        console.log(`-> created inbound id=${result.obj.id} remark=${result.obj.remark}`);
        await client.updateInbound(result.obj.id, { ...result.obj, enable: true });
        console.log(`-> enabled inbound id=${result.obj.id}`);
    } else {
        console.log(`[FAIL] ${JSON.stringify(result).slice(0, 300)}`);
    }

    console.log('\n=== Verify xray status ===\n');
    // Give xray a moment to restart with the new config
    await new Promise((r) => setTimeout(r, 3000));
    const status = await client.getServerStatus();
    console.log(`   xray.state = ${status.obj.xray.state}`);
    if (status.obj.xray.errorMsg) {
        console.log(`   xray.errorMsg = ${status.obj.xray.errorMsg}`);
    }
})();
