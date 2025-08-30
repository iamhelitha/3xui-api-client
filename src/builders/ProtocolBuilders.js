/**
 * Protocol Builders for easier 3x-ui configuration
 * Provides fluent API for building inbound and client configurations
 */

const CredentialGenerator = require('../generators/CredentialGenerator');

/**
 * Base builder class with common functionality
 */
class BaseBuilder {
    constructor() {
        this.config = {};
    }

    /**
     * Set remark/name for the configuration
     * @param {string} remark - Configuration name
     * @returns {this} Builder instance for chaining
     */
    remark(remark) {
        this.config.remark = remark;
        return this;
    }

    /**
     * Set port number
     * @param {number} port - Port number
     * @returns {this} Builder instance for chaining
     */
    port(port) {
        this.config.port = port;
        return this;
    }

    /**
     * Generate random port
     * @param {number} min - Minimum port (default: 10000)
     * @param {number} max - Maximum port (default: 65535)
     * @returns {this} Builder instance for chaining
     */
    randomPort(min = 10000, max = 65535) {
        this.config.port = CredentialGenerator.generatePort(min, max);
        return this;
    }

    /**
     * Set listen address
     * @param {string} listen - Listen address (default: '0.0.0.0')
     * @returns {this} Builder instance for chaining
     */
    listen(listen = '0.0.0.0') {
        this.config.listen = listen;
        return this;
    }

    /**
     * Enable/disable configuration
     * @param {boolean} enabled - Enable status (default: true)
     * @returns {this} Builder instance for chaining
     */
    enable(enabled = true) {
        this.config.enable = enabled;
        return this;
    }

    /**
     * Build and return the configuration
     * @returns {Object} Built configuration
     */
    build() {
        return { ...this.config };
    }
}

/**
 * VLESS Protocol Builder
 */
class VLESSBuilder extends BaseBuilder {
    constructor() {
        super();
        this.config = {
            protocol: 'vless',
            settings: {
                clients: [],
                decryption: 'none',
                fallbacks: []
            },
            streamSettings: {
                network: 'tcp',
                security: 'none'
            }
        };
    }

    /**
     * Add client with automatic credential generation
     * @param {Object} options - Client options
     * @returns {this} Builder instance for chaining
     */
    addClient(options = {}) {
        const credentials = CredentialGenerator.generateForProtocol('vless', options);
        this.config.settings.clients.push({
            ...credentials,
            limitIp: options.limitIp || 0,
            totalGB: options.totalGB || 0,
            expiryTime: options.expiryTime || 0,
            enable: options.enable !== false,
            subId: options.subId || CredentialGenerator.generateSecureUUID()
        });
        return this;
    }

    /**
     * Set network type (tcp, ws, h2, grpc)
     * @param {string} network - Network type
     * @returns {this} Builder instance for chaining
     */
    network(network) {
        this.config.streamSettings.network = network;
        return this;
    }

    /**
     * Configure TLS security
     * @param {Object} options - TLS options
     * @returns {this} Builder instance for chaining
     */
    tls(options = {}) {
        this.config.streamSettings.security = 'tls';
        this.config.streamSettings.tlsSettings = {
            serverName: options.serverName || '',
            certificates: options.certificates || [{
                certificateFile: options.certFile || '',
                keyFile: options.keyFile || ''
            }]
        };
        return this;
    }

    /**
     * Configure Reality security (anti-censorship)
     * @param {Object} options - Reality options
     * @returns {this} Builder instance for chaining
     */
    reality(options = {}) {
        const keys = options.keys || CredentialGenerator.generateRealityKeys();
        this.config.streamSettings.security = 'reality';
        this.config.streamSettings.realitySettings = {
            show: false,
            dest: options.dest || 'google.com:443',
            xver: 0,
            serverNames: options.serverNames || ['google.com'],
            privateKey: keys.privateKey,
            shortIds: options.shortIds || [''],
            settings: {
                publicKey: keys.publicKey,
                fingerprint: options.fingerprint || 'chrome'
            }
        };
        return this;
    }

    /**
     * Configure WebSocket transport
     * @param {Object} options - WebSocket options
     * @returns {this} Builder instance for chaining
     */
    websocket(options = {}) {
        this.network('ws');
        this.config.streamSettings.wsSettings = {
            path: options.path || '/',
            headers: options.headers || {}
        };
        return this;
    }

