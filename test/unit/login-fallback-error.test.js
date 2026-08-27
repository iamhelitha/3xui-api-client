/**
 * Regression test for login()'s modern-then-legacy fallback error handling.
 *
 * Bug: when both the modern (/panel/api/login) and legacy (/login) login
 * attempts fail, the code threw the modern endpoint's error unconditionally,
 * discarding the legacy endpoint's actual error. If the legacy endpoint is
 * the one that genuinely matters (e.g. wrong credentials, proxy issue,
 * webBasePath problem unique to that route), the thrown error always
 * described the modern-endpoint failure (often a generic 404) instead of
 * the real, more specific legacy failure.
 *
 * Fix: throw a combined error referencing both attempts' messages.
 */

jest.mock('axios');
const axios = require('axios');
const ThreeXUI = require('../../index.js');

function makeMockApi({ modernMessage, legacyMessage }) {
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

    api.get.mockImplementation((url) => {
        if (url === '/csrf-token') {
            return Promise.resolve({
                status: 200,
                data: { success: true, obj: 'csrf-token-1' },
                headers: { 'set-cookie': ['3x-ui=anon-cookie-1; Path=/'] }
            });
        }
        return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    api.post.mockImplementation((url) => {
        if (url === '/panel/api/login') {
            const error = new Error(modernMessage);
            error.response = { status: 404, data: '' };
            return Promise.reject(error);
        }
        if (url === '/login') {
            const error = new Error(legacyMessage);
            error.response = { status: 403, data: '' };
            return Promise.reject(error);
        }
        return Promise.reject(new Error(`Unexpected POST ${url}`));
    });

    return api;
}

describe('login() modern-then-legacy fallback error handling', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('throws a combined error referencing both failures when both endpoints fail', async () => {
        const mockApi = makeMockApi({
            modernMessage: 'Request failed with status code 404',
            legacyMessage: 'Request failed with status code 403 (invalid credentials)'
        });
        axios.create.mockReturnValue(mockApi);

        const client = new ThreeXUI('http://localhost:2053', 'admin', 'admin', {
            loginRetryBackoff: 0
        });

        await expect(client.login()).rejects.toThrow(
            /modern:.*Request failed with status code 404.*legacy:.*Request failed with status code 403 \(invalid credentials\)/s
        );

        await client.sessionManager.store.clear();
    });
});
