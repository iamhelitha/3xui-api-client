# 3X-UI Panel API — cURL examples

Generated from the [published Postman collection](https://documenter.getpostman.com/view/5146551/2sBXwnsBko) on 2026-08-26.

Set `BASE_URL` to the panel origin (for example, `https://panel.example.com`) and `API_TOKEN` to an API token before running protected examples. Login, logout, and CSRF endpoints are intentionally shown without an automatic Bearer header.

```sh
export BASE_URL="https://panel.example.com"
export API_TOKEN="replace-with-an-api-token"
```

## POST `/login`

**login — Authenticate with username + password and receive a session cookie. Required before any cookie-based API call.**

```sh
curl --request POST \
  --url "$BASE_URL/login" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --data-raw '{
  "username": "admin",
  "password": "admin",
  "twoFactorCode": "123456"
}'
```

## POST `/logout`

**logout — Clear the session cookie. Requires the CSRF header for browser sessions.**

```sh
curl --request POST \
  --url "$BASE_URL/logout" \
  --header 'Accept: application/json'
```

## GET `/csrf-token`

**csrf-token — Mint a CSRF token for the current session. The SPA replays it in the X-CSRF-Token header on unsafe requests. Bearer-token callers can skip this — the middleware short-circuits CSRF for authenticated API requests.**

```sh
curl --request GET \
  --url "$BASE_URL/csrf-token" \
  --header 'Accept: application/json'
```

## POST `/getTwoFactorEnable`

**getTwoFactorEnable — Returns whether 2FA is enabled on the panel — used by the login page to decide whether to show the OTP field.**

```sh
curl --request POST \
  --url "$BASE_URL/getTwoFactorEnable" \
  --header 'Accept: application/json'
```

## GET `/panel/api/inbounds/list/slim`

**panel — api — inbounds — list — slim — Same shape as /list but with settings.clients[] stripped down to {email, enable, comment} and ClientStats not enriched with UUID/SubId. Use this for list pages; fetch /get/:id when you need the full per-client payload (uuid, password, flow, ...).**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/inbounds/list/slim" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/inbounds/list`

**panel — api — inbounds — list — List every inbound owned by the authenticated user, including each inbound’s clientStats traffic counters. settings, streamSettings, and sniffing are returned as nested JSON objects (no escaped strings); legacy callers that send them back as JSON-encoded **

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/inbounds/list" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/inbounds/options`

**panel — api — inbounds — options — Lightweight picker projection of the authenticated user’s inbounds. Returns only id, remark, protocol, port, and a server-computed tlsFlowCapable flag (true for VLESS / port-fallback on TCP with tls or reality). Use this for dropdowns and attach pickers —**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/inbounds/options" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/inbounds/get/:id`

**panel — api — inbounds — get — {id} — Fetch a single inbound by numeric ID.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/inbounds/get/:id" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/inbounds/add`

**panel — api — inbounds — add — Create a new inbound. Send the full inbound payload (protocol, port, settings, streamSettings, sniffing, remark, expiryTime, total, enable). settings, streamSettings, and sniffing may be sent as nested JSON objects (preferred) or as JSON-encoded strings (**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/inbounds/add" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "enable": true,
  "remark": "VLESS-443",
  "listen": "",
  "port": 443,
  "protocol": "vless",
  "expiryTime": 0,
  "total": 0,
  "settings": {
    "clients": [
      {
        "id": "...",
        "email": "user1"
      }
    ],
    "decryption": "none",
    "fallbacks": []
  },
  "streamSettings": {
    "network": "tcp",
    "security": "reality",
    "realitySettings": {
      "show": false,
      "dest": "..."
    }
  },
  "sniffing": {
    "enabled": true,
    "destOverride": [
      "http",
      "tls"
    ]
  }
}'
```

## POST `/panel/api/inbounds/del/:id`

**panel — api — inbounds — del — {id} — Delete an inbound by ID. Also removes its associated client stats rows.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/inbounds/del/:id" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/inbounds/update/:id`

**panel — api — inbounds — update — {id} — Replace an inbound’s configuration. Body shape mirrors /add. Heavy on inbounds with thousands of clients — prefer /setEnable for enable-only flips.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/inbounds/update/:id" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/inbounds/setEnable/:id`

**panel — api — inbounds — setEnable — {id} — Toggle only the enable flag without serialising the whole settings JSON. Recommended for UI switches on large inbounds.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/inbounds/setEnable/:id" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "enable": false
}'
```

## POST `/panel/api/inbounds/:id/resetTraffic`

**panel — api — inbounds — {id} — resetTraffic — Zero out upload + download counters for a single inbound. Does not touch per-client counters.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/inbounds/:id/resetTraffic" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/inbounds/:id/delAllClients`

