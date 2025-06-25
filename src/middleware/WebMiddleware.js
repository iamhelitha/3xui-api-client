/**
 * Web Middleware for Express.js and Next.js integration
 * Provides session management and authentication handling for web applications
 */

/* global fetch */

const ThreeXUI = require('../../index');
const { createSessionManager } = require('../session/SessionManager');

/**
 * Express.js middleware for 3x-ui API integration
 * @param {Object} config - Middleware configuration
 * @param {string} config.baseURL - 3x-ui server URL
 * @param {string} config.username - Admin username
 * @param {string} config.password - Admin password
 * @param {Object} config.sessionManager - Session manager configuration
 * @param {string} config.sessionKey - Session key name (default: '3xui_client')
 * @returns {Function} Express middleware function
 */
function createExpressMiddleware(config) {
    if (!config.baseURL || !config.username || !config.password) {
        throw new Error('baseURL, username, and password are required');
    }

    const sessionKey = config.sessionKey || '3xui_client';
    const sessionManager = config.sessionManager || createSessionManager();

    return async(req, res, next) => {
        try {
            // Check if client already exists in request
            if (req[sessionKey]) {
                return next();
            }

            // Create or retrieve 3x-ui client
            const client = new ThreeXUI(
                config.baseURL,
                config.username,
                config.password,
                { sessionManager }
            );

            // Ensure authentication
            await client.login();

            // Attach client to request object
            req[sessionKey] = client;

            // Add helper methods to response
            res.generate3xuiCredentials = (protocol, options = {}) => {
                return client.generateCredentials(protocol, options);
            };

            res.add3xuiClient = async(inboundId, protocol, options = {}) => {
                return await client.addClientWithCredentials(inboundId, protocol, options);
            };

            next();
        } catch (error) {
            console.error('3x-ui middleware error:', error);
            res.status(500).json({
                error: '3x-ui authentication failed',
                message: error.message
            });
        }
    };
}

/**
 * Next.js API route handler wrapper
 * @param {Object} config - Configuration object
 * @param {Function} handler - API route handler function
 * @returns {Function} Wrapped Next.js API handler
 */
function withThreeXUI(config, handler) {
    if (!config.baseURL || !config.username || !config.password) {
        throw new Error('baseURL, username, and password are required');
    }

    const sessionManager = config.sessionManager || createSessionManager();
    const client = new ThreeXUI(
        config.baseURL,
        config.username,
        config.password,
        { sessionManager }
    );

    return async(req, res) => {
        try {
            // Ensure authentication
            await client.login();

            // Attach client and helper methods to request
            req.threeXUI = client;
            req.generateCredentials = (protocol, options = {}) => {
                return client.generateCredentials(protocol, options);
            };
            req.addClientWithCredentials = async(inboundId, protocol, options = {}) => {
                return await client.addClientWithCredentials(inboundId, protocol, options);
            };

            // Call the original handler
            return await handler(req, res);
        } catch (error) {
            console.error('3x-ui Next.js wrapper error:', error);
            return res.status(500).json({
                error: '3x-ui authentication failed',
                message: error.message
            });
        }
    };
}

/**
 * React Hook for client-side 3x-ui integration
 * Note: This requires server-side proxy endpoints for security
 */
function createReactHook(apiEndpoint = '/api/3xui') {
    return {
        /**
         * Generate credentials via API call
         * @param {string} protocol - Protocol name
         * @param {Object} options - Generation options
         * @returns {Promise<Object>} Generated credentials
         */
        async generateCredentials(protocol, options = {}) {
            const response = await fetch(`${apiEndpoint}/generate-credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ protocol, options })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        },

        /**
         * Add client with credentials via API call
         * @param {number} inboundId - Inbound ID
         * @param {string} protocol - Protocol type
         * @param {Object} options - Client options
         * @returns {Promise<Object>} Created client
         */
        async addClientWithCredentials(inboundId, protocol, options = {}) {
            const response = await fetch(`${apiEndpoint}/add-client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inboundId, protocol, options })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        },

        /**
         * Get inbounds list via API call
         * @returns {Promise<Array>} Inbounds list
         */
        async getInbounds() {
            const response = await fetch(`${apiEndpoint}/inbounds`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        },

        /**
         * Get client traffic information
         * @param {string} email - Client email
         * @returns {Promise<Object>} Traffic information
         */
        async getClientTraffic(email) {
            const response = await fetch(`${apiEndpoint}/client-traffic/${encodeURIComponent(email)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        }
    };
}

/**
 * Create session management configuration helpers
 */
const SessionConfig = {
    /**
     * Memory-based session configuration (development)
     * @returns {Object} Memory session config
     */
    memory() {
        return {
            sessionManager: createSessionManager()
        };
    },

    /**
     * Redis-based session configuration (production)
     * @param {Object} redisClient - Redis client instance
     * @param {Object} options - Redis options
     * @returns {Object} Redis session config
     */
    redis(redisClient, options = {}) {
        return {
            sessionManager: createSessionManager({
                redis: redisClient,
                redisOptions: options
            })
        };
    },

    /**
     * Database-based session configuration
     * @param {Object} database - Database client instance
     * @param {Object} options - Database options
     * @returns {Object} Database session config
     */
    database(database, options = {}) {
        return {
            sessionManager: createSessionManager({
                database: database,
                databaseOptions: options
            })
        };
    },

    /**
     * Custom session handler configuration
     * @param {Object} handlers - Custom handler functions
     * @returns {Object} Custom session config
     */
    custom(handlers) {
        return {
            sessionManager: createSessionManager({
                customHandler: handlers
            })
        };
    }
};

/**
 * Example Next.js API routes generator
 */
const createNextjsRoutes = (config) => {
    return {
        // GET /api/3xui/inbounds
        inbounds: withThreeXUI(config, async(req, res) => {
            try {
                const inbounds = await req.threeXUI.getInbounds();
                res.status(200).json(inbounds);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        }),

        // POST /api/3xui/generate-credentials
        generateCredentials: withThreeXUI(config, async(req, res) => {
            try {
                const { protocol, options } = req.body;
                const credentials = req.generateCredentials(protocol, options);
                res.status(200).json(credentials);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        }),

        // POST /api/3xui/add-client
        addClient: withThreeXUI(config, async(req, res) => {
            try {
                const { inboundId, protocol, options } = req.body;
                const result = await req.addClientWithCredentials(inboundId, protocol, options);
                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        }),

        // GET /api/3xui/client-traffic/[email]
        clientTraffic: withThreeXUI(config, async(req, res) => {
            try {
                const { email } = req.query;
                const traffic = await req.threeXUI.getClientTrafficsByEmail(email);
                res.status(200).json(traffic);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        })
    };
};

module.exports = {
    createExpressMiddleware,
    withThreeXUI,
    createReactHook,
    SessionConfig,
    createNextjsRoutes
};