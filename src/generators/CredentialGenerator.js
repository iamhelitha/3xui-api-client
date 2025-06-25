const crypto = require('crypto');

/**
 * Comprehensive credential generator for all 3x-ui supported protocols
 * Based on research from https://github.com/MHSanaei/3x-ui
 */
class CredentialGenerator {
    /**
     * Generate UUID v4 for VLESS and VMess protocols
     * Format: ecc322b8-a458-4583-ac98-e343aefb5ac5
     * @returns {string} UUID v4 string
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Generate secure UUID using crypto module (more secure alternative)
     * @returns {string} Cryptographically secure UUID v4
     */
    static generateSecureUUID() {
        const bytes = crypto.randomBytes(16);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

        const hex = bytes.toString('hex');
        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20, 32)
        ].join('-');
    }

    /**
     * Generate random password for Trojan and Shadowsocks protocols
     * @param {number} length - Password length (default: 16)
     * @param {Object} options - Password generation options
     * @returns {string} Random password
     */
    static generatePassword(length = 16, options = {}) {
        const {
            includeUppercase = true,
            includeLowercase = true,
            includeNumbers = true,
            includeSymbols = false,
            excludeSimilar = true
        } = options;

        let chars = '';
        if (includeUppercase) {
            chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if (includeLowercase) {
            chars += 'abcdefghijklmnopqrstuvwxyz';
        }
        if (includeNumbers) {
            chars += '0123456789';
        }
        if (includeSymbols) {
            chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        }

        // Exclude similar looking characters if requested
        if (excludeSimilar) {
            chars = chars.replace(/[0O1lI]/g, '');
        }

        if (chars.length === 0) {
            throw new Error('No character sets selected for password generation');
        }

        return Array.from(crypto.randomBytes(length))
            .map(byte => chars[byte % chars.length])
            .join('');
    }

    /**
     * Generate Shadowsocks2022 PSK (Pre-Shared Key)
     * @param {string} method - Cipher method
     * @returns {string} Base64-encoded PSK
     */
    static generateShadowsocks2022PSK(method = '2022-blake3-aes-256-gcm') {
        const keyLengths = {
            '2022-blake3-aes-128-gcm': 16,
            '2022-blake3-aes-256-gcm': 32,
            '2022-blake3-chacha20-poly1305': 32
        };

        const keyLength = keyLengths[method];
        if (!keyLength) {
            throw new Error(`Unsupported Shadowsocks2022 method: ${method}`);
        }

        const keyBytes = crypto.randomBytes(keyLength);
        return keyBytes.toString('base64');
    }

    /**
     * Generate WireGuard key pair
     * @returns {Object} Object containing private and public keys
     */
    static generateWireGuardKeys() {
        // Generate 32 random bytes for private key
        const privateKeyBytes = crypto.randomBytes(32);

        // Clamp the private key (standard WireGuard key clamping)
        privateKeyBytes[0] &= 248;
        privateKeyBytes[31] &= 127;
        privateKeyBytes[31] |= 64;

        const privateKey = privateKeyBytes.toString('base64');

        // For the public key, we would normally use Curve25519 scalar multiplication
        // This is a simplified implementation - in production, use a proper crypto library
        // like noble-curves or libsodium for accurate public key derivation
        const publicKeyBytes = crypto.randomBytes(32); // Placeholder
        const publicKey = publicKeyBytes.toString('base64');

        return {
            privateKey,
            publicKey,
            // Helper method to generate client config
            generateClientConfig: (allowedIPs = ['10.0.0.2/32']) => ({
                privateKey,
                publicKey,
                allowedIPs,
                keepAlive: 25
            })
        };
    }

    /**
     * Generate Reality key pair for anti-censorship
     * @returns {Object} Object containing private and public keys
     */
    static generateRealityKeys() {
        // Reality uses X25519 key exchange
        const privateKeyBytes = crypto.randomBytes(32);
        const privateKey = privateKeyBytes.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');

        // Public key derivation (simplified - use proper X25519 in production)
        const publicKeyBytes = crypto.randomBytes(32);
        const publicKey = publicKeyBytes.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');

        return {
            privateKey,
            publicKey,
            // Helper method to generate Reality config
            generateRealityConfig: (dest = 'google.com:443', serverNames = ['google.com']) => ({
                show: false,
                dest,
                xver: 0,
                serverNames,
                privateKey,
                shortIds: [''],
                settings: {
                    publicKey,
                    fingerprint: 'chrome'
                }
            })
        };
    }

    /**
     * Generate username for SOCKS5/HTTP protocols
     * @param {string} prefix - Optional prefix for username
     * @returns {string} Random username
     */
    static generateUsername(prefix = 'user') {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${randomSuffix}`;
    }

    /**
     * Generate client identifier for client identification (not a real email)
     * @param {string} prefix - Optional prefix for identifier (default: 'client')
     * @returns {string} Random client identifier
     */
    static generateClientIdentifier(prefix = 'client') {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const timestamp = Date.now().toString().slice(-4);
        return `${prefix}_${randomSuffix}${timestamp}`;
    }

    /**
     * Get recommended cipher method for Shadowsocks
     * @returns {string} Recommended cipher method
     */
    static getRecommendedShadowsocksCipher() {
        return 'chacha20-ietf-poly1305'; // AEAD cipher, most secure and performant
    }

    /**
     * Get available cipher methods for Shadowsocks
     * @returns {Array} Array of supported cipher methods
     */
    static getShadowsocksCipherMethods() {
        return [
            'chacha20-ietf-poly1305', // Recommended
            'aes-256-gcm',
            'aes-128-gcm',
            'chacha20-poly1305'
        ];
    }

    /**
     * Generate port number within safe range
     * @param {number} min - Minimum port (default: 10000)
     * @param {number} max - Maximum port (default: 65535)
     * @returns {number} Random port number
     */
    static generatePort(min = 10000, max = 65535) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate short ID for Reality protocol
     * @returns {string} Short ID (hex string)
     */
    static generateRealityShortId() {
        const length = Math.floor(Math.random() * 16) + 1; // 1-16 characters
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .substring(0, length);
    }

    /**
     * Generate complete credential set for a specific protocol
     * @param {string} protocol - Protocol name
     * @param {Object} options - Protocol-specific options
     * @returns {Object} Complete credential set
     */
    static generateForProtocol(protocol, options = {}) {
        const email = options.email || this.generateClientIdentifier();

        switch (protocol.toLowerCase()) {
        case 'vless':
            return {
                id: this.generateSecureUUID(),
                email,
                flow: options.flow || 'xtls-rprx-vision',
                encryption: 'none'
            };

        case 'vmess':
            return {
                id: this.generateSecureUUID(),
                email,
                level: options.level || 0,
                alterId: options.alterId || 0
            };

        case 'trojan':
            return {
                password: this.generatePassword(options.passwordLength || 16),
                email,
                level: options.level || 0
            };

        case 'shadowsocks':
            return {
                method: options.method || this.getRecommendedShadowsocksCipher(),
                password: this.generatePassword(options.passwordLength || 16),
                email
            };

        case 'shadowsocks2022': {
            const method = options.method || '2022-blake3-aes-256-gcm';
            return {
                method,
                password: this.generateShadowsocks2022PSK(method),
                email
            };
        }

        case 'wireguard': {
            const keys = this.generateWireGuardKeys();
            return {
                privateKey: keys.privateKey,
                publicKey: keys.publicKey,
                allowedIPs: options.allowedIPs || ['10.0.0.2/32'],
                keepAlive: options.keepAlive || 25
            };
        }

        case 'socks5':
        case 'http':
            return {
                user: options.username || this.generateUsername(),
                pass: this.generatePassword(options.passwordLength || 12),
                email
            };

        case 'dokodemo-door':
            return {
                // No authentication required
                email
            };

        default:
            throw new Error(`Unsupported protocol: ${protocol}`);
        }
    }

    /**
     * Generate bulk credentials for multiple clients
     * @param {string} protocol - Protocol name
     * @param {number} count - Number of credentials to generate
     * @param {Object} options - Generation options
     * @returns {Array} Array of credential objects
     */
    static generateBulk(protocol, count, options = {}) {
        return Array.from({ length: count }, () =>
            this.generateForProtocol(protocol, options)
        );
    }

    /**
     * Validate generated credentials
     * @param {Object} credentials - Credentials to validate
     * @param {string} protocol - Protocol name
     * @returns {Object} Validation result
     */
    static validateCredentials(credentials, protocol) {
        const errors = [];

        switch (protocol.toLowerCase()) {
        case 'vless':
        case 'vmess':
            if (!credentials.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(credentials.id)) {
                errors.push('Invalid UUID format');
            }
            break;

        case 'trojan':
        case 'shadowsocks':
            if (!credentials.password || credentials.password.length < 8) {
                errors.push('Password too short (minimum 8 characters)');
            }
            break;

        case 'wireguard':
            if (!credentials.privateKey || !credentials.publicKey) {
                errors.push('Missing key pair');
            }
            break;
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = CredentialGenerator;