**panel — api — inbounds — {id} — delAllClients — Remove every client attached to a single inbound while keeping the inbound itself. Collects emails from settings.clients[] and feeds them into the optimized bulk-delete path (runtime user removal + traffic-row cleanup + SyncInbound). Destructive and canno**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/inbounds/:id/delAllClients" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/inbounds/:id/fallbacks`

**panel — api — inbounds — {id} — fallbacks — List the fallback rules attached to a master VLESS/Trojan TCP-TLS inbound. Each rule links one child inbound (the dest) to optional SNI/ALPN/path/xver match criteria.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/inbounds/:id/fallbacks" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/inbounds/:id/fallbacks`

**panel — api — inbounds — {id} — fallbacks — Replace the entire fallback list for a master inbound. Body is JSON. Triggers an Xray restart.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/inbounds/:id/fallbacks" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "fallbacks": [
    {
      "childId": 11,
      "path": "/vlws",
      "xver": 2
    },
    {
      "childId": 12,
      "alpn": "h2"
    }
  ]
}'
```

## POST `/panel/api/inbounds/resetAllTraffics`

**panel — api — inbounds — resetAllTraffics — Reset upload + download counters on every inbound. Destructive — accounting history is lost.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/inbounds/resetAllTraffics" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/inbounds/import`

**panel — api — inbounds — import — Bulk-import an inbound from a JSON blob (e.g. one exported via the UI). The body uses form encoding with a single "data" field.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/inbounds/import" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/status`

**panel — api — server — status — Real-time machine snapshot: CPU, memory, swap, disk, network IO, load averages, open connections, Xray state. Cached and refreshed every 2 seconds in the background.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/status" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/cpuHistory/:bucket`

**panel — api — server — cpuHistory — {bucket} — Legacy: aggregated CPU history. Use /history/cpu/:bucket instead — same data with a uniform {t, v} shape.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/cpuHistory/:bucket" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/history/:metric/:bucket`

**panel — api — server — history — {metric} — {bucket} — Aggregated time-series for one metric. Returns an array of {t, v} samples covering the last ~6 hours.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/history/:metric/:bucket" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/xrayMetricsState`

**panel — api — server — xrayMetricsState — Xray runtime metrics state — whether the xray config has a `metrics` block, which expvar keys are flowing, and the current snapshot values for each. Returns an empty state when metrics are not configured.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/xrayMetricsState" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/xrayMetricsHistory/:metric/:bucket`

**panel — api — server — xrayMetricsHistory — {metric} — {bucket} — Time-series history for one Xray runtime metric over the last ~6 hours. Same {t, v} shape as /history/:metric/:bucket.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/xrayMetricsHistory/:metric/:bucket" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/xrayObservatory`

**panel — api — server — xrayObservatory — Latest snapshot from the Xray observatory — per-outbound latency, health status, and last-probe time. Only populated when the Xray config has an observatory configured.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/xrayObservatory" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/xrayObservatoryHistory/:tag/:bucket`

**panel — api — server — xrayObservatoryHistory — {tag} — {bucket} — Time-series of observatory probe results for one outbound tag. Same {t, v} shape as the other history endpoints.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/xrayObservatoryHistory/:tag/:bucket" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/getXrayVersion`

