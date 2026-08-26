# Local Test Results — 3x-ui v3.7.0 (Docker)

Panel: `ghcr.io/mhsanaei/3x-ui:v3.7.0`, run via `docker run` locally, tested against the routes
documented in [`3x-ui-panel-api-curl-examples.md`](3x-ui-panel-api-curl-examples.md) (generated
from the [published Postman collection](https://documenter.getpostman.com/view/5146551/2sBXwnsBko)).
116 endpoints documented there; this file tracks what's been exercised against a real running
v3.7.0 panel and what hasn't.

## Real bugs found and fixed this round

- **`addClientWithCredentials()` / `updateClientWithCredentials()` were both broken on v3.x
  panels.** Both routed through the legacy `/panel/api/inbounds/addClient` and
  `/panel/api/inbounds/updateClient/:id` endpoints, which 3x-ui v3.x removed.
  `addClientWithCredentials` threw an unhandled `404`. `updateClientWithCredentials` additionally
  called `JSON.parse()` unconditionally on `inbound.settings`, which v3.7.0+ panels return as an
  **already-parsed object**, not a JSON string — throwing `"[object Object]" is not valid JSON`
  before even reaching the dead route. Both now route through the Modern Client API instead. See
  `CHANGELOG.md` `[Unreleased]` and [`test/unit/enhanced-client-management.test.js`](../test/unit/enhanced-client-management.test.js)
  for the full writeup and regression tests.
- Fixed the same **wiki documentation bug** in 6 places across `Traffic-Management.md`,
  `Inbound-Management.md` (x3), and `Use-Cases.md` (x2) in both wiki copies: examples doing
  `JSON.parse(inbound.settings)` unconditionally, which throws on v3.7.0+ where `settings` comes
  back pre-parsed. All now guard with `typeof inbound.settings === 'string' ? JSON.parse(...) : inbound.settings`.

## Confirmed working (this package's methods, or the raw route where unwrapped)

| Route | Method used |
|---|---|
| `/login` | `login()` — includes the forced-relogin/CSRF fix regression test |
| `/csrf-token` | raw |
| `/getTwoFactorEnable` | raw (needs `X-CSRF-Token` header — see Gotchas) |
| `/panel/api/inbounds/list` | `getInbounds()` |
| `/panel/api/inbounds/list/slim` | raw |
| `/panel/api/inbounds/options` | raw |
| `/panel/api/inbounds/get/:id` | `getInbound()` |
| `/panel/api/inbounds/add` | `addInbound()` (VLESS+Reality, VMess+WS+TLS, Trojan+TLS, Shadowsocks) |
| `/panel/api/inbounds/update/:id` | `updateInbound()` |
| `/panel/api/inbounds/setEnable/:id` | raw |
| `/panel/api/inbounds/:id/resetTraffic` | raw |
| `/panel/api/inbounds/:id/delAllClients` | raw (tested on an empty inbound) |
| `/panel/api/inbounds/:id/fallbacks` (GET) | raw |
| `/panel/api/inbounds/resetAllTraffics` | `resetAllTraffics()` |
| `/panel/api/inbounds/import` | `importInbounds()` |
| `/panel/api/server/status` | raw |
| `/panel/api/server/cpuHistory/:bucket` | raw |
| `/panel/api/server/history/:metric/:bucket` | raw |
| `/panel/api/server/xrayMetricsState` | raw |
| `/panel/api/server/xrayObservatory` | raw |
| `/panel/api/server/getXrayVersion` | raw |
| `/panel/api/server/getPanelUpdateInfo` | raw |
| `/panel/api/server/getConfigJson` | raw |
| `/panel/api/server/getNewUUID` | raw |
| `/panel/api/server/getNewX25519Cert` | raw |
| `/panel/api/server/getNewmldsa65` | raw |
| `/panel/api/server/getNewmlkem768` | raw |
| `/panel/api/server/getNewVlessEnc` | raw |
| `/panel/api/server/getNewEchCert` | raw |
| `/panel/api/server/logs/:count` | raw |
| `/panel/api/server/xraylogs/:count` | raw |
| `/panel/api/clients/list` | raw |
| `/panel/api/clients/list/paged` | raw |
| `/panel/api/clients/get/:email` | `getClient()` |
| `/panel/api/clients/traffic/:email` | `getClientTraffic()` |
| `/panel/api/clients/add` | `addModernClient()` (+ `addClientWithCredentials()`) |
| `/panel/api/clients/update/:email` | `updateModernClient()` (+ `updateClientWithCredentials()`) |
| `/panel/api/clients/del/:email` | `deleteModernClient()` |
| `/panel/api/clients/ips/:email` | `getModernClientIps()` |
| `/panel/api/clients/clearIps/:email` | `clearModernClientIps()` |
| `/panel/api/clients/updateTraffic/:email` | `updateModernClientTrafficByEmail()` |
| `/panel/api/clients/resetTraffic/:email` | `resetModernClientTrafficByEmail()` |
| `/panel/api/clients/:email/attach` | `attachClientToInbounds()` |
| `/panel/api/clients/:email/detach` | `detachClientFromInbounds()` |
| `/panel/api/clients/bulkCreate` | `bulkCreateModernClients()` |
| `/panel/api/clients/bulkAttach` | `bulkAttachModernClients()` |
| `/panel/api/clients/bulkDetach` | `bulkDetachModernClients()` |
| `/panel/api/clients/bulkResetTraffic` | `bulkResetTrafficModernClients()` |
| `/panel/api/clients/bulkAdjust` | `bulkAdjustModernClients()` |
| `/panel/api/clients/bulkDel` | `bulkDeleteModernClients()` |
| `/panel/api/clients/delDepleted` | `deleteDepletedModernClients()` |
| `/panel/api/clients/resetAllTraffics` | `resetAllModernClientTraffics()` |
| `/panel/api/clients/onlines` | `getOnlines()` |
| `/panel/api/clients/lastOnline` | raw |
| `/panel/api/clients/subLinks/:subId` | `getSubLinks()` |
| `/panel/api/clients/links/:email` | `getClientLinks()` |
| `/panel/api/clients/groups` (GET) | raw |
| `/panel/api/clients/groups/create` | raw |
| `/panel/api/clients/groups/rename` | raw |
| `/panel/api/clients/groups/delete` | raw |
| `/panel/api/clients/groups/bulkAdd` | raw |
| `/panel/api/clients/groups/bulkRemove` | raw |
| `/panel/api/clients/groups/:name/emails` | raw |
| `/panel/api/nodes/list` | raw |
| `/panel/api/nodes/add` | `addNode()` |
| `/panel/api/nodes/get/:id` | `getNode()` |
| `/panel/api/nodes/update/:id` | `updateNode()` |
| `/panel/api/nodes/setEnable/:id` | `setNodeEnable()` |
| `/panel/api/nodes/probe/:id` | `probeNode()` |
| `/panel/api/nodes/history/:id/:metric/:bucket` | `getNodeHistory()` |
| `/panel/api/nodes/del/:id` | `deleteNode()` |
| `/panel/api/nodes/test` | `testNode()` |
| `/panel/api/setting/all` | `getAllSettings()` |
| `/panel/api/setting/defaultSettings` | `getDefaultSettings()` |
| `/panel/api/setting/update` | `updateSetting()` (worked cleanly — the "request body failed validation" issue noted in `test/TESTING-SUMMARY.md` appears resolved by the current merge-current-then-send-all implementation) |
| `/panel/api/setting/getDefaultJsonConfig` | `getDefaultJsonConfig()` |
| `/panel/api/setting/apiTokens` (GET, list) | raw |
| `/panel/api/setting/apiTokens/create` | raw |
| `/panel/api/xray/` (GET config) | `getXrayConfig()` |
| `/panel/api/xray/getDefaultJsonConfig` | raw |
| `/panel/api/xray/getOutboundsTraffic` | raw |
| `/panel/api/xray/getXrayResult` | raw |
| `/panel/api/xray/resetOutboundsTraffic` | `resetOutboundsTraffic()` |
| `/panel/api/xray/warp/:action` | `manageWarp()` (tried `data` — not configured, graceful empty response) |
| `/panel/api/xray/nord/:action` | raw (tried `data` — not configured, graceful empty response) |
| `/sub/:subid` | raw (tested from inside the container on port 2096; base64 response confirmed) |
| `/json/:subid` | raw (required `subJsonEnable: true` + a panel restart to pick up the setting) |
| `/clash/:subid` | raw (required `subClashEnable: true` + a panel restart) |
| `/ws` | raw TCP WebSocket upgrade handshake — `101 Switching Protocols` confirmed |
| legacy `/login` fallback + forced-relogin recovery | `login()` (see [session-recovery.test.js](../test/unit/session-recovery.test.js)) |

**~95 of 116 documented endpoints verified against a live v3.7.0 panel.**

## Confirmed broken / not applicable on v3.7.0 (legacy routes removed in v3.x)

- **`/panel/api/custom-geo/*`** (list, aliases, add, update, delete, download, update-all) —
  genuine 404. Feature doesn't exist in v3.7.0; the SDK's implementation is correct for whatever
  newer panel version the Postman collection documents. Not an SDK bug — a version gap.
- **All legacy client sub-routes** — confirmed dead (404) on v3.7.0, matching `CLAUDE.md`'s note
  that v3.x removed client-management sub-routes under `/panel/api/inbounds/`:
  `addClient`, `updateClient`, `deleteClientByEmail`, `getOnlineClients` (`/onlines`),
  `resetClientTraffic`, `resetAllClientTraffics`, `deleteDepletedClients`, `getClientTrafficsById`.
  Also exposed and fixed the CSRF/relogin masking bug (403 instead of the real 404) when these
  dead routes triggered `_retryAfterRelogin`, and the two broken Enhanced Client Management
  methods listed above (both depended on these dead routes).

## Gotchas found while testing (informational, not SDK bugs)

- **CSRF header required on every non-GET request once authenticated**, not just `/login`.
  The SDK's own `_request()` already handles this correctly via `this.csrfToken`; raw/manual
  requests against this panel must set `X-CSRF-Token` themselves or get a `403`.
- **`/panel/setting/*` and `/panel/xray/*` (no `/api/`) are wrong** — the Postman collection's
  "setting" and "xray" folders document paths *without* `/api/`, but v3.7.0 (and this SDK)
  actually serve them under `/panel/api/setting/*` / `/panel/api/xray/*`. Hitting the
  no-`/api/` paths returns `200` with the SPA's HTML shell (client-side router fallback), not
  a JSON error — easy to misdiagnose as "it worked" if you don't check content type.
- **`/panel/api/nodes/add` and `/test` require a `name` field** in the body (`NodeMutationRequest.name`),
  separate from `remark`. The wiki's example already has this right; an ad-hoc payload without it
  fails clean 400-style validation, not a crash.
- **`/panel/api/clients/update/:email` replaces the whole client row, not a patch.** A partial
  body (e.g. just `{ email, totalGB, enable }`) silently *clears* fields not included — confirmed
  `flow` getting wiped to `""` in one test. Always resend the full client record (merge over
  `getClient()`'s result). This is exactly what the `updateClientWithCredentials()` fix above does.
- **That same update endpoint rejects two fields if round-tripped verbatim from `getClient()`**:
  the numeric row `id` (`json: cannot unmarshal number into Go struct field .id of type string`)
  and `allowedIPs` (`string` on read, `[]string` on write — WireGuard-specific). Both must be
  stripped before resending.
- **Subscription endpoints (`/json/:subid`, `/clash/:subid`) need a panel restart** after toggling
  `subJsonEnable`/`subClashEnable` via `updateSetting()` — the sub-server doesn't hot-reload that
  config from a running process.
- **`/panel/api/setting/apiTokens/setEnabled/:id` and `/delete/:id` return `"success": false,
  "msg": "The parameters have been changed. (expected scope is required)"`** no matter what
  body/query shape was tried (body `scope`, query `?scope=`). Likely a genuine v3.7.0 panel-side
  bug — out of scope to chase further since the SDK doesn't wrap API-token management at all yet
  (not in `README.md`'s method list). A few orphaned test tokens were left on the local panel as a
  result (harmless, throwaway container).
- **`/panel/api/xray/testOutbound`** isn't wrapped by the SDK and its exact required body shape
  wasn't reverse-engineered (`{"outbound": {...}}` returns `"outbound parameter is required"`) —
  left unresolved since there's no SDK method depending on it.

## Not yet tested

- **`/panel/api/xray/testOutbound`** — exact payload shape unresolved (see Gotchas), not wrapped by the SDK.
- **`apiTokens/setEnabled`/`delete`** — blocked by the panel-side bug above.
- **`/panel/api/custom-geo/*`** — confirmed 404 on v3.7.0, can't test further without a newer panel image.

## Explicitly skipped (destructive — would disrupt the shared test panel)

- `restartPanel`, `stopXrayService`, `installXray`, `updatePanel`, `importDB`,
  `updateUser` (already flagged as session-breaking in [TESTING-SUMMARY.md](../test/TESTING-SUMMARY.md)),
  `updateGeofile` (downloads real GeoIP/GeoSite files).
