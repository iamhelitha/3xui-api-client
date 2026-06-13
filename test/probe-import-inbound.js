// Probe script (scratch, not part of the suite):
// Determine the correct payload shape for POST /panel/api/inbounds/import
// on the TEST server (v3.x rewrite). Source code shows the handler reads
// c.PostForm("data") and unmarshals into a single model.Inbound (not an array).
require('dotenv').config();
const ThreeXUI = require('../index.js');
const { ProtocolBuilder } = require('../src/builders/ProtocolBuilders');

(async() => {
    const client = new ThreeXUI(process.env.TEST_PANEL_URL, process.env.TEST_PANEL_USERNAME, process.env.TEST_PANEL_PASSWORD);
    await client.login();

    const config = ProtocolBuilder.vless()
        .remark(`import_probe_${Date.now()}`)
        .randomPort()
        .reality({ dest: 'google.com:443' })
        .addClient({ email: `import_probe_client_${Date.now()}` })
        .build();

    const body = new URLSearchParams({ data: JSON.stringify(config) }).toString();

    try {
        const result = await client._request('post', '/panel/api/inbounds/import', body, {
            'Content-Type': 'application/x-www-form-urlencoded'
        });
        console.log('[OK] importInbound (form data=)');
        console.log(JSON.stringify(result).slice(0, 500));

        // cleanup if it worked
        if (result && result.success) {
            const all = await client.getInbounds();
            const created = (all.obj || []).find((i) => i.remark === config.remark);
            if (created) {
                console.log(`-> created id=${created.id}, cleaning up`);
                await client.deleteInbound(created.id);
                console.log('-> cleaned up');
            }
        }
    } catch (err) {
        if (err.response) {
            console.log(`[FAIL] HTTP ${err.response.status}`);
            console.log(JSON.stringify(err.response.data).slice(0, 500));
        } else {
            console.log(`[FAIL] ${err.message}`);
        }
    }
})();