**panel — api — server — getXrayVersion — List Xray binary versions available for install on this host.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/getXrayVersion" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/getPanelUpdateInfo`

**panel — api — server — getPanelUpdateInfo — Check whether a newer 3x-ui release is available on GitHub.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/getPanelUpdateInfo" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/getConfigJson`

**panel — api — server — getConfigJson — Return the assembled Xray config that’s currently running on this host.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/getConfigJson" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/getDb`

**panel — api — server — getDb — Stream the SQLite database file as an attachment. Use as a manual backup.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/getDb" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/getNewUUID`

**panel — api — server — getNewUUID — Generate a fresh UUID v4. Convenience helper for client IDs.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/getNewUUID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/getNewX25519Cert`

**panel — api — server — getNewX25519Cert — Generate a new X25519 keypair for Reality.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/getNewX25519Cert" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/getNewmldsa65`

**panel — api — server — getNewmldsa65 — Generate a new ML-DSA-65 keypair (post-quantum signature). Returns {privateKey, publicKey, seed}.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/getNewmldsa65" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/getNewmlkem768`

**panel — api — server — getNewmlkem768 — Generate a new ML-KEM-768 keypair (post-quantum KEM). Returns {clientKey, serverKey}.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/getNewmlkem768" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/server/getNewVlessEnc`

**panel — api — server — getNewVlessEnc — Generate VLESS encryption auth options. Returns an auths array each with id, label, encryption, and decryption fields.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/server/getNewVlessEnc" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/server/stopXrayService`

**panel — api — server — stopXrayService — Stop the Xray binary. All proxies go offline immediately.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/stopXrayService" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/server/restartXrayService`

**panel — api — server — restartXrayService — Reload Xray with the current config. Typically required after structural inbound or routing changes.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/restartXrayService" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/server/installXray/:version`

**panel — api — server — installXray — {version} — Download and install the specified Xray version. Pass "latest" for the newest release.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/installXray/:version" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/server/updatePanel`

**panel — api — server — updatePanel — Self-update the panel to the latest version. The server restarts on success.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/updatePanel" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/server/updateGeofile/:fileName`

**panel — api — server — updateGeofile — {fileName} — Refresh a single Geo file by filename (e.g. geoip.dat, geosite.dat).**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/updateGeofile/:fileName" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/server/updateGeofile`

**panel — api — server — updateGeofile — Refresh the default GeoIP / GeoSite data files. Body can include a fileName, or use the /:fileName variant.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/updateGeofile" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{}'
```

## POST `/panel/api/server/logs/:count`

**panel — api — server — logs — {count} — Return the last N lines of the panel’s own log.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/logs/:count" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "level": "info",
  "syslog": false
}'
```

## POST `/panel/api/server/xraylogs/:count`

**panel — api — server — xraylogs — {count} — Return the last N lines of the Xray process log.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/xraylogs/:count" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{}'
```

## POST `/panel/api/server/importDB`

**panel — api — server — importDB — Restore the panel DB from an uploaded SQLite file (multipart form, field name "db"). The panel restarts after restore. Destructive.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/importDB" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/server/getNewEchCert`

**panel — api — server — getNewEchCert — Generate a new ECH (Encrypted Client Hello) keypair and config list for the given SNI.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/server/getNewEchCert" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{}'
```

## GET `/panel/api/clients/list/paged?page=5404&pageSize=5404&search=string&filter=string&protocol=string&sort=string&order=string`

**panel — api — clients — list — paged — Filter, sort, and paginate clients on the server. Each item is a slim row (no uuid/password/auth/flow/security/reverse/tgId) so the clients page can ship 25-ish rows in a few KB instead of the full table. The response also includes a summary computed acro**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/clients/list/paged?page=5404&pageSize=5404&search=string&filter=string&protocol=string&sort=string&order=string" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/clients/list`

