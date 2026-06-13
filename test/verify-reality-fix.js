// Verification script (scratch, not part of the suite):
// Confirms the CredentialGenerator.generateRealityKeys() X25519 fix by
// creating a VLESS+Reality inbound on the TEST server using the *default*
// .reality() (no explicit keys, exercising generateRealityKeys()), then
// checking that xray-core stays healthy (xray.state === 'running').
require('dotenv').config();
const ThreeXUI = require('../index.js');
const { ProtocolBuilder } = require('../src/builders/ProtocolBuilders');

(async() => {
    const client = new ThreeXUI(process.env.TEST_PANEL_URL, process.env.TEST_PANEL_USERNAME, process.env.TEST_PANEL_PASSWORD);
    await client.login();

    console.log('=== Create VLESS+Reality inbound using default generateRealityKeys() ===\n');
    const config = ProtocolBuilder.vless()
        .remark(`reality_fix_check_${Date.now()}`)
        .randomPort()
        .reality({ dest: 'google.com:443' })
        .addClient({ email: `reality_fix_${Date.now()}` })
        .build();

    const result = await client.addInbound(config);
    if (!result || !result.success) {
        console.log(`[FAIL] addInbound: ${JSON.stringify(result).slice(0, 300)}`);
        process.exit(1);
    }
    console.log(`-> created inbound id=${result.obj.id} remark=${result.obj.remark}`);
    await client.updateInbound(result.obj.id, { ...result.obj, enable: true });
    console.log(`-> enabled inbound id=${result.obj.id}`);

    console.log('\n=== Verify xray status ===\n');
    await new Promise((r) => setTimeout(r, 3000));
    const status = await client.getServerStatus();
    console.log(`   xray.state = ${status.obj.xray.state}`);
    if (status.obj.xray.errorMsg) {
        console.log(`   xray.errorMsg = ${status.obj.xray.errorMsg}`);
    }

    if (status.obj.xray.state !== 'running') {
        console.log('\n[FAIL] xray is not running - cleaning up broken inbound');
        await client.deleteInbound(result.obj.id);
        process.exit(1);
    }

    console.log('\n[PASS] xray stayed healthy with auto-generated Reality keys - cleaning up test inbound');
    await client.deleteInbound(result.obj.id);
    await new Promise((r) => setTimeout(r, 1500));
    const finalStatus = await client.getServerStatus();
    console.log(`   final xray.state = ${finalStatus.obj.xray.state}`);
})();
