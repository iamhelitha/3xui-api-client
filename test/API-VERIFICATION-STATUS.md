# API Verification Status

Tracks which `3xui-api-client` methods/routes have been exercised against a
**live** 3x-ui panel, on which panel generation, and what (if anything) is
still outstanding. Update this file whenever a new route is verified.

- **TEST server** = fresh 3x-ui v2.x/v3.x install (React-based panel, requires
  `/csrf-token` flow). Run via `node test/live-modern-api-test.js`
  (uses `TEST_PANEL_URL` / `TEST_PANEL_USERNAME` / `TEST_PANEL_PASSWORD` from `.env`).
- **PRODUCTION server** = older 3x-ui install (Vue-based panel, no `/csrf-token`).
  Only read-only/non-mutating calls have been run here.

---

## Auth / Login

| Method | TEST server | PRODUCTION server | Notes |
|---|---|---|---|
| `login()` | ✅ Verified (CSRF flow) | ✅ Verified (classic flow) | Dual-mode fallback confirmed working on both panel generations |
| `logout()` | Not yet checked | Not yet checked | |
| Cookie-session POST/PUT/DELETE (`X-CSRF-Token` header) | ✅ Verified | N/A (old panel doesn't require it) | Fixed via `_buildRequestHeaders()` |

---

## Modern API (`/panel/api/clients`, `/panel/api/nodes`, `/panel/api/custom-geo`)

All rows below were last verified against the **TEST server** via
`node test/live-modern-api-test.js`.

### Clients

| Method | Route | Status | Notes |
|---|---|---|---|
| `getClients()` | GET `/panel/api/clients/list` | ✅ Verified | |
| `getPagedClients()` | GET `/panel/api/clients/list/paged` | ✅ Verified | shape documented in wiki |
| `getClient(email)` | GET `/panel/api/clients/get/:email` | ✅ Verified | `obj: { client, inboundIds }` shape fixed |
| `getClientTraffic(email)` | GET `/panel/api/clients/traffic/:email` | ✅ Verified | |
| `getSubLinks(subId)` | GET `/panel/api/clients/subLinks/:subId` | ✅ Verified | empty result on fresh server |
| `getClientLinks(email)` | GET `/panel/api/clients/links/:email` | ✅ Verified | |
| `addModernClient(data)` | POST `/panel/api/clients/add` | ✅ Verified | payload shape fixed: `{ inboundIds, client }`; returns `obj: null` |
| `updateModernClient(email, data)` | POST `/panel/api/clients/update/:email` | ✅ Verified | |
| `deleteModernClient(email)` | POST `/panel/api/clients/del/:email` | ✅ Verified | |
| `attachClientToInbounds(email, data)` | POST `/panel/api/clients/:email/attach` | ✅ Verified | |
| `detachClientFromInbounds(email, data)` | POST `/panel/api/clients/:email/detach` | ✅ Verified | |
| `getModernClientIps(email)` | POST `/panel/api/clients/ips/:email` | ✅ Verified | `obj` is `"No IP Record"` (string) when empty |
| `clearModernClientIps(email)` | POST `/panel/api/clients/clearIps/:email` | ✅ Verified | |
| `resetModernClientTrafficByEmail(email)` | POST `/panel/api/clients/resetTraffic/:email` | ✅ Verified | |
| `updateModernClientTrafficByEmail(email, data)` | POST `/panel/api/clients/updateTraffic/:email` | ✅ Verified | |
| `resetAllModernClientTraffics()` | POST `/panel/api/clients/resetAllTraffics` | ✅ Verified | |
| `deleteDepletedModernClients()` | POST `/panel/api/clients/delDepleted` | ✅ Verified | returns `obj: { deleted }` |
| `getOnlines()` | POST `/panel/api/clients/onlines` | ✅ Verified | required `X-CSRF-Token` fix |
| `getModernLastOnline()` | POST `/panel/api/clients/lastOnline` | ✅ Verified | |
| `bulkCreateModernClients(data)` | POST `/panel/api/clients/bulkCreate` | ✅ Verified | payload is a raw array, not `{clients:[...]}` |
| `bulkAdjustModernClients(data)` | POST `/panel/api/clients/bulkAdjust` | ✅ Verified | payload is `{ emails, addDays, addBytes }` (deltas), not absolute values |
| `bulkDeleteModernClients(data)` | POST `/panel/api/clients/bulkDel` | ✅ Verified | |
| `bulkAttachModernClients(data)` | POST `/panel/api/clients/bulkAttach` | ✅ Verified | |
| `bulkDetachModernClients(data)` | POST `/panel/api/clients/bulkDetach` | ✅ Verified | |
| `bulkResetTrafficModernClients(data)` | POST `/panel/api/clients/bulkResetTraffic` | ✅ Verified | |

### Client Groups

| Method | Route | Status | Notes |
|---|---|---|---|
| `getGroups()` | GET `/panel/api/clients/groups` | ✅ Verified on TEST | 404 on PRODUCTION (route doesn't exist on old panel - expected) |
| `getGroupEmails(name)` | GET `/panel/api/clients/groups/:name/emails` | ✅ Verified | |
| `createGroup(data)` | POST `/panel/api/clients/groups/create` | ✅ Verified | |
| `renameGroup(data)` | POST `/panel/api/clients/groups/rename` | ✅ Verified | |
| `deleteGroup(data)` | POST `/panel/api/clients/groups/delete` | ✅ Verified | |
| `bulkAddGroups(data)` | POST `/panel/api/clients/groups/bulkAdd` | ✅ Verified | payload fixed: singular `group` (string), not `groups` array |
| `bulkRemoveGroups(data)` | POST `/panel/api/clients/groups/bulkRemove` | ✅ Verified | payload fixed: only `{ emails }`, no group field |

### Nodes

| Method | Route | Status | Notes |
|---|---|---|---|
| `getNodes()` | GET `/panel/api/nodes/list` | ✅ Verified | |
| `getNode(id)` | GET `/panel/api/nodes/get/:id` | ✅ Verified | full node object shape documented in wiki |
| `getNodeHistory(id, metric, bucket)` | GET `/panel/api/nodes/history/:id/:metric/:bucket` | ✅ Verified | `obj: [{ t, v }, ...]` |
| `addNode(data)` | POST `/panel/api/nodes/add` | ✅ Verified | full payload shape: `{ name, remark, scheme, address, port, basePath, apiToken, enable, allowPrivateAddress, tlsVerifyMode?, pinnedCertSha256? }`; `allowPrivateAddress: true` required for self-registration / loopback |
| `updateNode(id, data)` | POST `/panel/api/nodes/update/:id` | ✅ Verified | returns `obj: null` |
| `deleteNode(id)` | POST `/panel/api/nodes/del/:id` | ✅ Verified | returns `obj: null` |
| `setNodeEnable(id, enable)` | POST `/panel/api/nodes/setEnable/:id` | ✅ Verified | now accepts optional `enable: boolean` body; without it, panel toggles current state |
| `testNode(data)` | POST `/panel/api/nodes/test` | ✅ Verified | full response shape documented (`status`, `latencyMs`, etc.) |
| `probeNode(id)` | POST `/panel/api/nodes/probe/:id` | ✅ Verified | same response shape as `testNode()` |

### Custom Geo

| Method | Route | Status | Notes |
|---|---|---|---|
| `getCustomGeos()` | GET `/panel/api/custom-geo/list` | ✅ Verified | |
| `getGeoAliases()` | GET `/panel/api/custom-geo/aliases` | ✅ Verified | `obj: { geosite, geoip }` |
| `addCustomGeo(data)` | POST `/panel/api/custom-geo/add` | ✅ Verified | payload fixed: `{ type, alias, url }` (no `name`/`data`); returns `obj: null` |
| `updateCustomGeo(id, data)` | POST `/panel/api/custom-geo/update/:id` | ✅ Verified | same shape as add; returns `obj: null` |
| `downloadCustomGeo(id)` | POST `/panel/api/custom-geo/download/:id` | ✅ Verified | |
| `deleteCustomGeo(id)` | POST `/panel/api/custom-geo/delete/:id` | ✅ Verified | |
| `updateAllCustomGeo()` | POST `/panel/api/custom-geo/update-all` | ✅ Verified | `obj: { succeeded, failed }` |

---

## Legacy API (`/panel/api/inbounds`, `/panel/api/server`, `/panel`)

**Phase 1 finding (this session):** the TEST server runs the new 3x-ui v3.x
panel rewrite, which **removed all client-management sub-routes** from
`/panel/api/inbounds/*` (addClient, delClient, updateClient,
updateClientTraffic, delClientByEmail, getClientTraffics*, clientIps,
clearClientIps, resetClientTraffic, resetAllClientTraffics,
delDepletedClients, onlines, lastOnline, createbackup). These were replaced
by the Modern Client API (`/panel/api/clients/*`, fully verified above).
Confirmed against the v3.x source (`internal/web/controller/inbound.go`):
only `list`, `list/slim`, `options`, `get/:id`, `add`, `del/:id`, `bulkDel`,
`update/:id`, `setEnable/:id`, `:id/resetTraffic`, `:id/delAllClients`,
`resetAllTraffics`, `import`, and `:id/fallbacks` remain.

The 404'd routes were cross-checked against the **PRODUCTION** server (older
Vue-based panel, `test/probe-legacy-production-readonly.js`, read-only calls
on an existing inbound/client) and **do still work there** - so these methods
remain correct for older panels, just unavailable on v3.x.

| Method | Route | TEST server (v3.x) | PRODUCTION server (older) | Notes |
|---|---|---|---|---|
| `getInbounds()` | POST `/panel/api/inbounds/list` | ✅ Verified | ✅ Verified (read-only) | used as login-fallback regression check |
| `getInbound(id)` | GET `/panel/api/inbounds/get/:id` | ✅ Verified | Not checked | `test/probe-legacy-api.js` |
| `addInbound(config)` | POST `/panel/api/inbounds/add` | ✅ Verified | Not checked | used as setup for Modern API client tests |
| `updateInbound(id, config)` | POST `/panel/api/inbounds/update/:id` | ✅ Verified | Not checked | `test/probe-legacy-api.js` |
| `deleteInbound(id)` | POST `/panel/api/inbounds/del/:id` | ✅ Verified | Not checked | used as cleanup |
| `importInbounds(inbounds)` | POST `/panel/api/inbounds/import` | ✅ Fixed & Verified | Not checked | **payload shape was wrong** (was sending `{inbounds: [...]}` as JSON, server expects a single inbound's JSON in a form-urlencoded `data` field - confirmed via v3.x source). Now sends one form-encoded request per inbound and returns an array of responses; accepts a single object or an array. Verified via `test/probe-import-inbound.js` |
| `getLastOnline()` | POST `/panel/api/inbounds/lastOnline` | ❌ 404 (removed in v3.x) | ✅ Verified | use Modern API `getModernLastOnline()` on v3.x panels |
| `addClient(config)` | POST `/panel/api/inbounds/addClient` | ❌ 404 (removed in v3.x) | Not checked (was working pre-v3.x per `test/07_addClient.js`) | use Modern API `addModernClient(data)` on v3.x panels |
| `deleteClient(inboundId, clientId)` | POST `/panel/api/inbounds/:id/delClient/:clientId` | ❌ 404 (removed in v3.x) | Not checked (was working pre-v3.x per `test/09_deleteClient.js`) | use Modern API `deleteModernClient(email)` on v3.x panels |
| `updateClient(clientId, config)` | POST `/panel/api/inbounds/updateClient/:clientId` | ❌ 404 (removed in v3.x) | Not checked (was working pre-v3.x per `test/08_updateClient.js`) | use Modern API `updateModernClient(email, data)` on v3.x panels |
| `updateClientTraffic(email, config)` | POST `/panel/api/inbounds/updateClientTraffic/:email` | ❌ 404 (removed in v3.x) | Not checked | use Modern API `updateModernClientTrafficByEmail(email, data)` on v3.x panels |
| `deleteClientByEmail(inboundId, email)` | POST `/panel/api/inbounds/:id/delClientByEmail/:email` | ❌ 404 (removed in v3.x) | Not checked | use Modern API `deleteModernClient(email)` on v3.x panels |
| `getClientTrafficsByEmail(email)` | GET `/panel/api/inbounds/getClientTraffics/:email` | ❌ 404 (removed in v3.x) | ✅ Verified | use Modern API `getClientTraffic(email)` on v3.x panels |
| `getClientTrafficsById(id)` | GET `/panel/api/inbounds/getClientTrafficsById/:id` | ❌ 404 (removed in v3.x) | ✅ Verified | no direct Modern API equivalent by client UUID; use `getClientTraffic(email)` |
| `getClientIps(email)` | POST `/panel/api/inbounds/clientIps/:email` | ❌ 404 (removed in v3.x) | ✅ Verified | use Modern API `getModernClientIps(email)` on v3.x panels |
| `clearClientIps(email)` | POST `/panel/api/inbounds/clearClientIps/:email` | ❌ 404 (removed in v3.x) | Not checked | use Modern API `clearModernClientIps(email)` on v3.x panels |
| `resetClientTraffic(inboundId, email)` | POST `/panel/api/inbounds/:id/resetClientTraffic/:email` | ❌ 404 (removed in v3.x) | Not checked - **mutating, not tested on PRODUCTION** | use Modern API `resetModernClientTrafficByEmail(email)` on v3.x panels |
| `resetAllTraffics()` | POST `/panel/api/inbounds/resetAllTraffics` | ✅ Verified | Not checked | **global mutation** - resets traffic stats for ALL clients on the panel; still present in v3.x router |
| `resetAllClientTraffics(inboundId)` | POST `/panel/api/inbounds/resetAllClientTraffics/:id` | ❌ 404 (removed in v3.x) | Not checked - **mutating, not tested on PRODUCTION** | use Modern API `resetAllModernClientTraffics()` on v3.x panels (global, not per-inbound) |
| `deleteDepletedClients(inboundId)` | POST `/panel/api/inbounds/delDepletedClients/:id` | ❌ 404 (removed in v3.x) | Not checked - **mutating, not tested on PRODUCTION** | use Modern API `deleteDepletedModernClients()` on v3.x panels (global, not per-inbound) |
| `getOnlineClients()` | POST `/panel/api/inbounds/onlines` | ❌ 404 (removed in v3.x) | ✅ Verified | use Modern API `getOnlines()` on v3.x panels |
| `createBackup()` | GET `/panel/api/inbounds/createbackup` | ❌ 404 (removed in v3.x) | ❌ 404 (route never existed at this path) | **route is wrong even for older panels** - v3.x source shows DB export is `getDb()` (`/panel/api/server/getDb`, already implemented). No drop-in replacement found yet for older panels; needs further investigation |
| `backupToTgBot()` | POST `/panel/api/backuptotgbot` | ✅ Verified (200, empty body) | Not checked | response body is empty `""` - ambiguous but no error; likely fire-and-forget |

---

## System / Server Management (`/server`, `/xray`, settings)

**Phase B (read-only system endpoints) - completed against TEST server (v3.3.0)**,
populated with 4 inbounds (vless+reality, vmess, shadowsocks) and 4 clients via
`test/setup-phase-b-data.js` / `test/fix-broken-reality-inbound.js` so responses
reflect realistic data. Mutating endpoints below remain **Not re-checked** and are
deferred to Phase C per user instruction (TEST server only, explicit go-ahead
required, never PRODUCTION).

| Method | Status |
|---|---|
| `getServerStatus()` | ✅ Verified - returns cpu/mem/disk/xray/panelVersion etc. |
| `getCPUHistory(bucket)` | ✅ Fixed & verified - **bug fix**: default changed from `'min'` to `60`. Panel only accepts bucket values from `{2, 30, 60, 120, 180, 300}` (seconds); any other value (incl. old default `'min'`) returns `{success:false, msg:"invalid bucket (unsupported bucket)"}`. Verified `60` and `30` both return real history arrays |
| `getXrayVersion()` | ✅ Verified - returns array of available xray-core versions |
| `getConfigJson()` | ✅ Verified - returns full xray JSON config (inbounds/outbounds/api/log) |
| `getDb()` | ✅ Verified - returns raw SQLite database file content as a string (starts `"SQLite format 3 ..."`), not a `Buffer`. Document this in System Operations wiki |
| `stopXrayService()` | Not re-checked - **mutating, deferred to Phase C** |
| `restartXrayService()` | Not re-checked - **mutating, deferred to Phase C** |
| `installXray(version)` | Not re-checked - **mutating, deferred to Phase C** |
| `getPanelLogs(count)` | ✅ Verified - `POST /panel/api/server/logs/:count`, returns array of log lines |
| `getXrayLogs(count)` | ✅ Verified - `POST /panel/api/server/xraylogs/:count`, returns `obj: null` when no xray log buffer entries are available yet (xray was recently restarted) |
| `updateGeofile(fileName)` | Not re-checked - **mutating, deferred to Phase C** |
| `importDB(formData)` | Not re-checked - **destructive, deferred to Phase C** |
| `getNewUUID()` / `getNewX25519Cert()` / `getNewmldsa65()` / `getNewmlkem768()` / `getNewVlessEnc()` / `getNewEchCert(sni?)` / `getWebCertFiles()` | ✅ Verified | response shapes documented in wiki; `getNewEchCert(sni)` now sends `sni` as form-urlencoded; `getWebCertFiles()` newly wrapped |
| `getAllSettings()` | ✅ Fixed & verified - **route fix**: `/panel/setting/all` → `/panel/api/setting/all` (v3.x moved `SettingController` under `/panel/api/setting/*`; old path returned 404) |
| `updateSetting(settings)` | Not re-checked - **mutating, deferred to Phase C** (route fixed to `/panel/api/setting/update`) |
| `updateUser(...)` | Not re-checked - **mutating, changes login credentials, deferred to Phase C** (route fixed to `/panel/api/setting/updateUser`) |
| `restartPanel()` | Not re-checked - **mutating, will drop active sessions, deferred to Phase C** (route fixed to `/panel/api/setting/restartPanel`) |
| `getDefaultSettings()` / `getDefaultJsonConfig()` | ✅ Fixed & verified - **route fix**: `/panel/setting/defaultSettings` → `/panel/api/setting/defaultSettings`, `/panel/setting/getDefaultJsonConfig` → `/panel/api/setting/getDefaultJsonConfig` (both 404'd before fix) |
| `getXrayConfig()` | ✅ Fixed & verified - **route fix**: `/panel/xray/` → `/panel/api/xray/` (v3.x moved `XraySettingController` under `/panel/api/xray/*`; old path returned 404) |
| `updateXrayConfig(config)` | Not re-checked - **mutating, deferred to Phase C** (route fixed to `/panel/api/xray/update`) |
| `manageWarp(action, data)` | Not re-checked - **mutating, deferred to Phase C** (route fixed to `/panel/api/xray/warp/:action`) |
| `getOutboundsTraffic()` / `resetOutboundsTraffic()` | `getOutboundsTraffic()` ✅ Fixed & verified (route fixed to `/panel/api/xray/getOutboundsTraffic`, returns `obj: []`); `resetOutboundsTraffic()` Not re-checked - **mutating, deferred to Phase C** (route fixed to `/panel/api/xray/resetOutboundsTraffic`) |
| `getXrayResult()` | ✅ Fixed & verified - **route fix**: `/panel/xray/getXrayResult` → `/panel/api/xray/getXrayResult` (was 404, now returns `obj: ""`) |
| `getSecurityStats()` / `clearBlockedIPs()` | N/A - these are **local in-memory helpers** (`this.securityMonitor.getStats()` / `.clearBlockedIPs()`), not live API calls. No panel route involved; not applicable to live verification |

### ✅ Fixed: `CredentialGenerator.generateRealityKeys()` previously produced an invalid keypair

`src/generators/CredentialGenerator.js` (`generateRealityKeys()`) used to generate
`privateKey` and `publicKey` as two **independent random 32-byte values** instead of
deriving `publicKey` from `privateKey` via X25519 (the source had a comment
acknowledging this: "simplified - use proper X25519 in production"). Confirmed live:
creating a VLESS+Reality inbound via `ProtocolBuilder.vless().reality({...})` (no
explicit `keys`) crashed xray-core entirely on the panel
(`xray.state: "error"`, `"Failed to build REALITY config... invalid privateKey"`).

**Fix applied**: added `CredentialGenerator._generateX25519KeyPair()`, which uses
Node's built-in `crypto.generateKeyPairSync('x25519')` + JWK export to generate a
real, correctly-derived X25519 key pair. Both `generateRealityKeys()` (base64url, no
padding) and `generateWireGuardKeys()` (standard base64, which had the same bug -
random placeholder public key) now use this helper. Verified locally that the derived
`publicKey` matches the X25519 public key recomputed from `privateKey`, and verified
live on TEST: a VLESS+Reality inbound created via `ProtocolBuilder.vless().reality({dest:...})`
(no explicit `keys`, exercising the fixed `generateRealityKeys()`) now keeps
`xray.state: "running"` (`test/verify-reality-fix.js`).

---

## Suggested Next Checks

1. ~~Node lifecycle~~ - ✅ done (`addNode`, `getNode`, `updateNode`,
   `setNodeEnable`, `getNodeHistory`, `probeNode`, `deleteNode`) using the
   TEST server registered as a node of itself (`allowPrivateAddress: true` +
   its own apiToken). See `test/probe-codegen-and-nodes.js` and
   `test/probe-new-wrappers.js`.
2. ~~Phase 1: Legacy `/panel/api/inbounds/*` API~~ - ✅ done. Inbound CRUD
   (`getInbounds`, `getInbound`, `addInbound`, `updateInbound`,
   `deleteInbound`, `resetAllTraffics`) verified on TEST (v3.x);
   `importInbounds` payload shape fixed and verified. All client-management
   sub-routes confirmed removed on TEST (v3.x) and confirmed still present on
   PRODUCTION (older panel) - documented with Modern API replacements above.
   `createBackup()` route does not exist on either panel generation - still
   needs a fix (see open item below).
3. ~~`index.d.ts` type declarations for Phase B~~ - ✅ done. Added missing
   declarations for `getCPUHistory`, `getXrayVersion`, `getConfigJson`, `getDb`,
   `stopXrayService`, `restartXrayService`, `installXray`, `getPanelLogs`,
   `getXrayLogs`, `updateGeofile`, `importDB`, `getAllSettings`, `updateSetting`,
   `updateUser`, `restartPanel`, `getDefaultSettings`, `getDefaultJsonConfig`,
   `getXrayConfig`, `updateXrayConfig`, `manageWarp`, `getOutboundsTraffic`,
   `resetOutboundsTraffic`, `getXrayResult` to the `ThreeXUI` class in `index.d.ts`.
4. ~~Phase B: Read-only system endpoints~~ - ✅ done. `getServerStatus`,
   `getCPUHistory`, `getXrayVersion`, `getConfigJson`, `getDb`,
   `getPanelLogs`/`getXrayLogs`, `getXrayConfig`, `getOutboundsTraffic`,
   `getXrayResult`, `getAllSettings`, `getDefaultSettings`,
   `getDefaultJsonConfig` all verified on TEST (v3.3.0) after fixing two bugs:
   `getCPUHistory` bucket default (`'min'` → `60`) and `/panel/setting/*` /
   `/panel/xray/*` → `/panel/api/setting/*` / `/panel/api/xray/*` route prefixes
   (v3.x moved `SettingController`/`XraySettingController` under `/panel/api`).
   `getSecurityStats`/`clearBlockedIPs` are local-only helpers, not API routes.
   Also found and fixed a separate bug in `CredentialGenerator.generateRealityKeys()`
   / `generateWireGuardKeys()` (publicKey not derived from privateKey via X25519) -
   see "Fixed" section above.
5. Phase C (next): Mutating/dangerous system endpoints (`updateSetting`,
   `updateUser`, `updateXrayConfig`, `restartPanel`, `restartXrayService`,
   `installXray`, `importDB`, `manageWarp`, `resetOutboundsTraffic`,
   `stopXrayService`) - only run against TEST server, never PRODUCTION, and
   only with explicit go-ahead since they can disrupt the panel
   (`updateUser` can lock out the session, `restartPanel`/`restartXrayService`
   drop active connections, `importDB` can wipe the database, `installXray`
   can break the panel).
6. Open item: find the correct route/method for `createBackup()` on v3.x
   (likely should become an alias for `getDb()`, or be deprecated/removed in
   favor of it) - re-check `getMigration` (`/panel/api/server/getMigration`,
   newly discovered in v3.x source) as a possible related export.