**panel — api — clients — list — List every client with its attached inbound IDs and traffic record. The reverse field, if set, is returned as a nested JSON object (legacy JSON-encoded-string form is still accepted on write).**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/clients/list" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/clients/get/:email`

**panel — api — clients — get — {email} — Fetch one client by email, including the inbound IDs it is attached to.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/clients/get/:email" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/add`

**panel — api — clients — add — Create a new client and attach it to one or more inbounds in a single call. Body is JSON. Per-protocol secrets (UUID for VLESS/VMess, password for Trojan/Shadowsocks, auth for Hysteria) are generated server-side when omitted, so callers can send only the **

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/add" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "client": {
    "email": "alice@example.com",
    "totalGB": 53687091200,
    "expiryTime": 1735689600000,
    "tgId": 0,
    "limitIp": 0,
    "enable": true
  },
  "inboundIds": [
    3,
    5
  ]
}'
```

## POST `/panel/api/clients/update/:email`

**panel — api — clients — update — {email} — Update an existing client by email. Changes propagate to every attached inbound. Body is the JSON client payload — supply the full set of fields you want to keep (the server replaces the row, it does not patch).**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/update/:email" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "email": "alice@example.com",
  "totalGB": 107374182400,
  "expiryTime": 1767225600000,
  "tgId": 123456789,
  "enable": true
}'
```

## POST `/panel/api/clients/del/:email?keepTraffic=5404`

**panel — api — clients — del — {email} — Delete a client by email. Removes it from every attached inbound and drops its traffic record unless keepTraffic=1 is passed.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/del/:email?keepTraffic=5404" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/:email/attach`

**panel — api — clients — {email} — attach — Attach an existing client to one or more additional inbounds. Body is JSON.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/:email/attach" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "inboundIds": [
    7,
    9
  ]
}'
```

## POST `/panel/api/clients/:email/detach`

**panel — api — clients — {email} — detach — Detach a client from one or more inbounds without deleting the client.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/:email/detach" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "inboundIds": [
    5
  ]
}'
```

## POST `/panel/api/clients/resetAllTraffics`

**panel — api — clients — resetAllTraffics — Reset the up/down counters for every client globally. Quotas and expiry are not affected. Triggers an Xray restart if any counter actually moved.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/resetAllTraffics" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/delDepleted`

**panel — api — clients — delDepleted — Delete every client whose traffic quota is exhausted (used >= total, when reset is disabled) or whose expiry has passed. Returns the deleted count and triggers an Xray restart when any client was on a running inbound.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/delDepleted" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/bulkAdjust`

**panel — api — clients — bulkAdjust — Shift expiry and/or traffic quota for many clients in one call. addDays/addBytes may be negative. Clients with unlimited expiry (expiryTime=0) or unlimited traffic (totalGB=0) are skipped for the corresponding field — bulk extend never converts unlimited **

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/bulkAdjust" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "emails": [
    "alice",
    "bob"
  ],
  "addDays": 30,
  "addBytes": 53687091200
}'
```

## POST `/panel/api/clients/bulkDel`

**panel — api — clients — bulkDel — Delete many clients in one call. The server processes the list sequentially so each delete sees the committed state of the previous one — avoids the race the per-email fan-out had on the panel side. Pass keepTraffic=true to retain the xray_client_traffic **

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/bulkDel" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "emails": [
    "alice",
    "bob"
  ],
  "keepTraffic": false
}'
```

## POST `/panel/api/clients/bulkCreate`

**panel — api — clients — bulkCreate — Create many clients in one call. Body is a JSON array of {client, inboundIds} payloads — the same shape /add accepts. Items are processed sequentially; per-email skip reasons are returned for items that fail (e.g., duplicate email). Triggers a single Xray**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/bulkCreate" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '[
  {
    "client": {
      "email": "alice@example.com",
      "totalGB": 53687091200,
      "expiryTime": 0,
      "enable": true
    },
    "inboundIds": [
      7
    ]
  },
  {
    "client": {
      "email": "bob@example.com",
      "totalGB": 53687091200,
      "expiryTime": 0,
      "enable": true
    },
    "inboundIds": [
      7,
      9
    ]
  }
]'
```

## POST `/panel/api/clients/groups/bulkAdd`

**panel — api — clients — groups — bulkAdd — Add many clients to a group in one call. Updates clients.group_name and patches the matching client entry inside every owning inbound's settings JSON in a single transaction. If the group name does not yet exist (in client_groups or as a derived label), i**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/groups/bulkAdd" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "emails": [
    "alice",
    "bob"
  ],
  "group": "customer-a"
}'
```

