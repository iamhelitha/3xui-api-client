/**
 * Regression test for stale-session recovery (_retryAfterRelogin).
 *
 * Bug: when _request() classifies a response as a stale session (401/404/HTML
 * login page) and forces a re-login, the axios instance still carries the
 * *previous* session cookie as a default header. Some panels' /csrf-token
 * endpoint does not reissue a Set-Cookie when a session cookie is already
 * attached to the request, so _getCsrfToken() found nothing fresh to pair
 * with the CSRF token and returned null. The retried /login request then
 * went out without X-CSRF-Token and the panel rejected it with a 403 -
 * masking the original error behind an unrelated "login failed" exception.
 *
 * Fix: login(forceRefresh) clears the stale cookie/csrfToken before running
 * the CSRF handshake, so the forced re-login always starts from a clean,
 * anonymous state.
 */

jest.mock('axios');
const axios = require('axios');
const ThreeXUI = require('../../index.js');

function makeMockApi() {
    const api = {
        defaults: { headers: {} },
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() }
        },
        get: jest.fn(),
        post: jest.fn(),
        request: jest.fn()
    };

    // Mimics the real panel: /csrf-token only issues a fresh Set-Cookie when
    // no session cookie is already attached to the request. This is the
    // exact behavior that exposed the bug.
    let csrfCounter = 0;
    api.get.mockImplementation((url) => {
        if (url === '/csrf-token') {
            csrfCounter += 1;
            if (api.defaults.headers.Cookie) {
                // A cookie is already attached - panel does not reissue one.
                return Promise.resolve({
                    status: 200,
                    data: { success: true, obj: `csrf-token-${csrfCounter}` },
                    headers: {}
                });
            }
            return Promise.resolve({
                status: 200,
                data: { success: true, obj: `csrf-token-${csrfCounter}` },
                headers: { 'set-cookie': [`3x-ui=anon-cookie-${csrfCounter}; Path=/`] }
            });
        }
        return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    let loginCounter = 0;
    api.post.mockImplementation((url, _data, config) => {
        if (url === '/panel/api/login') {
            // Modern endpoint doesn't exist on this (legacy) panel.
            const error = new Error('Request failed with status code 404');
            error.response = { status: 404, data: '' };
            return Promise.reject(error);
        }
        if (url === '/login') {
            loginCounter += 1;
            const headers = (config && config.headers) || {};
            if (!headers['X-CSRF-Token'] || !headers['Cookie']) {
                // This is exactly what the buggy behavior triggers: a /login
                // POST with no CSRF token because _getCsrfToken() returned null.
                const error = new Error('Request failed with status code 403');
                error.response = { status: 403, data: '' };
                return Promise.reject(error);
            }
            return Promise.resolve({
                data: { success: true, msg: 'logged in' },
                headers: { 'set-cookie': [`3x-ui=session-cookie-${loginCounter}; Path=/`] }
            });
        }
        return Promise.reject(new Error(`Unexpected POST ${url}`));
    });

    // The actual API call made by getInbounds(). First call simulates a
    // stale session (404, per the library's own recovery heuristic); the
    // retried call after a successful forced re-login succeeds.
    let requestCounter = 0;
    api.request.mockImplementation(() => {
        requestCounter += 1;
        if (requestCounter === 1) {
            const error = new Error('Request failed with status code 404');
            error.response = { status: 404, data: '' };
            return Promise.reject(error);
        }
        return Promise.resolve({ data: { success: true, msg: '', obj: [] } });
    });

    return api;
}

describe('stale-session recovery (_retryAfterRelogin)', () => {
    let mockApi;
    let clients;

    beforeEach(() => {
        mockApi = makeMockApi();
        axios.create.mockReturnValue(mockApi);
        clients = [];
    });

    afterEach(async () => {
        // The default in-memory session store schedules a setTimeout per
        // stored session (defaultTTL: 3600s) that otherwise keeps the
        // process alive past the test run.
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

    it('recovers from a stale session without a spurious 403 login failure', async () => {
        const client = createClient();

        const result = await client.getInbounds();

        expect(result).toEqual({ success: true, msg: '', obj: [] });

        // Two real /login POSTs: the initial login, and the forced relogin
        // triggered by the stale-session (404) response.
        expect(mockApi.post).toHaveBeenCalledTimes(3); // /panel/api/login (404) + /login x2
        const loginCalls = mockApi.post.mock.calls.filter(([url]) => url === '/login');
        expect(loginCalls).toHaveLength(2);

        // Both /login attempts must have carried a CSRF token - proving the
        // forced re-login started from a clean (cookie-free) state instead
        // of reusing the stale cookie and getting no fresh token.
        for (const [, , config] of loginCalls) {
            expect(config.headers['X-CSRF-Token']).toBeTruthy();
            expect(config.headers['Cookie']).toBeTruthy();
        }

        // The original request was retried exactly once after the relogin.
        expect(mockApi.request).toHaveBeenCalledTimes(2);
    });

    it('clears the stale cookie before the forced-relogin CSRF handshake', async () => {
        const client = createClient();

        await client.getInbounds();

        // Sanity: a session cookie is attached to defaults, but it's the
        // fresh cookie from the *second* login, not the first.
        expect(mockApi.defaults.headers.Cookie).toBe('3x-ui=session-cookie-2');
    });
});
