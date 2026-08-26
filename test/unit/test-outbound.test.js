/**
 * Regression test for testOutbound().
 *
 * The panel's /panel/api/xray/testOutbound endpoint reads its body via
 * c.PostForm, not JSON - a JSON body always fails with "outbound parameter
 * is required" regardless of field name or nesting. The correct shape is
 * application/x-www-form-urlencoded with an `outbound` field holding the
 * JSON-stringified outbound object (confirmed against a live v3.7.0 panel;
 * see docs/LOCAL_TEST_RESULTS.md).
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

    api.request.mockResolvedValue({
        data: {
            success: true,
            msg: '',
            obj: { tag: 'direct', success: false, delay: 0, error: 'Direct/DNS outbound cannot be tested', mode: 'http' }
        }
    });

    return api;
}

describe('testOutbound', () => {
    let mockApi;
    let clients;

    beforeEach(() => {
        mockApi = makeMockApi();
        axios.create.mockReturnValue(mockApi);
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(client => client.sessionManager.store.clear()));
    });

    function createClient() {
        const client = new ThreeXUI('http://localhost:2053', 'admin', 'admin', { loginRetryBackoff: 0 });
        clients.push(client);
        return client;
    }

    it('sends a form-urlencoded body with the outbound JSON-stringified', async () => {
        const sdkClient = createClient();
        const outbound = { protocol: 'freedom', settings: {}, tag: 'direct' };

        await sdkClient.testOutbound(outbound);

        const [config] = mockApi.request.mock.calls[0];
        expect(config.method).toBe('post');
        expect(config.url).toBe('/panel/api/xray/testOutbound');
        expect(config.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        expect(config.data).toBe(`outbound=${encodeURIComponent(JSON.stringify(outbound))}`);
    });

    it('accepts a pre-stringified outbound without double-encoding it', async () => {
        const sdkClient = createClient();
        const outboundStr = JSON.stringify({ protocol: 'blackhole', settings: {}, tag: 'blocked' });

        await sdkClient.testOutbound(outboundStr);

        const [config] = mockApi.request.mock.calls[0];
        expect(config.data).toBe(`outbound=${encodeURIComponent(outboundStr)}`);
    });

    it('includes allOutbounds and mode when provided', async () => {
        const sdkClient = createClient();
        const outbound = { protocol: 'freedom', settings: {}, tag: 'direct' };
        const allOutbounds = [outbound, { protocol: 'blackhole', settings: {}, tag: 'blocked' }];

        await sdkClient.testOutbound(outbound, { allOutbounds, mode: 'http' });

        const [config] = mockApi.request.mock.calls[0];
        const params = new URLSearchParams(config.data);
        expect(params.get('outbound')).toBe(JSON.stringify(outbound));
        expect(params.get('outbounds')).toBe(JSON.stringify(allOutbounds));
        expect(params.get('mode')).toBe('http');
    });

    it('returns the panel response unchanged', async () => {
        const sdkClient = createClient();

        const result = await sdkClient.testOutbound({ protocol: 'freedom', settings: {}, tag: 'direct' });

        expect(result).toEqual({
            success: true,
            msg: '',
            obj: { tag: 'direct', success: false, delay: 0, error: 'Direct/DNS outbound cannot be tested', mode: 'http' }
        });
    });
});