## POST `/panel/api/clients/groups/bulkRemove`

**panel — api — clients — groups — bulkRemove — Clear the group label on many clients in one call. Inverse of /groups/bulkAdd. Clients themselves are kept — only the group label is cleared from clients.group_name and from each owning inbound's settings JSON. Groups become empty if all their members are**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/groups/bulkRemove" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "emails": [
    "alice",
    "bob"
  ]
}'
```

## GET `/panel/api/clients/groups/:name/emails`

**panel — api — clients — groups — {name} — emails — Return just the email list of clients that currently belong to the given group. Useful for fanning a single bulk action over an entire group without round-tripping the full client list.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/clients/groups/:name/emails" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/groups/create`

**panel — api — clients — groups — create — Create a new empty (placeholder) group. The group becomes selectable in client forms and the filter drawer even before any client is added to it. Errors if a group with the same name already exists.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/groups/create" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "name": "customer-a"
}'
```

## POST `/panel/api/clients/groups/rename`

**panel — api — clients — groups — rename — Rename a group. The new name is applied to the client_groups row AND propagated to every matching client (both clients.group_name and the client entry inside every owning inbound's settings JSON) in a single transaction. Returns the number of clients whos**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/groups/rename" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "oldName": "customer-a",
  "newName": "tier-1"
}'
```

## POST `/panel/api/clients/groups/delete`

**panel — api — clients — groups — delete — Remove a group. Deletes the client_groups row and clears the group label from every matching client (both clients.group_name and the inbound settings JSON). The clients themselves are NOT deleted — use /bulkDel after filtering by group for that. Returns t**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/groups/delete" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "name": "customer-a"
}'
```

## GET `/panel/api/clients/groups`

**panel — api — clients — groups — List all client groups with their member counts. Merges persisted groups (rows in client_groups, including empty placeholders) with the distinct group_name values currently set on clients. Sorted alphabetically (case-insensitive).**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/clients/groups" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/bulkAttach`

**panel — api — clients — bulkAttach — Attach many existing clients to many inbounds in one call. Each client keeps its identity (email/UUID/password/subId) and a shared traffic row; all clients are added to a target inbound in a single AddInboundClient call. Clients already present on a targe**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/bulkAttach" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "emails": [
    "alice",
    "bob"
  ],
  "inboundIds": [
    7,
    9
  ]
}'
```

## POST `/panel/api/clients/bulkDetach`

**panel — api — clients — bulkDetach — Mirror of bulkAttach: detach many existing clients from many inbounds in one call. For each email, intersects the client's current inbounds with the requested set and detaches from those only; (email, inbound) pairs where the client is not currently attac**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/bulkDetach" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "emails": [
    "alice",
    "bob"
  ],
  "inboundIds": [
    7,
    9
  ]
}'
```

## POST `/panel/api/clients/bulkResetTraffic`

**panel — api — clients — bulkResetTraffic — Zero up/down counters for many clients in one call. Loops the single-reset path so each client is re-enabled across its attached inbounds and pushed to Xray/remote nodes. Returns the count of successfully reset clients.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/bulkResetTraffic" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "emails": [
    "alice",
    "bob"
  ]
}'
```

## POST `/panel/api/clients/resetTraffic/:email`

**panel — api — clients — resetTraffic — {email} — Zero out a single client’s up/down counters. Re-enables the client across every attached inbound and pushes the change to Xray (or the remote node) so depleted users can connect again immediately.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/resetTraffic/:email" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/updateTraffic/:email`

