/**
 * Regression tests for getDb() and importDB().
 *
 * getDb(): the panel streams the raw SQLite file directly (not wrapped in
 * the standard {success, msg, obj} envelope), and the response is
 * arbitrary binary data. Without responseType: 'arraybuffer', axios's
 * default UTF-8 text decoding is lossy for binary content - confirmed
 * against a live v3.7.0 panel: a real DB download came back 10 bytes
 * short and byte-different from the raw response. getDb() now forces
 * responseType: 'arraybuffer' and decodes with latin1 ('binary'), which
 * round-trips every byte value 1:1.
 *
 * importDB(): used to bypass _request() entirely and call this.api.post()
 * directly (to avoid _request()'s forced Content-Type: application/json
 * colliding with the multipart boundary), which meant it never got the
 * X-CSRF-Token header this panel requires on non-GET requests - it always
 * failed with a 403. It now routes through _request() with the FormData's
 * own multipart headers passed as extraHeaders, so it gets CSRF handling,
 * session recovery, and the correct Content-Type together.
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

function createClient(clients) {
    const client = new ThreeXUI('http://localhost:2053', 'admin', 'admin', { loginRetryBackoff: 0 });
    clients.push(client);
    return client;
}

describe('getDb', () => {
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

    it('requests responseType: arraybuffer', async () => {
        // Bytes that are NOT valid UTF-8 on their own (0xFF, 0xFE) - if the
        // implementation regresses to text decoding, these get mangled.
        const dbBytes = Buffer.from([0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0xff, 0xfe, 0x00, 0x01]);
        mockApi.request.mockResolvedValue({ data: dbBytes });

        const sdkClient = createClient(clients);
        await sdkClient.getDb();

        const [config] = mockApi.request.mock.calls[0];
        expect(config.responseType).toBe('arraybuffer');
    });

    it('round-trips arbitrary binary content losslessly', async () => {
        const dbBytes = Buffer.from([0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0xff, 0xfe, 0x00, 0x01, 0x80, 0x81]);
        mockApi.request.mockResolvedValue({ data: dbBytes });

        const sdkClient = createClient(clients);
        const result = await sdkClient.getDb();

        expect(result.success).toBe(true);
        expect(Buffer.from(result.obj, 'binary')).toEqual(dbBytes);
    });

    it('throws a clear error on empty content', async () => {
        mockApi.request.mockResolvedValue({ data: Buffer.alloc(0) });

        const sdkClient = createClient(clients);

        await expect(sdkClient.getDb()).rejects.toThrow('getDb: Response missing database content');
    });
});

describe('importDB', () => {
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

    function makeFormData() {
        return {
            getHeaders: () => ({ 'Content-Type': 'multipart/form-data; boundary=--fake-boundary--' })
        };
    }

    it('routes through _request() and includes the CSRF token', async () => {
        mockApi.request.mockResolvedValue({
            data: { success: true, msg: '', obj: 'The database has been successfully imported.' }
        });

        const sdkClient = createClient(clients);

        const formData = makeFormData();
        const result = await sdkClient.importDB(formData);

        expect(result.success).toBe(true);
        const importCall = mockApi.request.mock.calls.find(([config]) => config.url === '/panel/api/server/importDB');
        expect(importCall).toBeTruthy();
        const [config] = importCall;
        expect(config.method).toBe('post');
        expect(config.data).toBe(formData);
        // Set by login() during the auth flow that importDB()'s _request()
        // call triggers - proves it's attached at all, which the pre-fix
        // implementation (bypassing _request()) never did.
        expect(config.headers['X-CSRF-Token']).toBe(sdkClient.csrfToken);
        expect(sdkClient.csrfToken).toBeTruthy();
    });

    it('uses the FormData multipart Content-Type, not application/json', async () => {
        mockApi.request.mockResolvedValue({ data: { success: true, msg: '', obj: null } });

        const sdkClient = createClient(clients);

        const formData = makeFormData();
        await sdkClient.importDB(formData);

        const [config] = mockApi.request.mock.calls[0];
        expect(config.headers['Content-Type']).toBe('multipart/form-data; boundary=--fake-boundary--');
    });
});
