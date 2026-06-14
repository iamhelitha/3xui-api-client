# Modern API Guide

This guide covers the 48 new API routes added in v3.1.0 for 3x-ui v2.x/v3.x panels. These routes use the `/panel/api/clients/`, `/panel/api/nodes/`, and `/panel/api/custom-geo/` endpoints.

> **Version requirement**: These routes require 3x-ui v2.x or later. For older panels, use the [legacy API methods](Client-Management.md) under `/panel/api/inbounds/`.

## Table of Contents
- [Setup](#setup)
- [Clients](#clients)
- [Client Groups](#client-groups)
- [Nodes](#nodes)
- [Server-Side Generators](#server-side-generators)
- [Custom Geo](#custom-geo)

---

## Setup

```javascript
const ThreeXUI = require('3xui-api-client');

// With API token (3x-ui v3.0.2+)
const client = new ThreeXUI('https://your-panel.com:2053', {
    token: 'your-api-token'
});

// With username/password (all versions)
const client = new ThreeXUI('https://your-panel.com:2053', 'admin', 'password');
await client.login();
```

### Login compatibility (old vs. new panels)

The library features automatic **Dual Panel Support** to detect which generation of panel you're talking to:

- **Modern (React-based) panels**: The client tries `/panel/api/login` first. It automatically handles the `/panel/api/csrf-token` CSRF protection and uses the modern endpoints.
- **Legacy (Vue-based) panels**: If the modern login endpoint returns a 404, it seamlessly falls back to `/login` (pure cookie-based auth without CSRF).

The detected `panelType` is cached in the session so subsequent logins and API calls are instantly routed to the correct endpoints without re-detection. You can also explicitly specify `{ panelVersion: 'modern' | 'legacy' | 'auto' }` in the constructor options.

---

## Clients

### Get all clients
```javascript
const result = await client.getClients();
// GET /panel/api/clients/list
// Returns: { success: true, obj: [ ...clients ] }
```

### Get paginated clients
```javascript
const result = await client.getPagedClients({
    page: 1,        // page number (default: 1)
    size: 20,       // items per page (default: 10)
    sort: 'email',  // sort field: 'email' | 'expireTime' | 'totalGB'
    order: 'asc',   // 'asc' | 'desc'
    email: 'alice'  // filter by email (partial match)
});
// GET /panel/api/clients/list/paged?page=1&size=20&sort=email&order=asc
// Returns: { success: true, obj: {
//   items: [ { email, subId, enable, totalGB, expiryTime, limitIp, reset, inboundIds, traffic: {...}, createdAt, updatedAt }, ... ],
//   total: 1, filtered: 1, page: 1, pageSize: 25, summary: { total: 1, ... }
// } }
```

### Get client by email
```javascript
const result = await client.getClient('alice_vpn');
// GET /panel/api/clients/get/alice_vpn
// Returns: { success: true, obj: {
//   client: { id, email, subId, uuid, password, flow, limitIp, totalGB, expiryTime, enable, group, ... },
//   inboundIds: [1]
// } }
```

### Get client traffic by email
```javascript
const result = await client.getClientTraffic('alice_vpn');
// GET /panel/api/clients/traffic/alice_vpn
// Returns: { success: true, obj: { up, down, total, expiryTime, ... } }
```

### Get subscription links by subscription ID
```javascript
const result = await client.getSubLinks('550e8400-e29b-41d4-a716-446655440000');
// GET /panel/api/clients/subLinks/:subId
// Returns subscription URI strings for supported clients
```

### Get connection links by email
```javascript
const result = await client.getClientLinks('alice_vpn');
// GET /panel/api/clients/links/alice_vpn
// Returns protocol-specific connection strings (vless://, vmess://, etc.)
```

> [!IMPORTANT]
> **Data Limits (`totalGB`)**: Pass data limits in **GIGABYTES**. The library automatically converts to bytes internally. For example, `totalGB: 50` sets a 50 GB limit (converted to 53687091200 bytes internally). This automatic conversion prevents the silent quota error that existed in earlier versions.

### Add a client
```javascript
const result = await client.addModernClient({
    inboundIds: [1, 3],   // which inbounds to attach to
    client: {
        email: 'alice_vpn',
        id: '550e8400-e29b-41d4-a716-446655440000', // UUID for VLESS/VMess
        totalGB: 50,                                // data limit in GB (auto-converted to bytes, 0 = unlimited)
        expiryTime: 1751500800000,                  // Unix ms timestamp (0 = never)
        enable: true,
        flow: 'xtls-rprx-vision',
        limitIp: 2
    }
});
// POST /panel/api/clients/add
// Returns: { success: true, msg: "Inbound client(s) have been added.", obj: null }
```

### Update a client by email
```javascript
const result = await client.updateModernClient('alice_vpn', {
    totalGB: 100,      // Update to 100 GB (auto-converted to bytes)
    expiryTime: 0,     // 0 = never expire
    enable: true,
    limitIp: 3
});
// POST /panel/api/clients/update/alice_vpn
```

### Delete a client by email
```javascript
const result = await client.deleteModernClient('alice_vpn');
// POST /panel/api/clients/del/alice_vpn
```

### Attach client to inbounds
```javascript
const result = await client.attachClientToInbounds('alice_vpn', {
    inboundIds: [1, 2, 4]
});
// POST /panel/api/clients/alice_vpn/attach
```

### Detach client from inbounds
```javascript
const result = await client.detachClientFromInbounds('alice_vpn', {
    inboundIds: [4]
});
// POST /panel/api/clients/alice_vpn/detach
```

### Get client IPs
```javascript
const result = await client.getModernClientIps('alice_vpn');
// POST /panel/api/clients/ips/alice_vpn
// Returns: { success: true, obj: [...ipAddresses] } when IPs are recorded,
// or { success: true, obj: "No IP Record" } (string, not array) when none exist
```

### Clear client IPs
```javascript
const result = await client.clearModernClientIps('alice_vpn');
// POST /panel/api/clients/clearIps/alice_vpn
```

### Reset traffic for a client
```javascript
const result = await client.resetModernClientTrafficByEmail('alice_vpn');
// POST /panel/api/clients/resetTraffic/alice_vpn
```

### Update client traffic counters
```javascript
const result = await client.updateModernClientTrafficByEmail('alice_vpn', {
    up: 0,
    down: 0
});
// POST /panel/api/clients/updateTraffic/alice_vpn
```

### Reset traffic for all clients
```javascript
const result = await client.resetAllModernClientTraffics();
// POST /panel/api/clients/resetAllTraffics
```

### Delete depleted (expired/over-limit) clients
```javascript
const result = await client.deleteDepletedModernClients();
// POST /panel/api/clients/delDepleted
// Returns: { success: true, obj: { deleted: 0 } }
```

### Get currently online clients
```javascript
const result = await client.getOnlines();
// POST /panel/api/clients/onlines
// Returns: { success: true, obj: [...emails] } - list of emails currently connected
```

### Get last online time for all clients
```javascript
const result = await client.getModernLastOnline();
// POST /panel/api/clients/lastOnline
// Returns map of { email: lastSeenTimestamp }
```

### Bulk create clients
```javascript
// NOTE: the request body is a raw array, not wrapped in a `clients` object
const result = await client.bulkCreateModernClients([
    { inboundIds: [1], client: { email: 'user_001', id: '...uuid...', totalGB: 0, expiryTime: 0, enable: true } },
    { inboundIds: [1], client: { email: 'user_002', id: '...uuid...', totalGB: 0, expiryTime: 0, enable: true } }
]);
// POST /panel/api/clients/bulkCreate
// Returns: { success: true, obj: { created: 2 } }
// or, if some emails already exist: { success: true, obj: { created: 1, skipped: [{ email, reason }] } }
```

### Bulk adjust clients (traffic/expiry deltas)
```javascript
const result = await client.bulkAdjustModernClients({
    emails: ['user_001', 'user_002'],
    addDays: 30,            // shifts expiryTime by this many days (can be negative)
    addBytes: 10737418240   // shifts totalGB by this many bytes (can be negative)
});
// POST /panel/api/clients/bulkAdjust
// Returns: { success: true, obj: { adjusted: 2 } }
// Clients with unlimited expiry (expiryTime: 0) are skipped for addDays,
// and clients with unlimited traffic (totalGB: 0) are skipped for addBytes:
// { success: true, obj: { adjusted: 0, skipped: [{ email, reason: "unlimited expiry" }, ...] } }
```

### Bulk delete clients
```javascript
const result = await client.bulkDeleteModernClients({
    emails: ['user_001', 'user_002']
});
// POST /panel/api/clients/bulkDel
// Returns: { success: true, obj: { deleted: 2 } }
// or: { success: true, obj: { deleted: 0, skipped: [{ email, reason: "client not found" }, ...] } }
```

### Bulk attach clients to inbounds
```javascript
const result = await client.bulkAttachModernClients({
    emails: ['user_001', 'user_002'],
    inboundIds: [1, 2]
});
// POST /panel/api/clients/bulkAttach
// Returns: { success: true, obj: { attached: [...]|null, skipped: [...]|null, errors: ["user_001: record not found", ...] } }
```

### Bulk detach clients from inbounds
```javascript
const result = await client.bulkDetachModernClients({
    emails: ['user_001', 'user_002'],
    inboundIds: [2]
});
// POST /panel/api/clients/bulkDetach
// Returns: { success: true, obj: { detached: [...]|null, skipped: [...]|null, errors: [...] } }
```

### Bulk reset traffic
```javascript
const result = await client.bulkResetTrafficModernClients({
    emails: ['user_001', 'user_002']
});
// POST /panel/api/clients/bulkResetTraffic
// Returns: { success: true, obj: { affected: 2 } }
```

---

## Client Groups

Groups let you tag clients with labels and apply bulk operations to all members of a group.

### Get all groups
```javascript
const result = await client.getGroups();
// GET /panel/api/clients/groups
// Returns: { success: true, obj: [ { name: 'premium', clientCount: 3, trafficUsed: 1073741824 }, ... ] }
```

### Get emails in a group
```javascript
const result = await client.getGroupEmails('premium');
// GET /panel/api/clients/groups/premium/emails
// Returns: { success: true, obj: ['alice_vpn', 'bob_vpn', ...] }
```

### Create a group
```javascript
const result = await client.createGroup({ name: 'premium' });
// POST /panel/api/clients/groups/create
```

### Rename a group
```javascript
const result = await client.renameGroup({
    oldName: 'premium',
    newName: 'vip'
});
// POST /panel/api/clients/groups/rename
```

### Delete a group
```javascript
const result = await client.deleteGroup({ name: 'trial' });
// POST /panel/api/clients/groups/delete
```

### Add clients to a group (bulk)
```javascript
// NOTE: `group` is a single group name (string), not a `groups` array
const result = await client.bulkAddGroups({
    emails: ['alice_vpn', 'bob_vpn'],
    group: 'premium'
});
// POST /panel/api/clients/groups/bulkAdd
// Returns: { success: true, obj: { affected: 2 } }
```

### Remove clients from a group (bulk)
```javascript
// NOTE: only `emails` is accepted - this removes each client from
// whatever group it currently belongs to. There is no `group`/`groups` field.
const result = await client.bulkRemoveGroups({
    emails: ['alice_vpn']
});
// POST /panel/api/clients/groups/bulkRemove
// Returns: { success: true, obj: { affected: 1 } }
```

---

## Nodes

Nodes represent additional servers in a multi-server 3x-ui cluster. Each node
is itself a 3x-ui panel (or another panel's API), reachable over HTTP(S) and
authenticated with an API token.

### Get all nodes
```javascript
const result = await client.getNodes();
// GET /panel/api/nodes/list
// Returns: { success: true, obj: [ ...nodes ] } - see "Node object shape" below
```

### Get a specific node
```javascript
const result = await client.getNode(2);
// GET /panel/api/nodes/get/2
// Returns: { success: true, obj: { ...node } } - see "Node object shape" below
```

### Get node history metrics
```javascript
const result = await client.getNodeHistory(2, 'cpu', 60);
// GET /panel/api/nodes/history/2/cpu/60
// metric: 'cpu' | 'memory' | ... (whatever metrics the node reports)
// bucket: number of data points/seconds to return
// Returns: { success: true, obj: [ { t: 1781106540, v: 2.1624436777220635 }, ... ] }
// t = unix timestamp (seconds), v = metric value at that time
```

### Add a node
```javascript
const result = await client.addNode({
    name: 'SG Node 1',
    remark: 'Singapore secondary panel',
    scheme: 'https',                 // 'http' | 'https'
    address: 'sg-node.example.com',
    port: 2053,
    basePath: '/AbCdEfGhIj/',        // the node panel's web base path, must end with '/'
    apiToken: 'the-remote-nodes-api-token', // required - the API token configured on the target node's panel
    enable: true,
    allowPrivateAddress: false,      // set true to allow private/loopback addresses (e.g. self-registration)
    tlsVerifyMode: 'verify',         // optional, defaults to 'verify'
    pinnedCertSha256: ''             // optional, used when pinning a self-signed cert
});
// POST /panel/api/nodes/add
// Returns: { success: true, msg: "Add node", obj: { ...node } }
// Unless `allowPrivateAddress: true` is set, `address` must be a public/non-private
// address reachable from the panel, otherwise the panel rejects it with
// "blocked private/internal address".
```

### Update a node
```javascript
const result = await client.updateNode(2, {
    name: 'SG Node 1 (updated)',
    remark: 'Singapore secondary panel',
    scheme: 'https',
    address: 'sg-node.example.com',
    port: 2053,
    basePath: '/AbCdEfGhIj/',
    apiToken: 'the-remote-nodes-api-token',
    enable: true,
    allowPrivateAddress: false
});
// POST /panel/api/nodes/update/2
// Returns: { success: true, msg: "Update node", obj: null }
```

### Delete a node
```javascript
const result = await client.deleteNode(2);
// POST /panel/api/nodes/del/2
// Returns: { success: true, msg: "Delete node", obj: null }
```

### Enable/disable a node
```javascript
const result = await client.setNodeEnable(2, false); // explicitly disable
const result2 = await client.setNodeEnable(2, true);  // explicitly enable
const result3 = await client.setNodeEnable(2);        // toggles the current state
// POST /panel/api/nodes/setEnable/2
// Body (when `enable` is a boolean): { enable: true|false }
// Returns: { success: true, msg: "Update node", obj: null }
```

### Test node connectivity
```javascript
const result = await client.testNode({
    scheme: 'https',
    address: 'sg-node.example.com',
    port: 2053,
    basePath: '/AbCdEfGhIj/',
    apiToken: 'the-remote-nodes-api-token'
});
// POST /panel/api/nodes/test
// Returns: { success: true, obj: {
//   status: 'online' | 'offline', latencyMs, xrayVersion, panelVersion,
//   cpuPct, memPct, uptimeSecs, error, xrayState, xrayError
// } }
```

### Probe a node (health check)
```javascript
const result = await client.probeNode(2);
// POST /panel/api/nodes/probe/2
// Returns the same shape as testNode():
// { success: true, obj: { status, latencyMs, xrayVersion, panelVersion, cpuPct, memPct, uptimeSecs, error, xrayState, xrayError } }
```

### Node object shape

`getNodes()`, `getNode(id)`, and `addNode()` all return node objects with this shape:

```javascript
{
    id: 3,
    name: 'SG Node 1',
    remark: 'Singapore secondary panel',
    scheme: 'https',
    address: 'sg-node.example.com',
    port: 2053,
    basePath: '/AbCdEfGhIj/',
    apiToken: 'the-remote-nodes-api-token',
    enable: true,
    allowPrivateAddress: false,
    tlsVerifyMode: 'verify',
    pinnedCertSha256: '',
    guid: '',
    status: 'unknown',       // 'unknown' | 'online' | 'offline' (updated by probe/heartbeat)
    lastHeartbeat: 0,
    latencyMs: 0,
    xrayVersion: '',
    panelVersion: '',
    cpuPct: 0,
    memPct: 0,
    uptimeSecs: 0,
    lastError: '',
    xrayState: '',
    xrayError: '',
    configDirty: false,
    configDirtyAt: 0,
    inboundCount: 0,
    clientCount: 0,
    onlineCount: 0,
    depletedCount: 0,
    createdAt: 1781106907531,
    updatedAt: 1781106907531
}
```

---

## Server-Side Generators

These routes ask the panel itself to generate keys/certs (e.g. for Reality,
ECH, post-quantum key exchange) so the client never needs a local crypto
implementation.

### Generate a new UUID
```javascript
const result = await client.getNewUUID();
// GET /panel/api/server/getNewUUID
// Returns: { success: true, obj: { uuid: '...' } }
```

### Generate an X25519 key pair (Reality)
```javascript
const result = await client.getNewX25519Cert();
// GET /panel/api/server/getNewX25519Cert
// Returns: { success: true, obj: { privateKey: '...', publicKey: '...' } }
```

### Generate an ML-DSA-65 key pair
```javascript
const result = await client.getNewmldsa65();
// GET /panel/api/server/getNewmldsa65
// Returns: { success: true, obj: { seed: '...', verify: '...' } }
```

### Generate an ML-KEM-768 key pair
```javascript
const result = await client.getNewmlkem768();
// GET /panel/api/server/getNewmlkem768
// Returns: { success: true, obj: { seed: '...', client: '...' } }
```

### Generate VLESS encryption settings
```javascript
const result = await client.getNewVlessEnc();
// GET /panel/api/server/getNewVlessEnc
// Returns: { success: true, obj: { auths: [ { id, label, decryption, encryption }, ... ] } }
```

### Generate an ECH certificate
```javascript
const result = await client.getNewEchCert();              // without SNI
const result2 = await client.getNewEchCert('example.com'); // with SNI
// POST /panel/api/server/getNewEchCert
// `sni` (when provided) is sent as application/x-www-form-urlencoded,
// matching how the panel reads it via c.PostForm.
// Returns: { success: true, obj: { echConfigList: '...', echServerKeys: '...' } }
```

### Get web certificate file paths
```javascript
const result = await client.getWebCertFiles();
// GET /panel/api/server/getWebCertFiles
// Returns: { success: true, obj: { webCertFile: '/path/to/fullchain.pem', webKeyFile: '/path/to/privkey.pem' } }
```

---

## Custom Geo

Custom Geo lets you define and manage custom geographic IP/domain lists used in Xray routing rules.

### Get all custom geo entries
```javascript
const result = await client.getCustomGeos();
// GET /panel/api/custom-geo/list
// Returns: { success: true, obj: [ { id, type, alias, url, localPath, lastUpdatedAt, lastModified, createdAt, updatedAt }, ... ] }
```

### Get geo aliases
```javascript
const result = await client.getGeoAliases();
// GET /panel/api/custom-geo/aliases
// Returns: { success: true, obj: { geosite: [...] | null, geoip: [...] | null } }
// alias mappings for built-in geo files
```

### Add a custom geo entry
```javascript
// NOTE: only `type`, `alias`, and `url` are accepted - there is no `name`/`data` field
const result = await client.addCustomGeo({
    type: 'geosite',   // 'geosite' | 'geoip' (NOT 'domain'/'ip')
    alias: 'my-blocked-sites-alias',
    url: 'https://example.com/path/to/geosite.dat' // remote file the panel downloads
});
// POST /panel/api/custom-geo/add
// The panel downloads `url` and validates it as a geosite/geoip data file -
// a URL that doesn't resolve to one will fail with "Add custom geo (Download failed)".
// Returns: { success: true, msg: "Add custom geo", obj: null }
// To get the new entry's id, call getCustomGeos() afterwards and match by alias.
```

### Update a custom geo entry
```javascript
const result = await client.updateCustomGeo(3, {
    type: 'geosite',
    alias: 'my-blocked-sites-alias',
    url: 'https://example.com/path/to/geosite.dat'
});
// POST /panel/api/custom-geo/update/3
// Returns: { success: true, msg: "...", obj: null }
```

### Delete a custom geo entry
```javascript
const result = await client.deleteCustomGeo(3);
// POST /panel/api/custom-geo/delete/3
```

### Download a custom geo file
```javascript
const result = await client.downloadCustomGeo(3);
// POST /panel/api/custom-geo/download/3
// Triggers download/export of the geo file
```

### Update all custom geo files
```javascript
const result = await client.updateAllCustomGeo();
// POST /panel/api/custom-geo/update-all
// Fetches latest versions of all subscribed geo lists
// Returns: { success: true, obj: { succeeded: [...]|null, failed: [...]|null } }
```

---

## Navigation

| Previous | Next |
|----------|------|
| [← Authentication Guide](Authentication-Guide.md) | [Inbound Management →](Inbound-Management.md) |

*Last updated: June 2026*