**panel — api — clients — updateTraffic — {email} — Manually adjust a client’s upload + download counters. Useful for migrations from external accounting systems.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/updateTraffic/:email" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "upload": 1073741824,
  "download": 5368709120
}'
```

## POST `/panel/api/clients/ips/:email`

**panel — api — clients — ips — {email} — List source IPs that have connected with the given client’s credentials. Returns an array of "ip (timestamp)" strings.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/ips/:email" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/clearIps/:email`

**panel — api — clients — clearIps — {email} — Reset the recorded IP list for a client.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/clearIps/:email" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/onlines`

**panel — api — clients — onlines — List the emails of currently connected clients (last seen within the heartbeat window).**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/onlines" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/clients/lastOnline`

**panel — api — clients — lastOnline — Map of client email → last-seen unix timestamp.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/clients/lastOnline" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/clients/traffic/:email`

**panel — api — clients — traffic — {email} — Traffic counters for a client identified by email.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/clients/traffic/:email" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/clients/subLinks/:subId`

**panel — api — clients — subLinks — {subId} — Return every protocol URL (vless://, vmess://, trojan://, ss://, hysteria://, hy2://) for clients matching the subscription ID. Same result set as /sub/<subId>, but as a JSON array — no base64. When an inbound has streamSettings.externalProxy set, one URL**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/clients/subLinks/:subId" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/clients/links/:email`

**panel — api — clients — links — {email} — Return every URL for one client across all attached inbounds — the same strings the Copy URL button copies in the panel UI. Supported protocols: vmess, vless, trojan, shadowsocks, hysteria. If streamSettings.externalProxy is set, returns one URL per exter**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/clients/links/:email" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/nodes/list`

**panel — api — nodes — list — List every configured node with its connection details, health, and last heartbeat patch.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/nodes/list" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/nodes/get/:id`

**panel — api — nodes — get — {id} — Fetch a single node by ID.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/nodes/get/:id" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/nodes/add`

**panel — api — nodes — add — Register a new remote node. Provide its URL, apiToken, and optional remark / allowPrivateAddress flag.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/nodes/add" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "name": "de-fra-1",
  "remark": "",
  "scheme": "https",
  "address": "node1.example.com",
  "port": 2053,
  "basePath": "/",
  "apiToken": "abcdef...",
  "enable": true,
  "allowPrivateAddress": false
}'
```

## POST `/panel/api/nodes/update/:id`

**panel — api — nodes — update — {id} — Replace a node’s connection details. Same body shape as /add.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/nodes/update/:id" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "name": "de-fra-1",
  "remark": "",
  "scheme": "https",
  "address": "node1.example.com",
  "port": 2053,
  "basePath": "/",
  "apiToken": "abcdef...",
  "enable": true,
  "allowPrivateAddress": false
}'
```

## POST `/panel/api/nodes/del/:id`

**panel — api — nodes — del — {id} — Delete a node. Inbounds bound to it are not auto-migrated.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/nodes/del/:id" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/nodes/setEnable/:id`

**panel — api — nodes — setEnable — {id} — Pause or resume traffic sync with this node.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/nodes/setEnable/:id" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "enable": true
}'
```

## POST `/panel/api/nodes/test`

**panel — api — nodes — test — Probe a node without saving it. Uses the body as connection details and returns the same heartbeat snapshot a registered node would have.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/nodes/test" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "scheme": "https",
  "address": "node1.example.com",
  "port": 2053,
  "basePath": "/",
  "apiToken": "abcdef..."
}'
```

## POST `/panel/api/nodes/probe/:id`

**panel — api — nodes — probe — {id} — Probe an existing node, updating its cached health state.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/nodes/probe/:id" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/nodes/history/:id/:metric/:bucket`

**panel — api — nodes — history — {id} — {metric} — {bucket} — Aggregated metric history for a node — same shape as /server/history, scoped to one node.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/nodes/history/:id/:metric/:bucket" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/custom-geo/list`

