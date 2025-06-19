const ThreeXUI = require('../../index.js');

describe('ThreeXUI Constructor', () => {
    test('should create instance with valid parameters', () => {
        const client = new ThreeXUI('https://example.com', 'user', 'pass');
        expect(client).toBeInstanceOf(ThreeXUI);
        expect(client.baseURL).toBe('https://example.com');
        expect(client.username).toBe('user');
        expect(client.password).toBe('pass');
    });

    test('should remove trailing slash from baseURL', () => {
        const client = new ThreeXUI('https://example.com/', 'user', 'pass');
        expect(client.baseURL).toBe('https://example.com');
    });

    test('should throw error if baseURL is missing', () => {
        expect(() => {
            new ThreeXUI(null, 'user', 'pass');
        }).toThrow('baseURL is required');
    });

    test('should throw error if username is missing', () => {
        expect(() => {
            new ThreeXUI('https://example.com', null, 'pass');
        }).toThrow('username is required');
    });

    test('should throw error if password is missing', () => {
        expect(() => {
            new ThreeXUI('https://example.com', 'user', null);
        }).toThrow('password is required');
    });

    test('should configure axios instance with security headers', () => {
        const client = new ThreeXUI('https://example.com', 'user', 'pass');
        
        expect(client.api.defaults.timeout).toBe(30000);
        expect(client.api.defaults.maxRedirects).toBe(5);
        expect(client.api.defaults.headers['User-Agent']).toBe('3xui-api-client/1.0.0');
        expect(client.api.defaults.headers['Accept']).toBe('application/json');
        expect(client.api.defaults.headers['Connection']).toBe('keep-alive');
    });
});

describe('ThreeXUI API Methods', () => {
    let client;

    beforeEach(() => {
        client = new ThreeXUI('https://example.com', 'user', 'pass');
    });

    test('should have all required inbound management methods', () => {
        expect(typeof client.getInbounds).toBe('function');
        expect(typeof client.getInbound).toBe('function');
        expect(typeof client.addInbound).toBe('function');
        expect(typeof client.updateInbound).toBe('function');
        expect(typeof client.deleteInbound).toBe('function');
    });

    test('should have all required client management methods', () => {
        expect(typeof client.addClient).toBe('function');
        expect(typeof client.updateClient).toBe('function');
        expect(typeof client.deleteClient).toBe('function');
        expect(typeof client.getClientTrafficsByEmail).toBe('function');
        expect(typeof client.getClientTrafficsById).toBe('function');
        expect(typeof client.getClientIps).toBe('function');
        expect(typeof client.clearClientIps).toBe('function');
    });

    test('should have all required traffic management methods', () => {
        expect(typeof client.resetClientTraffic).toBe('function');
        expect(typeof client.resetAllTraffics).toBe('function');
        expect(typeof client.resetAllClientTraffics).toBe('function');
        expect(typeof client.deleteDepletedClients).toBe('function');
    });

    test('should have all required system operation methods', () => {
        expect(typeof client.getOnlineClients).toBe('function');
        expect(typeof client.createBackup).toBe('function');
    });

    test('should have login method', () => {
        expect(typeof client.login).toBe('function');
    });
});

describe('ThreeXUI Module Export', () => {
    test('should export ThreeXUI class as default', () => {
        expect(ThreeXUI).toBeDefined();
        expect(typeof ThreeXUI).toBe('function');
        expect(ThreeXUI.prototype.constructor).toBe(ThreeXUI);
    });
});

describe('API Coverage Validation', () => {
    test('should implement all 19 documented API routes', () => {
        const client = new ThreeXUI('https://example.com', 'user', 'pass');
        
        const expectedMethods = [
            // Authentication (1)
            'login',
            // Inbound Management (5)
            'getInbounds', 'getInbound', 'addInbound', 'updateInbound', 'deleteInbound',
            // Client Management (7)
            'addClient', 'updateClient', 'deleteClient', 'getClientTrafficsByEmail', 
            'getClientTrafficsById', 'getClientIps', 'clearClientIps',
            // Traffic Management (4)
            'resetClientTraffic', 'resetAllTraffics', 'resetAllClientTraffics', 'deleteDepletedClients',
            // System Operations (2)
            'getOnlineClients', 'createBackup'
        ];

        expectedMethods.forEach(method => {
            expect(typeof client[method]).toBe('function');
        });

        expect(expectedMethods).toHaveLength(19);
    });
}); 