    /**
     * Configure HTTP/2 transport
     * @param {Object} options - HTTP/2 options
     * @returns {this} Builder instance for chaining
     */
    http2(options = {}) {
        this.network('h2');
        this.config.streamSettings.httpSettings = {
            path: options.path || '/',
            host: options.host || []
        };
        return this;
    }

    /**
     * Configure gRPC transport
     * @param {Object} options - gRPC options
     * @returns {this} Builder instance for chaining
     */
    grpc(options = {}) {
        this.network('grpc');
        this.config.streamSettings.grpcSettings = {
            serviceName: options.serviceName || ''
        };
        return this;
    }

    /**
     * Set XTLS flow control
     * @param {string} flow - Flow type (xtls-rprx-vision, etc.)
     * @returns {this} Builder instance for chaining
     */
    flow(flow) {
        if (this.config.settings.clients.length > 0) {
            this.config.settings.clients.forEach(client => {
                client.flow = flow;
            });
        }
        return this;
    }

    /**
     * Build and return the configuration with JSON stringified settings
     * @returns {Object} Built configuration for 3x-ui API
     */
    build() {
        const config = { ...this.config };
        // 3x-ui API expects settings and streamSettings as JSON strings
        if (config.settings) {
            config.settings = JSON.stringify(config.settings);
        }
        if (config.streamSettings) {
            config.streamSettings = JSON.stringify(config.streamSettings);
        }
        return config;
    }
}

/**
 * VMess Protocol Builder
 */
class VMESSBuilder extends BaseBuilder {
    constructor() {
        super();
        this.config = {
            protocol: 'vmess',
            settings: {
                clients: []
            },
            streamSettings: {
                network: 'tcp',
                security: 'none'
            }
        };
    }

    /**
     * Add client with automatic credential generation
     * @param {Object} options - Client options
     * @returns {this} Builder instance for chaining
     */
    addClient(options = {}) {
        const credentials = CredentialGenerator.generateForProtocol('vmess', options);
        this.config.settings.clients.push({
            ...credentials,
            limitIp: options.limitIp || 0,
            totalGB: options.totalGB || 0,
            expiryTime: options.expiryTime || 0,
            enable: options.enable !== false
        });
        return this;
    }

    /**
     * Set network type (tcp, ws, h2, grpc)
     * @param {string} network - Network type
     * @returns {this} Builder instance for chaining
     */
    network(network) {
        this.config.streamSettings.network = network;
        return this;
    }

    /**
     * Configure TLS security
     * @param {Object} options - TLS options
     * @returns {this} Builder instance for chaining
     */
    tls(options = {}) {
        this.config.streamSettings.security = 'tls';
        this.config.streamSettings.tlsSettings = {
            serverName: options.serverName || '',
            certificates: options.certificates || [{
                certificateFile: options.certFile || '',
                keyFile: options.keyFile || ''
            }]
        };
        return this;
    }

    /**
     * Configure WebSocket transport
     * @param {Object} options - WebSocket options
     * @returns {this} Builder instance for chaining
     */
    websocket(options = {}) {
        this.network('ws');
        this.config.streamSettings.wsSettings = {
            path: options.path || '/',
            headers: options.headers || {}
        };
        return this;
    }

    /**
     * Build and return the configuration with JSON stringified settings
     * @returns {Object} Built configuration for 3x-ui API
     */
    build() {
        const config = { ...this.config };
        // 3x-ui API expects settings and streamSettings as JSON strings
        if (config.settings) {
            config.settings = JSON.stringify(config.settings);
        }
        if (config.streamSettings) {
            config.streamSettings = JSON.stringify(config.streamSettings);
        }
        return config;
    }
}

/**
 * Trojan Protocol Builder
 */
class TrojanBuilder extends BaseBuilder {
    constructor() {
        super();
        this.config = {
            protocol: 'trojan',
            settings: {
                clients: [],
                fallbacks: []
            },
            streamSettings: {
                network: 'tcp',
                security: 'tls'
            }
        };
    }