**panel — api — custom-geo — list — List configured custom geo sources with their type, alias, URL, status, and last-download timestamp.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/custom-geo/list" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## GET `/panel/api/custom-geo/aliases`

**panel — api — custom-geo — aliases — List geo aliases currently usable in routing rules — both built-in defaults and the user-configured ones.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/api/custom-geo/aliases" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/custom-geo/add`

**panel — api — custom-geo — add — Register a custom geo source. Alias is auto-normalised; URL must point to a .dat / .json blob.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/custom-geo/add" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN" \
  --data-raw '{
  "type": "geoip",
  "alias": "myips",
  "url": "https://example.com/geo/my.dat"
}'
```

## POST `/panel/api/custom-geo/update/:id`

**panel — api — custom-geo — update — {id} — Replace a custom geo source. Same body shape as /add.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/custom-geo/update/:id" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/custom-geo/delete/:id`

**panel — api — custom-geo — delete — {id} — Remove a custom geo source and its cached file.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/custom-geo/delete/:id" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/custom-geo/download/:id`

**panel — api — custom-geo — download — {id} — Re-download one custom geo source on demand.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/custom-geo/download/:id" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/custom-geo/update-all`

**panel — api — custom-geo — update-all — Re-download every configured custom geo source. Errors are reported per-source in the response.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/custom-geo/update-all" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/api/backuptotgbot`

**panel — api — backuptotgbot — Send a fresh DB backup to every Telegram chat configured as an admin recipient. No body, no params.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/api/backuptotgbot" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer $API_TOKEN"
```

## POST `/panel/setting/all`

**panel — setting — all — Return every panel setting: web server, Telegram bot, subscription, security, LDAP. The full JSON blob that the Settings page edits.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/setting/all" \
  --header 'Accept: application/json'
```

## POST `/panel/setting/defaultSettings`

**panel — setting — defaultSettings — Return the computed default settings based on the request host. Useful to preview what a fresh install would use.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/setting/defaultSettings" \
  --header 'Accept: application/json'
```

## POST `/panel/setting/update`

**panel — setting — update — Persist every setting at once. The body mirrors the shape returned by /all. Invalid values (bad ports, missing cert pairs, etc.) are rejected before write.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/setting/update" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --data-raw '{}'
```

## POST `/panel/setting/updateUser`

**panel — setting — updateUser — Change the panel admin username and password. Requires the current credentials for verification. The session is refreshed with the new values on success.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/setting/updateUser" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --data-raw '{
  "oldUsername": "admin",
  "oldPassword": "admin",
  "newUsername": "newadmin",
  "newPassword": "newpass"
}'
```

## POST `/panel/setting/restartPanel`

**panel — setting — restartPanel — Restart the entire 3x-ui process after a 3-second grace period. The connection drops immediately; the panel comes back online ~5-10 seconds later.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/setting/restartPanel" \
  --header 'Accept: application/json'
```

## GET `/panel/setting/getDefaultJsonConfig`

**panel — setting — getDefaultJsonConfig — Return the built-in default Xray JSON config template that ships with this panel version.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/setting/getDefaultJsonConfig" \
  --header 'Accept: application/json'
```

## POST `/panel/setting/apiTokens/create`

**panel — setting — apiTokens — create — Mint a new API token. Name must be unique and 1-64 characters; the token string is server-generated.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/setting/apiTokens/create" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --data-raw '{
  "name": "central-panel-a"
}'
```

## POST `/panel/setting/apiTokens/delete/:id`

**panel — setting — apiTokens — delete — {id} — Permanently delete a token. Any caller using it stops authenticating immediately.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/setting/apiTokens/delete/:id" \
  --header 'Accept: application/json'
```

## POST `/panel/setting/apiTokens/setEnabled/:id`

**panel — setting — apiTokens — setEnabled — {id} — Toggle a token enabled/disabled without deleting it. Disabled tokens are rejected by checkAPIAuth on the next request.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/setting/apiTokens/setEnabled/:id" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --data-raw '{
  "enabled": false
}'
```

