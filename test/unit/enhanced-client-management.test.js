/**
 * Regression tests for addClientWithCredentials / updateClientWithCredentials.
 *
 * Both methods used to build a raw ClientConfig and call the legacy
 * addClient()/updateClient() routes (/panel/api/inbounds/addClient,
 * /panel/api/inbounds/updateClient/:id) - routes 3x-ui v3.x removed (see
 * CLAUDE.md). They now route through the Modern Client API instead.
 *
 * updateClientWithCredentials also used to assume `inbound.settings` comes
 * back as a JSON string and call JSON.parse() on it unconditionally - on
 * v3.7.0+ panels the panel returns settings as an already-parsed object, so
 * that parse threw `"[object Object]" is not valid JSON`. It now handles
 * both shapes.
 *
 * Additionally, the Modern Client API's update endpoint replaces the whole
 * client row, and rejects a payload that round-trips two fields exactly as
 * getClient() returns them: the numeric row `id` (write side expects a
 * different `.id` semantic) and `allowedIPs` (string on read, array on
 * write, for WireGuard peers). Both are stripped before the update request.
 */

jest.mock('axios');
const axios = require('axios');
const ThreeXUI = require('../../index.js');

function makeMockApi() {
    const api = {
        defaults: { headers: {} },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
        get: jest.fn(),
        post: jest.fn(),
        request: jest.fn()
    };

    api.get.mockImplementation((url) => {
        if (url === '/csrf-token') {
            return Promise.resolve({
                status: 200,
                data: { success: true, obj: 'csrf-token' },
                headers: { 'set-cookie': ['3x-ui=anon-cookie; Path=/'] }
            });
        }
        return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    api.post.mockImplementation((url) => {
        if (url === '/panel/api/login') {
            const error = new Error('Request failed with status code 404');
            error.response = { status: 404, data: '' };
            return Promise.reject(error);
        }
        if (url === '/login') {
            return Promise.resolve({
                data: { success: true, msg: 'logged in' },
                headers: { 'set-cookie': ['3x-ui=session-cookie; Path=/'] }
            });
        }
        return Promise.reject(new Error(`Unexpected POST ${url}`));
    });

    return api;
}

const EXISTING_CLIENT_UUID = '11111111-1111-1111-1111-111111111111';
const EXISTING_EMAIL = 'existing@example.com';

// Full shape getClient() returns - includes fields (id, allowedIPs) that
// break the update endpoint if round-tripped verbatim.
const FULL_CLIENT_RECORD = {
    id: 7,
    email: EXISTING_EMAIL,
    subId: 'sub-id-value',
    uuid: EXISTING_CLIENT_UUID,
    password: '',
    flow: 'xtls-rprx-vision',
    allowedIPs: '',
    limitIp: 0,
    totalGB: 1073741824,
    expiryTime: 0,
    enable: true
};

describe('addClientWithCredentials', () => {
    let mockApi;
    let clients;

    beforeEach(() => {
        mockApi = makeMockApi();
        axios.create.mockReturnValue(mockApi);
        clients = [];
    });

    afterEach(async () => {
        // The default in-memory session store schedules a setTimeout per
        // stored session that otherwise keeps the process alive past the
        // test run - clear it even if the test itself threw/failed.
        await Promise.all(clients.map(client => client.sessionManager.store.clear()));
    });

    function createClient(options = {}) {
        const client = new ThreeXUI('http://localhost:2053', 'admin', 'admin', {
            loginRetryBackoff: 0,
            ...options
        });
        clients.push(client);
        return client;
    }

    it('routes through the Modern Client API, not the dead legacy addClient route', async () => {
        mockApi.request.mockResolvedValue({ data: { success: true, msg: 'added', obj: null } });

        const sdkClient = createClient();
        const result = await sdkClient.addClientWithCredentials(1, 'vless', { email: 'new@example.com', totalGB: 5 });

        expect(result.success).toBe(true);
        const [call] = mockApi.request.mock.calls;
        expect(call[0].method).toBe('post');
        expect(call[0].url).toBe('/panel/api/clients/add');
        expect(call[0].data.inboundIds).toEqual([1]);
        // totalGB converted exactly once (5 GB -> bytes), not double-converted.
        expect(call[0].data.client.totalGB).toBe(5 * 1024 ** 3);
    });
});

describe('updateClientWithCredentials', () => {
    let mockApi;
    let clients;

    function mockInboundAndClient(settingsAsObject) {
        const inboundSettings = { clients: [{ id: EXISTING_CLIENT_UUID, email: EXISTING_EMAIL }] };
        mockApi.request.mockImplementation((config) => {
            if (config.method === 'get' && config.url === '/panel/api/inbounds/get/1') {
                return Promise.resolve({
                    data: {
                        success: true,
                        obj: { id: 1, settings: settingsAsObject ? inboundSettings : JSON.stringify(inboundSettings) }
                    }
                });
            }
            if (config.method === 'get' && config.url === `/panel/api/clients/get/${encodeURIComponent(EXISTING_EMAIL)}`) {
                return Promise.resolve({
                    data: { success: true, obj: { client: FULL_CLIENT_RECORD, inboundIds: [1] } }
                });
            }
            if (config.method === 'post' && config.url === `/panel/api/clients/update/${encodeURIComponent(EXISTING_EMAIL)}`) {
                return Promise.resolve({ data: { success: true, msg: 'updated', obj: null } });
            }
            return Promise.reject(new Error(`Unexpected request ${config.method} ${config.url}`));
        });
    }

    beforeEach(() => {
        mockApi = makeMockApi();
        axios.create.mockReturnValue(mockApi);
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(client => client.sessionManager.store.clear()));
    });

    function createClient(options = {}) {
        const client = new ThreeXUI('http://localhost:2053', 'admin', 'admin', {
            loginRetryBackoff: 0,
            ...options
        });
        clients.push(client);
        return client;
    }

    it('handles settings returned as an already-parsed object (v3.7.0+)', async () => {
        mockInboundAndClient(true);
        const sdkClient = createClient();

        const result = await sdkClient.updateClientWithCredentials(EXISTING_CLIENT_UUID, 1, { totalGB: 9 });

        expect(result.success).toBe(true);
    });

    it('still handles settings returned as a JSON string (older panels)', async () => {
        mockInboundAndClient(false);
        const sdkClient = createClient();

        const result = await sdkClient.updateClientWithCredentials(EXISTING_CLIENT_UUID, 1, { totalGB: 9 });

        expect(result.success).toBe(true);
    });

    it('strips the read-only id and mistyped allowedIPs before the update request', async () => {
        mockInboundAndClient(true);
        const sdkClient = createClient();

        await sdkClient.updateClientWithCredentials(EXISTING_CLIENT_UUID, 1, { totalGB: 9 });

        const updateCall = mockApi.request.mock.calls.find(
            ([config]) => config.method === 'post' && config.url === `/panel/api/clients/update/${encodeURIComponent(EXISTING_EMAIL)}`
        );
        expect(updateCall).toBeTruthy();
        const [config] = updateCall;
        expect(config.data).not.toHaveProperty('id');
        expect(config.data).not.toHaveProperty('allowedIPs');
        // Preserved from the full record even though the caller didn't pass it.
        expect(config.data.flow).toBe('xtls-rprx-vision');
        expect(config.data.totalGB).toBe(9 * 1024 ** 3);
    });

    it('rejects an unknown client id with a clear error instead of throwing', async () => {
        mockInboundAndClient(true);
        const sdkClient = createClient();

        const result = await sdkClient.updateClientWithCredentials('not-a-real-id', 1, { totalGB: 9 });

        expect(result.success).toBe(false);
        expect(result.message).toMatch(/not found in inbound/);
    });
});
