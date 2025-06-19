const axios = require('axios');

/**
 * 3X-UI API Client Library
 *
 * A Node.js client for managing 3x-ui panel APIs with automatic session management.
 * This library is designed for server-side use only due to security requirements.
 *
 * @class ThreeXUI
 * @version 1.0.0
 * @author Helitha Guruge
 */
class ThreeXUI {
    /**
     * Creates a new ThreeXUI client instance
     *
     * @param {string} baseURL - The base URL of your 3x-ui server (e.g., 'https://your-server.com')
     * @param {string} username - Admin username for authentication
     * @param {string} password - Admin password for authentication
     * @throws {Error} If baseURL, username, or password is missing
     */
    constructor(baseURL, username, password) {
        if (!baseURL) {
            throw new Error('baseURL is required');
        }
        if (!username) {
            throw new Error('username is required');
        }
        if (!password) {
            throw new Error('password is required');
        }

        this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
        this.username = username;
        this.password = password;
        this.cookie = null;

        // Create axios instance with security best practices
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 30000, // 30 second timeout
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 300,
            headers: {
                'User-Agent': '3xui-api-client/1.0.0',
                'Accept': 'application/json',
                'Connection': 'keep-alive'
            }
        });

        // Add request interceptor for security headers
        this.api.interceptors.request.use((config) => {
            // Add security headers
            config.headers['X-Requested-With'] = 'XMLHttpRequest';
            return config;
        });

        // Add response interceptor for error handling
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Request timeout - server took too long to respond');
                }
                if (error.code === 'ENOTFOUND') {
                    throw new Error(`Cannot connect to server: ${this.baseURL}`);
                }
                throw error;
            }
        );
    }

    async login() {
        try {
            const params = new URLSearchParams();
            params.append('username', this.username);
            params.append('password', this.password);

            const response = await this.api.post('/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data.success) {
                const cookies = response.headers['set-cookie'];
                if (cookies && cookies.length > 0) {
                    this.cookie = cookies[0].split(';')[0];
                    this.api.defaults.headers.Cookie = this.cookie;
                } else {
                    throw new Error('Login failed: No session cookie received.');
                }
                return {
                    success: true,
                    headers: response.headers,
                    data: response.data
                };
            } else {
                throw new Error(`Login failed: ${response.data.msg}`);
            }
        } catch (error) {
            let errorMessage = `Login failed: ${error.message}`;
            if (error.response) {
                errorMessage = `Login failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`;
            }
            throw new Error(errorMessage);
        }
    }

    async _request(method, path, data = {}) {
        if (!this.cookie) {
            await this.login();
        }
        try {
            const response = await this.api.request({
                method,
                url: path,
                data,
                ...(method.toLowerCase() === 'post' ? { headers: { 'Content-Type': 'application/json' } } : {})
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                // Cookie might have expired, try to login again
                await this.login();
                const response = await this.api.request({
                    method,
                    url: path,
                    data,
                    ...(method.toLowerCase() === 'post' ? { headers: { 'Content-Type': 'application/json' } } : {})
                });
                return response.data;
            }
            throw error;
        }
    }

    // Inbounds
    getInbounds() {
        return this._request('get', '/panel/api/inbounds/list');
    }

    getInbound(id) {
        return this._request('get', `/panel/api/inbounds/get/${id}`);
    }

    addInbound(inboundConfig) {
        return this._request('post', '/panel/api/inbounds/add', inboundConfig);
    }

    deleteInbound(id) {
        return this._request('post', `/panel/api/inbounds/del/${id}`);
    }

    updateInbound(id, inboundConfig) {
        return this._request('post', `/panel/api/inbounds/update/${id}`, inboundConfig);
    }

    // Clients
    addClient(clientConfig) {
        return this._request('post', '/panel/api/inbounds/addClient', clientConfig);
    }

    deleteClient(inboundId, clientId) {
        return this._request('post', `/panel/api/inbounds/${inboundId}/delClient/${clientId}`);
    }

    updateClient(clientId, clientConfig) {
        return this._request('post', `/panel/api/inbounds/updateClient/${clientId}`, clientConfig);
    }

    getClientTrafficsByEmail(email) {
        return this._request('get', `/panel/api/inbounds/getClientTraffics/${email}`);
    }

    getClientTrafficsById(id) {
        return this._request('get', `/panel/api/inbounds/getClientTrafficsById/${id}`);
    }

    getClientIps(email) {
        return this._request('post', `/panel/api/inbounds/clientIps/${email}`);
    }

    clearClientIps(email) {
        return this._request('post', `/panel/api/inbounds/clearClientIps/${email}`);
    }

    // Traffic
    resetClientTraffic(inboundId, email) {
        return this._request('post', `/panel/api/inbounds/${inboundId}/resetClientTraffic/${email}`);
    }

    resetAllTraffics() {
        return this._request('post', '/panel/api/inbounds/resetAllTraffics');
    }

    resetAllClientTraffics(inboundId) {
        return this._request('post', `/panel/api/inbounds/resetAllClientTraffics/${inboundId}`);
    }

    deleteDepletedClients(inboundId) {
        return this._request('post', `/panel/api/inbounds/delDepletedClients/${inboundId}`);
    }

    // System
    getOnlineClients() {
        return this._request('post', '/panel/api/inbounds/onlines');
    }

    createBackup() {
        return this._request('get', '/panel/api/inbounds/createbackup');
    }
}

module.exports = ThreeXUI;