/**
 * Session Management System for 3xui-api-client
 * Provides both built-in caching and user-managed database integration
 */

const crypto = require('crypto');

/**
 * Abstract base class for session storage
 */
class SessionStore {
    async get(_key) {
        throw new Error('get method must be implemented');
    }

    async set(_key, _value, _ttl) {
        throw new Error('set method must be implemented');
    }

    async delete(_key) {
        throw new Error('delete method must be implemented');
    }

    async clear() {
        throw new Error('clear method must be implemented');
    }

    async exists(key) {
        const value = await this.get(key);
        return value !== null;
    }
}

/**
 * Built-in memory session store (default)
 * Recommended for development and single-instance deployments
 */
class MemorySessionStore extends SessionStore {
    constructor() {
        super();
        this.cache = new Map();
        this.timers = new Map();
    }

    async get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }

        if (item.expires && item.expires <= Date.now()) {
            this.delete(key);
            return null;
        }

        return item.value;
    }

    async set(key, value, ttl = 3600) {
        // Clear existing timer if it exists
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const expires = ttl > 0 ? Date.now() + (ttl * 1000) : null;
        this.cache.set(key, { value, expires });

        // Set expiration timer
        if (ttl > 0) {
            const timer = setTimeout(() => {
                this.delete(key);
            }, ttl * 1000);
            this.timers.set(key, timer);
        }
    }

    async delete(key) {
        this.cache.delete(key);
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }

    async clear() {
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.cache.clear();
        this.timers.clear();
    }

    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

/**
 * Redis session store adapter
 * Recommended for production and multi-instance deployments
 */
class RedisSessionStore extends SessionStore {
    constructor(redisClient, options = {}) {
        super();
        this.redis = redisClient;
        this.keyPrefix = options.keyPrefix || '3xui:session:';
        this.defaultTTL = options.defaultTTL || 3600;
    }

    _getKey(key) {
        return `${this.keyPrefix}${key}`;
    }

    async get(key) {
        try {
            const value = await this.redis.get(this._getKey(key));
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    async set(key, value, ttl = this.defaultTTL) {
        try {
            const serialized = JSON.stringify(value);
            if (ttl > 0) {
                await this.redis.setex(this._getKey(key), ttl, serialized);
            } else {
                await this.redis.set(this._getKey(key), serialized);
            }
        } catch (error) {
            console.error('Redis set error:', error);
            throw error;
        }
    }

    async delete(key) {
        try {
            await this.redis.del(this._getKey(key));
        } catch (error) {
            console.error('Redis delete error:', error);
        }
    }

    async clear() {
        try {
            const keys = await this.redis.keys(`${this.keyPrefix}*`);
            if (keys.length > 0) {
                await this.redis.del(keys);
            }
        } catch (error) {
            console.error('Redis clear error:', error);
        }
    }

    async exists(key) {
        try {
            const result = await this.redis.exists(this._getKey(key));
            return result === 1;
        } catch (error) {
            console.error('Redis exists error:', error);
            return false;
        }
    }
}

/**
 * Database session store adapter
 * Works with any SQL database through a provided database client
 */
class DatabaseSessionStore extends SessionStore {
    constructor(database, options = {}) {
        super();
        this.db = database;
        this.tableName = options.tableName || 'sessions';
        this.keyColumn = options.keyColumn || 'session_key';
        this.valueColumn = options.valueColumn || 'session_data';
        this.expiresColumn = options.expiresColumn || 'expires_at';
        this.defaultTTL = options.defaultTTL || 3600;
    }

    async get(key) {
        try {
            const query = `
                SELECT ${this.valueColumn}
                FROM ${this.tableName}
                WHERE ${this.keyColumn} = ?
                AND (${this.expiresColumn} IS NULL OR ${this.expiresColumn} > ?)
            `;
            const result = await this.db.query(query, [key, new Date()]);

            if (result.length === 0) {
                return null;
            }

            return JSON.parse(result[0][this.valueColumn]);
        } catch (error) {
            console.error('Database get error:', error);
            return null;
        }
    }

    async set(key, value, ttl = this.defaultTTL) {
        try {
            const serialized = JSON.stringify(value);
            const expiresAt = ttl > 0 ? new Date(Date.now() + ttl * 1000) : null;

            // Use UPSERT operation
            const query = `
                INSERT INTO ${this.tableName} (${this.keyColumn}, ${this.valueColumn}, ${this.expiresColumn})
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                ${this.valueColumn} = VALUES(${this.valueColumn}),
                ${this.expiresColumn} = VALUES(${this.expiresColumn})
            `;

            await this.db.query(query, [key, serialized, expiresAt]);
        } catch (error) {
            console.error('Database set error:', error);
            throw error;
        }
    }

    async delete(key) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE ${this.keyColumn} = ?`;
            await this.db.query(query, [key]);
        } catch (error) {
            console.error('Database delete error:', error);
        }
    }

    async clear() {
        try {
            const query = `DELETE FROM ${this.tableName}`;
            await this.db.query(query);
        } catch (error) {
            console.error('Database clear error:', error);
        }
    }

    async exists(key) {
        try {
            const query = `
                SELECT 1 FROM ${this.tableName}
                WHERE ${this.keyColumn} = ?
                AND (${this.expiresColumn} IS NULL OR ${this.expiresColumn} > ?)
                LIMIT 1
            `;
            const result = await this.db.query(query, [key, new Date()]);
            return result.length > 0;
        } catch (error) {
            console.error('Database exists error:', error);
            return false;
        }
    }

    // Cleanup expired sessions
    async cleanupExpired() {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE ${this.expiresColumn} <= ?`;
            const result = await this.db.query(query, [new Date()]);
            return result.affectedRows || 0;
        } catch (error) {
            console.error('Database cleanup error:', error);
            return 0;
        }
    }

