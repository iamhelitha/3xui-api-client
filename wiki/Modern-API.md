# Modern API Guide

This guide covers the 48 new API routes added in v3.0.0 for 3x-ui v2.x/v3.x panels. These routes use the `/panel/api/clients/`, `/panel/api/nodes/`, and `/panel/api/custom-geo/` endpoints.

> **Version requirement**: These routes require 3x-ui v2.x or later. For older panels, use the [legacy API methods](Client-Management.md) under `/panel/api/inbounds/`.

## Table of Contents
- [Setup](#setup)
- [Clients](#clients)
- [Client Groups](#client-groups)
- [Nodes](#nodes)
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
```

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
```

### Get client by email
```javascript
const result = await client.getClient('alice_vpn');
// GET /panel/api/clients/get/alice_vpn
// Returns: { success: true, obj: { email, id, inboundIds, ... } }
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

### Add a client
```javascript
const result = await client.addModernClient({
    username: 'alice_vpn',
    email: 'alice_vpn',
    id: '550e8400-e29b-41d4-a716-446655440000', // UUID for VLESS/VMess
    inboundIds: [1, 3],                          // which inbounds to attach to
    totalGB: 50,                                 // data limit in GB (0 = unlimited)
    expiryTime: 1751500800000,                   // Unix ms timestamp (0 = never)
    enable: true,
    flow: 'xtls-rprx-vision',
    limitIp: 2
});
// POST /panel/api/clients/add
```

### Update a client by email
```javascript
const result = await client.updateModernClient('alice_vpn', {
    totalGB: 100,
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
// Returns list of IPs the client has connected from
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
```

### Get currently online clients
```javascript
const result = await client.getOnlines();
// POST /panel/api/clients/onlines
// Returns list of emails currently connected
```

### Get last online time for all clients
```javascript
const result = await client.getModernLastOnline();
// POST /panel/api/clients/lastOnline
// Returns map of { email: lastSeenTimestamp }
```

### Bulk create clients
```javascript
const result = await client.bulkCreateModernClients({
    clients: [
        { email: 'user_001', id: '...uuid...', inboundIds: [1] },
        { email: 'user_002', id: '...uuid...', inboundIds: [1] }
    ]
});
// POST /panel/api/clients/bulkCreate
```

### Bulk adjust clients (traffic/expiry)
```javascript
const result = await client.bulkAdjustModernClients({
    emails: ['user_001', 'user_002'],
    totalGB: 100,
    expiryTime: 1751500800000
});
// POST /panel/api/clients/bulkAdjust
```

### Bulk delete clients
```javascript
const result = await client.bulkDeleteModernClients({
    emails: ['user_001', 'user_002']
});
// POST /panel/api/clients/bulkDel
```

### Bulk attach clients to inbounds
```javascript
const result = await client.bulkAttachModernClients({
    emails: ['user_001', 'user_002'],
    inboundIds: [1, 2]
});
// POST /panel/api/clients/bulkAttach
```

### Bulk detach clients from inbounds
```javascript
const result = await client.bulkDetachModernClients({
    emails: ['user_001', 'user_002'],
    inboundIds: [2]
});
// POST /panel/api/clients/bulkDetach
```

### Bulk reset traffic
```javascript
const result = await client.bulkResetTrafficModernClients({
    emails: ['user_001', 'user_002']
});
// POST /panel/api/clients/bulkResetTraffic
```

---

## Client Groups

Groups let you tag clients with labels and apply bulk operations to all members of a group.

### Get all groups
```javascript
const result = await client.getGroups();
// GET /panel/api/clients/groups
// Returns: { success: true, obj: ['premium', 'trial', ...] }
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
const result = await client.bulkAddGroups({
    emails: ['alice_vpn', 'bob_vpn'],
    groups: ['premium']
});
// POST /panel/api/clients/groups/bulkAdd
```

### Remove clients from a group (bulk)
```javascript
const result = await client.bulkRemoveGroups({
    emails: ['alice_vpn'],
    groups: ['premium']
});
// POST /panel/api/clients/groups/bulkRemove
```

---

## Nodes

Nodes represent additional servers in a multi-server 3x-ui cluster.

### Get all nodes
```javascript
const result = await client.getNodes();
// GET /panel/api/nodes/list
// Returns: { success: true, obj: [ ...nodes ] }
```

### Get a specific node
```javascript
const result = await client.getNode(2);
// GET /panel/api/nodes/get/2
// Returns: { success: true, obj: { id, name, address, port, ... } }
```

### Get node history metrics
```javascript
const result = await client.getNodeHistory(2, 'cpu', '1h');
// GET /panel/api/nodes/history/2/cpu/1h
// metric: 'cpu' | 'memory' | 'network'
// bucket: time resolution e.g. '1m', '5m', '1h'
```

### Add a node
```javascript
const result = await client.addNode({
    name: 'SG Node 1',
    address: '10.0.0.2',
    port: 2053,
    apiPort: 2096,
    enable: true
});
// POST /panel/api/nodes/add
```

### Update a node
```javascript
const result = await client.updateNode(2, {
    name: 'SG Node 1 (updated)',
    enable: true
});
// POST /panel/api/nodes/update/2
```

### Delete a node
```javascript
const result = await client.deleteNode(2);
// POST /panel/api/nodes/del/2
```

### Enable/disable a node
```javascript
const result = await client.setNodeEnable(2);
// POST /panel/api/nodes/setEnable/2
// Toggles the enabled state of the node
```

### Test node connectivity
```javascript
const result = await client.testNode({ address: '10.0.0.2', port: 2053 });
// POST /panel/api/nodes/test
```

### Probe a node (health check)
```javascript
const result = await client.probeNode(2);
// POST /panel/api/nodes/probe/2
// Returns latency and status information
```

---

## Custom Geo

Custom Geo lets you define and manage custom geographic IP/domain lists used in Xray routing rules.

### Get all custom geo entries
```javascript
const result = await client.getCustomGeos();
// GET /panel/api/custom-geo/list
// Returns: { success: true, obj: [ { id, name, type, ... } ] }
```

### Get geo aliases
```javascript
const result = await client.getGeoAliases();
// GET /panel/api/custom-geo/aliases
// Returns alias mappings for built-in geo files
```

### Add a custom geo entry
```javascript
const result = await client.addCustomGeo({
    name: 'my-blocked-sites',
    type: 'domain',    // 'domain' | 'ip'
    data: 'example.com\nmalicious.net'
});
// POST /panel/api/custom-geo/add
```

### Update a custom geo entry
```javascript
const result = await client.updateCustomGeo(3, {
    name: 'my-blocked-sites',
    data: 'example.com\nmalicious.net\nnewsite.org'
});
// POST /panel/api/custom-geo/update/3
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
```

---

## Navigation

| Previous | Next |
|----------|------|
| [← Authentication Guide](Authentication-Guide.md) | [Inbound Management →](Inbound-Management.md) |

*Last updated: June 2026*