    /**
     * Add client with automatic credential generation
     * @param {Object} options - Client options
     * @returns {this} Builder instance for chaining
     */
    addClient(options = {}) {
        const credentials = CredentialGenerator.generateForProtocol('trojan', options);
        this.config.settings.clients.push({
            ...credentials,
            limitIp: options.limitIp || 0,
            totalGB: options.totalGB || 0,
            expiryTime: options.expiryTime || 0,
            enable: options.enable !== false
        });
        return this;
    }

    /**
     * Configure TLS security (required for Trojan)
     * @param {Object} options - TLS options
     * @returns {this} Builder instance for chaining
     */
    tls(options = {}) {
        this.config.streamSettings.security = 'tls';
        this.config.streamSettings.tlsSettings = {
            serverName: options.serverName || '',
            certificates: options.certificates || [{
                certificateFile: options.certFile || '',
                keyFile: options.keyFile || ''
            }]
        };
        return this;
    }

    /**
     * Configure fallback destinations
     * @param {Array} fallbacks - Fallback configurations
     * @returns {this} Builder instance for chaining
     */
    fallbacks(fallbacks) {
        this.config.settings.fallbacks = fallbacks;
        return this;
    }

    /**
     * Build and return the configuration with JSON stringified settings
     * @returns {Object} Built configuration for 3x-ui API
     */
    build() {
        const config = { ...this.config };
        // 3x-ui API expects settings and streamSettings as JSON strings
        if (config.settings) {
            config.settings = JSON.stringify(config.settings);
        }
        if (config.streamSettings) {
            config.streamSettings = JSON.stringify(config.streamSettings);
        }
        return config;
    }
}

/**
 * Shadowsocks Protocol Builder
 */
class ShadowsocksBuilder extends BaseBuilder {
    constructor() {
        super();
        this.config = {
            protocol: 'shadowsocks',
            settings: {
                method: CredentialGenerator.getRecommendedShadowsocksCipher(),
                password: '',
                network: 'tcp,udp'
            }
        };
    }

    /**
     * Set encryption method
     * @param {string} method - Cipher method
     * @returns {this} Builder instance for chaining
     */
    method(method) {
        this.config.settings.method = method;
        return this;
    }

    /**
     * Set password or generate automatically
     * @param {string} password - Password (optional)
     * @returns {this} Builder instance for chaining
     */
    password(password) {
        this.config.settings.password = password || CredentialGenerator.generatePassword(16);
        return this;
    }

    /**
     * Generate password automatically
     * @param {number} length - Password length
     * @returns {this} Builder instance for chaining
     */
    generatePassword(length = 16) {
        this.config.settings.password = CredentialGenerator.generatePassword(length);
        return this;
    }

    /**
     * Set supported networks
     * @param {string} network - Supported networks (tcp, udp, tcp,udp)
     * @returns {this} Builder instance for chaining
     */
    network(network) {
        this.config.settings.network = network;
        return this;
    }

    /**
     * Build and return the configuration with JSON stringified settings
     * @returns {Object} Built configuration for 3x-ui API
     */
    build() {
        const config = { ...this.config };
        // 3x-ui API expects settings as JSON string
        if (config.settings) {
            config.settings = JSON.stringify(config.settings);
        }
        // Shadowsocks typically doesn't use streamSettings, but add for completeness
        if (config.streamSettings) {
            config.streamSettings = JSON.stringify(config.streamSettings);
        }
        return config;
    }
}

/**
 * WireGuard Protocol Builder
 */
class WireGuardBuilder extends BaseBuilder {
    constructor() {
        super();
        this.config = {
            protocol: 'wireguard',
            settings: {
                secretKey: '',
                address: ['10.0.0.1/24'],
                peers: [],
                mtu: 1420
            }
        };
    }

    /**
     * Generate or set server keys
     * @param {Object} keys - Key pair (optional)
     * @returns {this} Builder instance for chaining
     */
    serverKeys(keys) {
        const keyPair = keys || CredentialGenerator.generateWireGuardKeys();
        this.config.settings.secretKey = keyPair.privateKey;
        return this;
    }

    /**
     * Set server address
     * @param {Array} addresses - Server addresses
     * @returns {this} Builder instance for chaining
     */
    address(addresses) {
        this.config.settings.address = Array.isArray(addresses) ? addresses : [addresses];
        return this;
    }