    // Get database schema for creating sessions table
    static getCreateTableSQL(tableName = 'sessions') {
        return `
            CREATE TABLE IF NOT EXISTS ${tableName} (
                session_key VARCHAR(255) PRIMARY KEY,
                session_data TEXT NOT NULL,
                expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_expires (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
    }
}

/**
 * User-managed session handler
 * Allows users to provide their own session management functions
 */
class CustomSessionHandler {
    constructor(handlers) {
        this.getSession = handlers.getSession;
        this.setSession = handlers.setSession;
        this.deleteSession = handlers.deleteSession;
        this.validateSession = handlers.validateSession;
    }

    async get(key) {
        try {
            return await this.getSession(key);
        } catch (error) {
            console.error('Custom session get error:', error);
            return null;
        }
    }

    async set(key, value, ttl) {
        try {
            await this.setSession(key, value, ttl);
        } catch (error) {
            console.error('Custom session set error:', error);
            throw error;
        }
    }

    async delete(key) {
        try {
            await this.deleteSession(key);
        } catch (error) {
            console.error('Custom session delete error:', error);
        }
    }

    async validate(key) {
        try {
            if (this.validateSession) {
                return await this.validateSession(key);
            }
            return await this.get(key) !== null;
        } catch (error) {
            console.error('Custom session validate error:', error);
            return false;
        }
    }
}

/**
 * Main session manager class
 */
class SessionManager {
    constructor(options = {}) {
        this.sessionTTL = options.sessionTTL || 3600; // 1 hour default
        this.autoRefresh = options.autoRefresh !== false;
        this.refreshThreshold = options.refreshThreshold || 0.8; // Refresh when 80% expired

        // Initialize session store
        if (options.store) {
            this.store = options.store;
        } else if (options.redis) {
            this.store = new RedisSessionStore(options.redis, options.redisOptions);
        } else if (options.database) {
            this.store = new DatabaseSessionStore(options.database, options.databaseOptions);
        } else if (options.customHandler) {
            this.store = new CustomSessionHandler(options.customHandler);
        } else {
            this.store = new MemorySessionStore();
        }
    }

    /**
     * Generate session key for a server
     */
    generateSessionKey(baseURL, username) {
        const hash = crypto
            .createHash('sha256')
            .update(`${baseURL}:${username}`)
            .digest('hex');
        return `session_${hash}`;
    }

    /**
     * Store session data
     */
    async storeSession(baseURL, username, sessionData) {
        const key = this.generateSessionKey(baseURL, username);
        const data = {
            ...sessionData,
            createdAt: Date.now(),
            baseURL,
            username
        };

        await this.store.set(key, data, this.sessionTTL);
        return key;
    }

    /**
     * Retrieve session data
     */
    async getSession(baseURL, username) {
        const key = this.generateSessionKey(baseURL, username);
        return await this.store.get(key);
    }

    /**
     * Check if session exists and is valid
     */
    async hasValidSession(baseURL, username) {
        const session = await this.getSession(baseURL, username);
        if (!session) {
            return false;
        }

        // Check if session needs refresh
        if (this.autoRefresh && this.shouldRefreshSession(session)) {
            return false; // Trigger re-authentication
        }

        return true;
    }

    /**
     * Check if session should be refreshed
     */
    shouldRefreshSession(session) {
        if (!session.createdAt) {
            return true;
        }

        const age = Date.now() - session.createdAt;
        const maxAge = this.sessionTTL * 1000;
        const threshold = maxAge * this.refreshThreshold;

        return age >= threshold;
    }

    /**
     * Delete session
     */
    async deleteSession(baseURL, username) {
        const key = this.generateSessionKey(baseURL, username);
        await this.store.delete(key);
    }

    /**
     * Clear all sessions
     */
    async clearAllSessions() {
        await this.store.clear();
    }

    /**
     * Get session statistics
     */
    async getStats() {
        if (this.store.getStats) {
            return await this.store.getStats();
        }
        return { message: 'Statistics not available for this store type' };
    }
}

// Export helper factory functions
const createSessionManager = (options = {}) => {
    return new SessionManager(options);
};

const createMemoryStore = () => {
    return new MemorySessionStore();
};

const createRedisStore = (redisClient, options = {}) => {
    return new RedisSessionStore(redisClient, options);
};

const createDatabaseStore = (database, options = {}) => {
    return new DatabaseSessionStore(database, options);
};

const createCustomHandler = (handlers) => {
    return new CustomSessionHandler(handlers);
};

module.exports = {
    SessionManager,
    SessionStore,
    MemorySessionStore,
    RedisSessionStore,
    DatabaseSessionStore,
    CustomSessionHandler,
    createSessionManager,
    createMemoryStore,
    createRedisStore,
    createDatabaseStore,
    createCustomHandler
};