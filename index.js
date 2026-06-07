const axios = require('axios');
const CredentialGenerator = require('./src/generators/CredentialGenerator');
const { SessionManager, createSessionManager } = require('./src/session/SessionManager');
const {
    InputValidator,
    SecurityMonitor,
    SecureHeaders,
    CredentialSecurity,
    ErrorSecurity
} = require('./src/security/SecurityEnhancer');

/**
 * 3X-UI API Client Library
 *
 * A Node.js client for managing 3x-ui panel APIs with automatic session management.
 * Now includes credential generation and advanced session management for web applications.
 *
 * @class ThreeXUI
 * @version 2.0.0
 * @author Helitha Guruge
 */
class ThreeXUI {
    /**
     * Creates a new ThreeXUI client instance
     *
     * @param {string} baseURL - The base URL of your 3x-ui server (e.g., 'https://your-server.com')
     * @param {string} username - Admin username for authentication
     * @param {string} password - Admin password for authentication
     * @param {Object} options - Configuration options
     * @param {Object} options.sessionManager - Session management configuration
     * @param {boolean} options.autoGenerateCredentials - Enable automatic credential generation
     * @param {number} options.timeout - Request timeout in milliseconds (default: 30000)
     * @throws {Error} If baseURL, username, or password is missing
     */
    constructor(baseURL, usernameOrOptions, password, options = {}) {
        if (!baseURL) {
            throw new Error('baseURL is required');
        }

        // Apply security validations
        this.baseURL = InputValidator.validateURL(baseURL);

        // Warning for common configuration error
        if (this.baseURL.endsWith('/panel') || this.baseURL.endsWith('/panel/')) {
            console.warn('WARNING: baseURL should NOT end with "/panel". The library appends this automatically. Please remove it from your configuration.');
            // Auto-fix for better user experience
            this.baseURL = this.baseURL.replace(/\/panel\/?$/, '');
        }

        // Object containing configs as 2nd parameter
        if (typeof usernameOrOptions === 'object' && usernameOrOptions !== null) {
            options = usernameOrOptions;
            this.username = options.username;
            this.password = options.password;
        } else {
            this.username = usernameOrOptions;
            this.password = password;
        }

        this.token = options.token || options.apiToken || null;

        if (this.token) {
            this.username = this.username || 'token-auth'; // prevent missing args error
            this.password = this.password || 'token-auth';
        } else {
            if (!this.username) {
                throw new Error('username is required');
            }
            if (!this.password) {
                throw new Error('password is required');
            }
            this.username = InputValidator.validateUsername(this.username);
            this.password = InputValidator.validatePassword(this.password);
        }

        this.cookie = null;
        this.options = options;
        this.loginMutex = false; // Add mutex to prevent concurrent logins
        this.loginRetryCount = 0; // Add retry counter
        this.maxLoginRetries = 3; // Maximum login attempts

        // Initialize security monitoring
        this.securityMonitor = new SecurityMonitor({
            maxRequestsPerMinute: options.maxRequestsPerMinute || 60,
            maxLoginAttemptsPerHour: options.maxLoginAttemptsPerHour || 10
        });

        // Security configuration
        this.isDevelopment = options.isDevelopment || process.env.NODE_ENV === 'development';

        // Initialize session manager if provided
        if (options.sessionManager) {
            this.sessionManager = options.sessionManager instanceof SessionManager
                ? options.sessionManager
                : createSessionManager(options.sessionManager);
        } else {
            // Default to memory-based session management
            this.sessionManager = createSessionManager();
        }

        // Create axios instance with security best practices
        const secureHeaders = SecureHeaders.getSecureHeaders({
            userAgent: options.userAgent || '3xui-api-client/2.0.0 (Security-Enhanced)',
            enableCSP: options.enableCSP || false
        });

        if (this.token) {
            secureHeaders['Authorization'] = `Bearer ${this.token}`;
        }

        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: options.timeout || 30000, // 30 second timeout
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 300,
            headers: secureHeaders
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

    /**
     * Login with session management support
     * @param {boolean} forceRefresh - Force a new login even if session exists
     * @returns {Object} Login response
     */
    async login(forceRefresh = false) {
        // If API token is configured, skip cookie auth
        if (this.token) {
            return {
                success: true,
                message: 'Authenticated successfully using API Token'
            };
        }

        // Check rate limiting first
        const identifier = CredentialSecurity.hashForLogging(this.username);
        if (!this.securityMonitor.checkRateLimit(identifier, 'login')) {
            const error = new Error('Rate limit exceeded for login attempts');
            ErrorSecurity.logError(error, { username: this.username, baseURL: this.baseURL });
            throw error;
        }

        // Increment retry count
        this.loginRetryCount++;
        // Check for existing valid session first
        if (!forceRefresh && this.sessionManager) {
            const existingSession = await this.sessionManager.getSession(this.baseURL, this.username);
            if (existingSession && existingSession.cookie) {
                this.cookie = existingSession.cookie;
                this.api.defaults.headers.Cookie = this.cookie;
                // Reset retry count on successful session restore
                this.loginRetryCount = 0;
                return {
                    success: true,
                    fromCache: true,
                    data: { msg: 'Session restored from cache' }
                };
            }
        }

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

                    // Store session if session manager is available
                    if (this.sessionManager) {
                        try {
                            await this.sessionManager.storeSession(this.baseURL, this.username, {
                                cookie: this.cookie,
                                loginTime: new Date().toISOString()
                            });
                        } catch (sessionError) {
                            console.warn('Failed to store session, continuing without cache:', sessionError.message);
                        }
                    }
                    // Reset retry count on successful login
                    this.loginRetryCount = 0;
                } else {
                    throw new Error('Login failed: No session cookie received.');
                }
                return {
                    success: true,
                    fromCache: false,
                    cookie: this.cookie, // Explicitly return the cookie
                    headers: response.headers,
                    data: response.data
                };
            } else {
                throw new Error(`Login failed: ${response.data.msg}`);
            }
        } catch (error) {
            // Log the error securely
            ErrorSecurity.logError(error, {
                username: this.username,
                baseURL: this.baseURL,
                action: 'login'
            });

            // Log suspicious activity for multiple failed logins
            if (this.loginRetryCount >= this.maxLoginRetries) {
                this.securityMonitor.logSuspiciousActivity('multiple_failed_logins', {
                    username: CredentialSecurity.hashForLogging(this.username),
                    attempts: this.loginRetryCount
                });
            }

            // Return sanitized error
            const sanitizedError = ErrorSecurity.sanitizeError(error, this.isDevelopment);
            throw sanitizedError;
        }
    }

    /**
     * Logout and clear session
     */
    async logout() {
        try {
            await this._request('get', '/logout');
        } catch {
            // Ignore server-side logout errors, proceed to clear local session
        }

        this.cookie = null;
        delete this.api.defaults.headers.Cookie;

        if (this.sessionManager) {
            await this.sessionManager.deleteSession(this.baseURL, this.username);
        }
    }

    /**
     * Check if Two-Factor Authentication is enabled
     * @returns {Promise<Object>} 2FA status
     */
    getTwoFactorEnable() {
        return this._request('post', '/getTwoFactorEnable');
    }

    async _request(method, path, data = {}) {
        // Check session validity first with mutex protection if token is not provided
        if (!this.token) {
            if (!this.loginMutex && this.sessionManager && !await this.sessionManager.hasValidSession(this.baseURL, this.username)) {
                await this._ensureAuthenticated();
            } else if (!this.loginMutex && !this.cookie) {
                await this._ensureAuthenticated();
            }
        }

        try {
            const response = await this.api.request({
                method,
                url: path,
                data,
                ...(method.toLowerCase() === 'post' ? { headers: { 'Content-Type': 'application/json' } } : {})
            });
            // Reset retry counter on successful request
            this.loginRetryCount = 0;
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                if (this.token) {
                    throw new Error('API Token is invalid or expired. Please check your credentials.');
                }
                // Cookie might have expired, try to login again with retry limit
                if (this.loginRetryCount < this.maxLoginRetries) {
                    await this._ensureAuthenticated(true); // Force refresh
                    const response = await this.api.request({
                        method,
                        url: path,
                        data,
                        ...(method.toLowerCase() === 'post' ? { headers: { 'Content-Type': 'application/json' } } : {})
                    });
                    return response.data;
                } else {
                    throw new Error('Maximum login retry attempts exceeded. Check your credentials.');
                }
            }
            throw error;
        }
    }

    /**
     * Ensure authentication with mutex protection
     * @param {boolean} forceRefresh - Force a new login
     */
    async _ensureAuthenticated(forceRefresh = false) {
        // Prevent concurrent login attempts
        if (this.loginMutex) {
            // Wait for ongoing login to complete
            while (this.loginMutex) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        this.loginMutex = true;
        try {
            await this.login(forceRefresh);
        } finally {
            this.loginMutex = false;
        }
    }

    // ===========================================
    // CREDENTIAL GENERATION METHODS
    // ===========================================

    /**
     * Generate credentials for a specific protocol
     * @param {string} protocol - Protocol name (vless, vmess, trojan, etc.)
     * @param {Object} options - Generation options
     * @returns {Object} Generated credentials
     */
    generateCredentials(protocol, options = {}) {
        return CredentialGenerator.generateForProtocol(protocol, options);
    }

    /**
     * Generate UUID for VLESS/VMess protocols
     * @param {boolean} secure - Use cryptographically secure generation
     * @returns {string} UUID
     */
    generateUUID(secure = true) {
        return secure ? CredentialGenerator.generateSecureUUID() : CredentialGenerator.generateUUID();
    }

    /**
     * Generate password for Trojan/Shadowsocks protocols
     * @param {number} length - Password length
     * @param {Object} options - Password options
     * @returns {string} Generated password
     */
    generatePassword(length = 16, options = {}) {
        return CredentialGenerator.generatePassword(length, options);
    }

    /**
     * Generate bulk credentials for multiple clients
     * @param {string} protocol - Protocol name
     * @param {number} count - Number of credentials to generate
     * @param {Object} options - Generation options
     * @returns {Array} Array of credentials
     */
    generateBulkCredentials(protocol, count, options = {}) {
        return CredentialGenerator.generateBulk(protocol, count, options);
    }

    /**
     * Get available cipher methods for Shadowsocks
     * @returns {Array} Array of cipher methods
     */
    getShadowsocksCiphers() {
        return CredentialGenerator.getShadowsocksCipherMethods();
    }

    /**
     * Get recommended cipher for Shadowsocks
     * @returns {string} Recommended cipher
     */
    getRecommendedShadowsocksCipher() {
        return CredentialGenerator.getRecommendedShadowsocksCipher();
    }

    /**
     * Generate WireGuard key pair
     * @returns {Object} Key pair with helper methods
     */
    generateWireGuardKeys() {
        return CredentialGenerator.generateWireGuardKeys();
    }

    /**
     * Generate Reality key pair for anti-censorship
     * @returns {Object} Reality key pair with helper methods
     */
    generateRealityKeys() {
        return CredentialGenerator.generateRealityKeys();
    }

    /**
     * Generate random port number
     * @param {number} min - Minimum port
     * @param {number} max - Maximum port
     * @returns {number} Random port
     */
    generatePort(min = 10000, max = 65535) {
        return CredentialGenerator.generatePort(min, max);
    }

    /**
     * Validate generated credentials
     * @param {Object} credentials - Credentials to validate
     * @param {string} protocol - Protocol name
     * @returns {Object} Validation result
     */
    validateCredentials(credentials, protocol) {
        return CredentialGenerator.validateCredentials(credentials, protocol);
    }

    // ===========================================
    // ENHANCED CLIENT MANAGEMENT WITH AUTO-GENERATION
    // ===========================================

    /**
     * Add client with automatic credential generation
     * @param {number} inboundId - Inbound ID
     * @param {string} protocol - Protocol type
     * @param {Object} options - Client options
     * @returns {Object} Created client with credentials
     */
    async addClientWithCredentials(inboundId, protocol, options = {}) {
        const credentials = this.generateCredentials(protocol, options);

        const clientConfig = {
            id: inboundId,
            settings: JSON.stringify({
                clients: [{
                    ...credentials,
                    enable: true,
                    expiryTime: options.expiryTime || 0,
                    limitIp: options.limitIp || 0,
                    totalGB: options.totalGB || 0,
                    subId: options.subId || this.generateUUID()
                }]
            })
        };

        const result = await this.addClient(clientConfig);
        return {
            ...result,
            credentials,
            protocol
        };
    }

    /**
     * Update client with automatic credential management
     * @param {string} clientId - Client UUID/ID
     * @param {number} inboundId - Inbound ID
     * @param {Object} options - Update options
     * @returns {Object} Update result
     */
    async updateClientWithCredentials(clientId, inboundId, options = {}) {
        try {
            // First, get the current inbound to obtain all existing clients
            const inboundData = await this.getInbound(inboundId);

            if (!inboundData.success || !inboundData.obj) {
                throw new Error(`Failed to get inbound ${inboundId} for client update`);
            }

            // Parse existing settings to get all clients
            const currentSettings = JSON.parse(inboundData.obj.settings);
            const existingClients = currentSettings.clients || [];

            // Find the client to update
            const clientIndex = existingClients.findIndex(client => client.id === clientId);
            if (clientIndex === -1) {
                throw new Error(`Client with ID ${clientId} not found in inbound ${inboundId}`);
            }

            // Convert user-friendly options to API format
            const processedOptions = {
                email: options.email || existingClients[clientIndex].email,
                limitIp: options.limitIp !== undefined ? options.limitIp : existingClients[clientIndex].limitIp,
                // totalGB is specified in gigabytes in 3x-ui config; do not convert to bytes
                totalGB: options.totalGB !== undefined ? options.totalGB : existingClients[clientIndex].totalGB,
                expiryTime: options.expiryDays ? Date.now() + (options.expiryDays * 24 * 60 * 60 * 1000) : existingClients[clientIndex].expiryTime,
                enable: options.enable !== undefined ? options.enable : existingClients[clientIndex].enable,
                flow: options.flow || existingClients[clientIndex].flow,
                encryption: options.encryption || existingClients[clientIndex].encryption || 'none',
                subId: options.subId || existingClients[clientIndex].subId
            };

            // Update the specific client while preserving others
            existingClients[clientIndex] = {
                ...existingClients[clientIndex],
                ...processedOptions
            };

            // Prepare the complete settings with all clients
            const updatedSettings = {
                ...currentSettings,
                clients: existingClients
            };

            const clientConfig = {
                id: inboundId,
                settings: JSON.stringify(updatedSettings)
            };

            const result = await this.updateClient(clientId, clientConfig);
            return {
                ...result,
                updatedOptions: processedOptions,
                conversions: {
                    totalGB: options.totalGB !== undefined ? `${options.totalGB}GB` : 'unchanged',
                    expiryDays: options.expiryDays ? `${options.expiryDays} days → ${new Date(processedOptions.expiryTime).toISOString()}` : 'unchanged'
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error.message,
                details: 'updateClientWithCredentials failed - check client ID and inbound ID'
            };
        }
    }

    // ===========================================
    // SESSION MANAGEMENT METHODS
    // ===========================================

    /**
     * Get session statistics
     * @returns {Object} Session statistics
     */
    async getSessionStats() {
        if (this.sessionManager) {
            return await this.sessionManager.getStats();
        }
        return { message: 'Session manager not initialized' };
    }

    /**
     * Clear all cached sessions
     */
    async clearAllSessions() {
        if (this.sessionManager) {
            await this.sessionManager.clearAllSessions();
        }
    }

    /**
     * Check if current session is valid
     * @returns {boolean} Session validity
     */
    async isSessionValid() {
        if (this.token) {
            return true;
        }
        if (this.sessionManager) {
            return await this.sessionManager.hasValidSession(this.baseURL, this.username);
        }
        return !!this.cookie;
    }

    // ===========================================
    // MODERN API METHODS (3X-UI >= 2.x)
    // ===========================================

    // --- Clients ---

    /**
     * Get list of all clients
     * @returns {Promise<Object>} Formatted list of all clients
     */
    getClients() {
        return this._request('get', '/panel/api/clients/list');
    }

    /**
     * Get paginated list of clients
     * @param {Object} params - Pagination parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.size - Items per page (default: 10)
     * @param {string} params.sort - Sort field (e.g., 'email', 'expireTime')
     * @param {string} params.order - Sort order ('asc' or 'desc')
     * @param {string} params.email - Filter by email
     * @returns {Promise<Object>} Paginated clients
     */
    getPagedClients(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) {
            queryParams.append('page', params.page);
        }
        if (params.size !== undefined) {
            queryParams.append('size', params.size);
        }
        if (params.sort !== undefined) {
            queryParams.append('sort', params.sort);
        }
        if (params.order !== undefined) {
            queryParams.append('order', params.order);
        }
        if (params.email !== undefined) {
            queryParams.append('email', params.email);
        }

        const queryString = queryParams.toString();
        const url = queryString ? `/panel/api/clients/list/paged?${queryString}` : '/panel/api/clients/list/paged';

        return this._request('get', url);
    }

    /**
     * Get client by email
     * @param {string} email - Exact client email address
     * @returns {Promise<Object>} Client metadata
     */
    getClient(email) {
        return this._request('get', `/panel/api/clients/get/${encodeURIComponent(email)}`);
    }

    /**
     * Get client traffic by email
     * @param {string} email - Exact client email
     * @returns {Promise<Object>} Client traffic details
     */
    getClientTraffic(email) {
        return this._request('get', `/panel/api/clients/traffic/${encodeURIComponent(email)}`);
    }

    /**
     * Get subscription links for a client by subscription ID
     * @param {string} subId - Subscription ID (UUID)
     * @returns {Promise<Object>} Subscription details and links
     */
    getSubLinks(subId) {
        return this._request('get', `/panel/api/clients/subLinks/${encodeURIComponent(subId)}`);
    }

    /**
     * Get generic client links by email
     * @param {string} email - Exact client email
     * @returns {Promise<Object>} Link strings
     */
    getClientLinks(email) {
        return this._request('get', `/panel/api/clients/links/${encodeURIComponent(email)}`);
    }

    /**
     * Add a new client via Modern API
     * @param {Object} data - Client payload
     * @returns {Promise<Object>} Addition response
     */
    addModernClient(data) {
        return this._request('post', '/panel/api/clients/add', data);
    }

    /**
     * Update client by email via Modern API
     * @param {string} email - Exact client email
     * @param {Object} data - Update payload
     * @returns {Promise<Object>} Update response
     */
    updateModernClient(email, data) {
        return this._request('post', `/panel/api/clients/update/${encodeURIComponent(email)}`, data);
    }

    /**
     * Delete client by email via Modern API
     * @param {string} email - Exact client email
     * @returns {Promise<Object>} Delete response
     */
    deleteModernClient(email) {
        return this._request('post', `/panel/api/clients/del/${encodeURIComponent(email)}`);
    }

    attachClientToInbounds(email, data) {
        return this._request('post', `/panel/api/clients/${encodeURIComponent(email)}/attach`, data);
    }

    detachClientFromInbounds(email, data) {
        return this._request('post', `/panel/api/clients/${encodeURIComponent(email)}/detach`, data);
    }

    resetAllModernClientTraffics() {
        return this._request('post', '/panel/api/clients/resetAllTraffics');
    }

    deleteDepletedModernClients() {
        return this._request('post', '/panel/api/clients/delDepleted');
    }

    bulkAdjustModernClients(data) {
        return this._request('post', '/panel/api/clients/bulkAdjust', data);
    }

    bulkDeleteModernClients(data) {
        return this._request('post', '/panel/api/clients/bulkDel', data);
    }

    bulkCreateModernClients(data) {
        return this._request('post', '/panel/api/clients/bulkCreate', data);
    }

    bulkAttachModernClients(data) {
        return this._request('post', '/panel/api/clients/bulkAttach', data);
    }

    bulkDetachModernClients(data) {
        return this._request('post', '/panel/api/clients/bulkDetach', data);
    }

    bulkResetTrafficModernClients(data) {
        return this._request('post', '/panel/api/clients/bulkResetTraffic', data);
    }

    resetModernClientTrafficByEmail(email) {
        return this._request('post', `/panel/api/clients/resetTraffic/${encodeURIComponent(email)}`);
    }

    updateModernClientTrafficByEmail(email, data) {
        return this._request('post', `/panel/api/clients/updateTraffic/${encodeURIComponent(email)}`, data);
    }

    getModernClientIps(email) {
        return this._request('post', `/panel/api/clients/ips/${encodeURIComponent(email)}`);
    }

    clearModernClientIps(email) {
        return this._request('post', `/panel/api/clients/clearIps/${encodeURIComponent(email)}`);
    }

    getOnlines() {
        return this._request('post', '/panel/api/clients/onlines');
    }

    getModernLastOnline() {
        return this._request('post', '/panel/api/clients/lastOnline');
    }

    // --- Client Groups ---

    /**
     * Get list of all client groups
     * @returns {Promise<Object>} List of client groups
     */
    getGroups() {
        return this._request('get', '/panel/api/clients/groups');
    }

    /**
     * Get list of emails belonging to a specific group
     * @param {string} groupName - The name of the group
     * @returns {Promise<Object>} List of emails in the group
     */
    getGroupEmails(groupName) {
        return this._request('get', `/panel/api/clients/groups/${encodeURIComponent(groupName)}/emails`);
    }

    createGroup(data) {
        return this._request('post', '/panel/api/clients/groups/create', data);
    }

    renameGroup(data) {
        return this._request('post', '/panel/api/clients/groups/rename', data);
    }

    deleteGroup(data) {
        return this._request('post', '/panel/api/clients/groups/delete', data);
    }

    bulkAddGroups(data) {
        return this._request('post', '/panel/api/clients/groups/bulkAdd', data);
    }

    bulkRemoveGroups(data) {
        return this._request('post', '/panel/api/clients/groups/bulkRemove', data);
    }

    // --- Nodes ---

    /**
     * Get list of all nodes
     * @returns {Promise<Object>} List of nodes
     */
    getNodes() {
        return this._request('get', '/panel/api/nodes/list');
    }

    /**
     * Get specific node by ID
     * @param {number|string} id - Node ID
     * @returns {Promise<Object>} Node details
     */
    getNode(id) {
        return this._request('get', `/panel/api/nodes/get/${encodeURIComponent(id)}`);
    }

    /**
     * Get history metrics for a node
     * @param {number|string} id - Node ID
     * @param {string} metric - Metric name (e.g., 'cpu', 'memory')
     * @param {string} bucket - Time bucket size
     * @returns {Promise<Object>} Node history data
     */
    getNodeHistory(id, metric, bucket) {
        return this._request('get', `/panel/api/nodes/history/${encodeURIComponent(id)}/${encodeURIComponent(metric)}/${encodeURIComponent(bucket)}`);
    }

    addNode(data) {
        return this._request('post', '/panel/api/nodes/add', data);
    }

    updateNode(id, data) {
        return this._request('post', `/panel/api/nodes/update/${encodeURIComponent(id)}`, data);
    }

    deleteNode(id) {
        return this._request('post', `/panel/api/nodes/del/${encodeURIComponent(id)}`);
    }

    setNodeEnable(id) {
        return this._request('post', `/panel/api/nodes/setEnable/${encodeURIComponent(id)}`);
    }

    testNode(data) {
        return this._request('post', '/panel/api/nodes/test', data);
    }

    probeNode(id) {
        return this._request('post', `/panel/api/nodes/probe/${encodeURIComponent(id)}`);
    }

    // --- Custom Geo ---

    /**
     * Get list of custom geo sites/ips
     * @returns {Promise<Object>} List of custom geos
     */
    getCustomGeos() {
        return this._request('get', '/panel/api/custom-geo/list');
    }

    /**
     * Get aliases for custom geos
     * @returns {Promise<Object>} Custom geo aliases
     */
    getGeoAliases() {
        return this._request('get', '/panel/api/custom-geo/aliases');
    }

    addCustomGeo(data) {
        return this._request('post', '/panel/api/custom-geo/add', data);
    }

    updateCustomGeo(id, data) {
        return this._request('post', `/panel/api/custom-geo/update/${encodeURIComponent(id)}`, data);
    }

    deleteCustomGeo(id) {
        return this._request('post', `/panel/api/custom-geo/delete/${encodeURIComponent(id)}`);
    }

    downloadCustomGeo(id) {
        return this._request('post', `/panel/api/custom-geo/download/${encodeURIComponent(id)}`);
    }

    updateAllCustomGeo() {
        return this._request('post', '/panel/api/custom-geo/update-all');
    }

    // ===========================================
    // ORIGINAL API METHODS (UNCHANGED)
    // ===========================================

    // Inbounds
    getInbounds() {
        return this._request('get', '/panel/api/inbounds/list');
    }

    getInbound(id) {
        return this._request('get', `/panel/api/inbounds/get/${id}`);
    }

    addInbound(inboundConfig) {
        // Validate inbound configuration for security
        const validatedConfig = InputValidator.validateInboundConfig(inboundConfig);
        return this._request('post', '/panel/api/inbounds/add', validatedConfig);
    }

    deleteInbound(id) {
        return this._request('post', `/panel/api/inbounds/del/${id}`);
    }

    updateInbound(id, inboundConfig) {
        // Validate inbound configuration for security
        const validatedConfig = InputValidator.validateInboundConfig(inboundConfig);
        return this._request('post', `/panel/api/inbounds/update/${id}`, validatedConfig);
    }

    /**
     * Import inbounds
     * @param {Array} inbounds - Array of inbound configurations
     */
    importInbounds(inbounds) {
        return this._request('post', '/panel/api/inbounds/import', { inbounds });
    }

    /**
     * Get last online time for clients
     */
    getLastOnline() {
        return this._request('post', '/panel/api/inbounds/lastOnline');
    }

    // Clients
    addClient(clientConfig) {
        // Validate client configuration for security
        const validatedConfig = InputValidator.validateClientConfig(clientConfig);
        return this._request('post', '/panel/api/inbounds/addClient', validatedConfig);
    }

    deleteClient(inboundId, clientId) {
        return this._request('post', `/panel/api/inbounds/${inboundId}/delClient/${clientId}`);
    }

    updateClient(clientId, clientConfig) {
        // Validate client configuration for security
        const validatedConfig = InputValidator.validateClientConfig(clientConfig);
        return this._request('post', `/panel/api/inbounds/updateClient/${clientId}`, validatedConfig);
    }

    /**
     * Update client traffic limit and expiry by email
     * @param {string} email - Client email
     * @param {Object} trafficConfig - Traffic configuration (totalGB, expiryTime)
     */
    updateClientTraffic(email, trafficConfig) {
        return this._request('post', `/panel/api/inbounds/updateClientTraffic/${email}`, trafficConfig);
    }

    /**
     * Delete client by email
     * @param {number} inboundId - Inbound ID
     * @param {string} email - Client email
     */
    deleteClientByEmail(inboundId, email) {
        return this._request('post', `/panel/api/inbounds/${inboundId}/delClientByEmail/${email}`);
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

    /**
     * Trigger sending a backup to Telegram bot admins
     */
    backupToTgBot() {
        return this._request('post', '/panel/api/backuptotgbot');
    }

    // ===========================================
    // SERVER MANAGEMENT
    // ===========================================

    /**
     * Get server status (CPU, RAM, etc.)
     */
    getServerStatus() {
        return this._request('get', '/panel/api/server/status');
    }

    /**
     * Get CPU usage history
     * @param {string} bucket - Time bucket (e.g., 'min', 'hour')
     */
    getCPUHistory(bucket = 'min') {
        return this._request('get', `/panel/api/server/cpuHistory/${bucket}`);
    }

    /**
     * Get current Xray version
     */
    getXrayVersion() {
        return this._request('get', '/panel/api/server/getXrayVersion');
    }

    /**
     * Get Xray config as JSON
     */
    getConfigJson() {
        return this._request('get', '/panel/api/server/getConfigJson');
    }

    /**
     * Download database
     */
    getDb() {
        return this._request('get', '/panel/api/server/getDb');
    }

    /**
     * Stop Xray core service
     */
    stopXrayService() {
        return this._request('post', '/panel/api/server/stopXrayService');
    }

    /**
     * Restart Xray core service
     */
    restartXrayService() {
        return this._request('post', '/panel/api/server/restartXrayService');
    }

    /**
     * Install specific Xray version
     * @param {string} version - Version to install
     */
    installXray(version) {
        return this._request('post', `/panel/api/server/installXray/${version}`);
    }

    /**
     * Get panel logs
     * @param {number} count - Number of logs to retrieve
     */
    getPanelLogs(count = 100) {
        return this._request('post', `/panel/api/server/logs/${count}`);
    }

    /**
     * Get Xray logs
     * @param {number} count - Number of logs to retrieve
     */
    getXrayLogs(count = 100) {
        return this._request('post', `/panel/api/server/xraylogs/${count}`);
    }

    /**
     * Update GeoIP/GeoSite files
     * @param {string} [fileName] - Specific file to update (optional)
     */
    updateGeofile(fileName) {
        const url = fileName
            ? `/panel/api/server/updateGeofile/${fileName}`
            : '/panel/api/server/updateGeofile';
        return this._request('post', url);
    }

    /**
     * Import database
     * @param {FormData} formData - FormData containing the database file
     */
    async importDB(formData) {
        // Ensure authenticated before direct API call
        if (!this.cookie) {
            await this._ensureAuthenticated();
        }
        // Use direct api call to handle multipart/form-data correctly
        return this.api.post('/panel/api/server/importDB', formData);
    }

    // ===========================================
    // SERVER-SIDE GENERATORS
    // ===========================================

    getNewUUID() {
        return this._request('get', '/panel/api/server/getNewUUID');
    }

    getNewX25519Cert() {
        return this._request('get', '/panel/api/server/getNewX25519Cert');
    }

    getNewmldsa65() {
        return this._request('get', '/panel/api/server/getNewmldsa65');
    }

    getNewmlkem768() {
        return this._request('get', '/panel/api/server/getNewmlkem768');
    }

    getNewVlessEnc() {
        return this._request('get', '/panel/api/server/getNewVlessEnc');
    }

    getNewEchCert() {
        return this._request('post', '/panel/api/server/getNewEchCert');
    }

    // ===========================================
    // PANEL SETTINGS
    // ===========================================

    /**
     * Get all panel settings
     */
    getAllSettings() {
        return this._request('post', '/panel/setting/all');
    }

    /**
     * Update panel settings
     * @param {Object} settings - Settings to update
     */
    updateSetting(settings) {
        return this._request('post', '/panel/setting/update', settings);
    }

    /**
     * Update admin username and password
     * @param {string} oldUsername - Current username
     * @param {string} oldPassword - Current password
     * @param {string} newUsername - New username
     * @param {string} newPassword - New password
     */
    updateUser(oldUsername, oldPassword, newUsername, newPassword) {
        return this._request('post', '/panel/setting/updateUser', {
            oldUsername,
            oldPassword,
            newUsername,
            newPassword
        });
    }

    /**
     * Restart the panel
     */
    restartPanel() {
        return this._request('post', '/panel/setting/restartPanel');
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return this._request('post', '/panel/setting/defaultSettings');
    }

    /**
     * Get default Xray JSON config
     */
    getDefaultJsonConfig() {
        return this._request('get', '/panel/setting/getDefaultJsonConfig');
    }

    // ===========================================
    // XRAY CONFIGURATION
    // ===========================================

    /**
     * Get Xray configuration
     */
    getXrayConfig() {
        return this._request('post', '/panel/xray/');
    }

    /**
     * Update Xray configuration
     * @param {string} config - Xray configuration content
     */
    updateXrayConfig(config) {
        return this._request('post', '/panel/xray/update', { content: config });
    }

    /**
     * Manage WARP
     * @param {string} action - Action to perform (data, del, config, reg, license)
     * @param {Object} [data] - Additional data for the action
     */
    manageWarp(action, data = {}) {
        return this._request('post', `/panel/xray/warp/${action}`, data);
    }

    /**
     * Get outbound traffic statistics
     */
    getOutboundsTraffic() {
        return this._request('get', '/panel/xray/getOutboundsTraffic');
    }

    /**
     * Reset outbound traffic statistics
     */
    resetOutboundsTraffic() {
        return this._request('post', '/panel/xray/resetOutboundsTraffic');
    }

    /**
     * Get Xray execution result
     */
    getXrayResult() {
        return this._request('get', '/panel/xray/getXrayResult');
    }

    // Security Methods

    /**
     * Get security statistics and monitoring data
     * @returns {Object} Security statistics
     */
    getSecurityStats() {
        return this.securityMonitor.getStats();
    }

    /**
     * Clear blocked IPs (admin function)
     */
    clearBlockedIPs() {
        this.securityMonitor.clearBlockedIPs();
    }

    /**
     * Validate credential strength
     * @param {string} credential - Credential to validate
     * @param {string} type - Type of credential
     * @returns {Object} Validation result
     */
    validateCredentialStrength(credential, type) {
        return CredentialSecurity.validateCredentialStrength(credential, type);
    }

    /**
     * Generate secure session token
     * @returns {string} Secure session token
     */
    generateSecureToken() {
        return CredentialSecurity.generateSessionToken();
    }

    /**
     * Enable development mode for detailed error messages
     * @param {boolean} enabled - Whether to enable development mode
     */
    setDevelopmentMode(enabled) {
        this.isDevelopment = enabled;
    }
}

// Export static methods for standalone use
ThreeXUI.CredentialGenerator = CredentialGenerator;
ThreeXUI.SessionManager = SessionManager;
ThreeXUI.createSessionManager = createSessionManager;

module.exports = ThreeXUI;

// Define lazy getters to avoid circular dependencies
Object.defineProperties(module.exports, {
    // Web middleware helpers
    createExpressMiddleware: {
        enumerable: true,
        get: () => require('./src/middleware/WebMiddleware').createExpressMiddleware
    },
    withThreeXUI: {
        enumerable: true,
        get: () => require('./src/middleware/WebMiddleware').withThreeXUI
    },
    createReactHook: {
        enumerable: true,
        get: () => require('./src/middleware/WebMiddleware').createReactHook
    },
    createNextjsRoutes: {
        enumerable: true,
        get: () => require('./src/middleware/WebMiddleware').createNextjsRoutes
    },
    SessionConfig: {
        enumerable: true,
        get: () => require('./src/middleware/WebMiddleware').SessionConfig
    },
    // Protocol builders
    ProtocolBuilder: {
        enumerable: true,
        get: () => require('./src/builders/ProtocolBuilders').ProtocolBuilder
    },
    VLESSBuilder: {
        enumerable: true,
        get: () => require('./src/builders/ProtocolBuilders').VLESSBuilder
    },
    VMESSBuilder: {
        enumerable: true,
        get: () => require('./src/builders/ProtocolBuilders').VMESSBuilder
    },
    TrojanBuilder: {
        enumerable: true,
        get: () => require('./src/builders/ProtocolBuilders').TrojanBuilder
    },
    ShadowsocksBuilder: {
        enumerable: true,
        get: () => require('./src/builders/ProtocolBuilders').ShadowsocksBuilder
    },
    WireGuardBuilder: {
        enumerable: true,
        get: () => require('./src/builders/ProtocolBuilders').WireGuardBuilder
    },
    BaseBuilder: {
        enumerable: true,
        get: () => require('./src/builders/ProtocolBuilders').BaseBuilder
    },
    // Security helpers
    SecurityEnhancer: {
        enumerable: true,
        get: () => require('./src/security/SecurityEnhancer')
    }
});