## GET `/panel/setting/apiTokens`

**panel — setting — apiTokens — List every API token, enabled or not.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/setting/apiTokens" \
  --header 'Accept: application/json'
```

## GET `/panel/xray/getDefaultJsonConfig`

**panel — xray — getDefaultJsonConfig — Return the built-in default Xray config shipped with the panel (identical to /panel/setting/getDefaultJsonConfig).**

```sh
curl --request GET \
  --url "$BASE_URL/panel/xray/getDefaultJsonConfig" \
  --header 'Accept: application/json'
```

## GET `/panel/xray/getOutboundsTraffic`

**panel — xray — getOutboundsTraffic — Return traffic statistics for every outbound. Each outbound shows up/down/total counters.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/xray/getOutboundsTraffic" \
  --header 'Accept: application/json'
```

## GET `/panel/xray/getXrayResult`

**panel — xray — getXrayResult — Return the most recent Xray process stdout/stderr output. Useful to check for startup errors or runtime warnings.**

```sh
curl --request GET \
  --url "$BASE_URL/panel/xray/getXrayResult" \
  --header 'Accept: application/json'
```

## POST `/panel/xray/update`

**panel — xray — update — Save the Xray JSON config template and optionally the outbound test URL. Both are sent as form fields.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/xray/update" \
  --header 'Accept: application/json'
```

## POST `/panel/xray/warp/:action`

**panel — xray — warp — {action} — Manage Cloudflare Warp integration. The action parameter selects the operation.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/xray/warp/:action" \
  --header 'Accept: application/json'
```

## POST `/panel/xray/nord/:action`

**panel — xray — nord — {action} — Manage NordVPN integration. The action parameter selects the operation.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/xray/nord/:action" \
  --header 'Accept: application/json'
```

## POST `/panel/xray/resetOutboundsTraffic`

**panel — xray — resetOutboundsTraffic — Reset traffic counters for a specific outbound by tag.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/xray/resetOutboundsTraffic" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --data-raw '{}'
```

## POST `/panel/xray/testOutbound`

**panel — xray — testOutbound — Test an outbound configuration. Sends the outbound JSON (required), optionally all outbounds (to resolve sockopt.dialerProxy dependencies), and a mode flag.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/xray/testOutbound" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --data-raw '{}'
```

## POST `/panel/xray/`

**panel — xray — Return the Xray config template (JSON string), available inbound tags, client reverse tags, and the configured outbound test URL in one response.**

```sh
curl --request POST \
  --url "$BASE_URL/panel/xray/" \
  --header 'Accept: application/json'
```

## GET `/stringstring`

**{subPath}{subid} — Return base64-encoded subscription links for all enabled clients matching the subscription ID. When the request has an Accept: text/html header or ?html=1, renders a styled info page instead. Default path: /sub/:subid.**

```sh
curl --request GET \
  --url "$BASE_URL/stringstring" \
  --header 'Accept: application/json'
```

## GET `/stringstring`

**{jsonPath}{subid} — Return subscription as a JSON array of proxy configs (one per enabled client). Only when JSON subscription is enabled in settings. Default path: /json/:subid.**

```sh
curl --request GET \
  --url "$BASE_URL/stringstring" \
  --header 'Accept: application/json'
```

## GET `/stringstring`

**{clashPath}{subid} — Return subscription as a Clash/Mihomo-compatible YAML config. Only when Clash subscription is enabled in settings. Default path: /clash/:subid.**

```sh
curl --request GET \
  --url "$BASE_URL/stringstring" \
  --header 'Accept: application/json'
```

## GET `/ws`

**ws — Upgrade an HTTP connection to a WebSocket. Requires an authenticated session cookie (Bearer token auth is not supported here). Returns 101 Switching Protocols on success. The server then pushes JSON messages described below.**

```sh
curl --request GET \
  --url "$BASE_URL/ws" \
  --header 'Accept: application/json'
```