    /**
     * Add peer with automatic key generation
     * @param {Object} options - Peer options
     * @returns {this} Builder instance for chaining
     */
    addPeer(options = {}) {
        const keys = options.keys || CredentialGenerator.generateWireGuardKeys();
        this.config.settings.peers.push({
            publicKey: keys.publicKey,
            allowedIPs: options.allowedIPs || ['10.0.0.2/32'],
            keepAlive: options.keepAlive || 25
        });
        return this;
    }

    /**
     * Set MTU size
     * @param {number} mtu - MTU size
     * @returns {this} Builder instance for chaining
     */
    mtu(mtu) {
        this.config.settings.mtu = mtu;
        return this;
    }

    /**
     * Build and return the configuration with JSON stringified settings
     * @returns {Object} Built configuration for 3x-ui API
     */
    build() {
        const config = { ...this.config };
        // 3x-ui API expects settings as JSON string
        if (config.settings) {
            config.settings = JSON.stringify(config.settings);
        }
        // WireGuard typically doesn't use streamSettings, but add for completeness
        if (config.streamSettings) {
            config.streamSettings = JSON.stringify(config.streamSettings);
        }
        return config;
    }
}

/**
 * Protocol Builder Factory
 */
class ProtocolBuilder {
    /**
     * Create VLESS protocol builder
     * @returns {VLESSBuilder} VLESS builder instance
     */
    static vless() {
        return new VLESSBuilder();
    }

    /**
     * Create VMess protocol builder
     * @returns {VMESSBuilder} VMess builder instance
     */
    static vmess() {
        return new VMESSBuilder();
    }

    /**
     * Create Trojan protocol builder
     * @returns {TrojanBuilder} Trojan builder instance
     */
    static trojan() {
        return new TrojanBuilder();
    }

    /**
     * Create Shadowsocks protocol builder
     * @returns {ShadowsocksBuilder} Shadowsocks builder instance
     */
    static shadowsocks() {
        return new ShadowsocksBuilder();
    }

    /**
     * Create WireGuard protocol builder
     * @returns {WireGuardBuilder} WireGuard builder instance
     */
    static wireguard() {
        return new WireGuardBuilder();
    }
}

/**
 * Quick inbound configuration templates
 */
ProtocolBuilder.templates = {
    /**
     * VLESS with Reality (recommended for anti-censorship)
     * @param {Object} options - Template options
     * @returns {Object} Built configuration
     */
    vlessReality(options = {}) {
        return ProtocolBuilder.vless()
            .remark(options.remark || 'VLESS-Reality')
            .randomPort()
            .reality({
                dest: options.dest || 'google.com:443',
                serverNames: options.serverNames || ['google.com']
            })
            .addClient(options.client || {})
            .build();
    },

    /**
     * VMess with WebSocket + TLS (web-compatible)
     * @param {Object} options - Template options
     * @returns {Object} Built configuration
     */
    vmessWsTls(options = {}) {
        return ProtocolBuilder.vmess()
            .remark(options.remark || 'VMess-WS-TLS')
            .port(options.port || 443)
            .websocket({ path: options.path || '/ws' })
            .tls({
                serverName: options.serverName || '',
                certFile: options.certFile || '',
                keyFile: options.keyFile || ''
            })
            .addClient(options.client || {})
            .build();
    },

    /**
     * Trojan with TLS (simple and effective)
     * @param {Object} options - Template options
     * @returns {Object} Built configuration
     */
    trojanTls(options = {}) {
        return ProtocolBuilder.trojan()
            .remark(options.remark || 'Trojan-TLS')
            .port(options.port || 443)
            .tls({
                serverName: options.serverName || '',
                certFile: options.certFile || '',
                keyFile: options.keyFile || ''
            })
            .addClient(options.client || {})
            .build();
    },

    /**
     * Shadowsocks with recommended cipher
     * @param {Object} options - Template options
     * @returns {Object} Built configuration
     */
    shadowsocks(options = {}) {
        return ProtocolBuilder.shadowsocks()
            .remark(options.remark || 'Shadowsocks')
            .randomPort()
            .method(options.method || CredentialGenerator.getRecommendedShadowsocksCipher())
            .generatePassword(options.passwordLength || 16)
            .build();
    }
};

module.exports = {
    ProtocolBuilder,
    VLESSBuilder,
    VMESSBuilder,
    TrojanBuilder,
    ShadowsocksBuilder,
    WireGuardBuilder,
    BaseBuilder
};