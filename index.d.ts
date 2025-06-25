// Type definitions for 3xui-api-client v2.0.0

declare module '3xui-api-client' {
  import { AxiosInstance } from 'axios';

  // ===========================================
  // CORE INTERFACES
  // ===========================================

  export interface ThreeXUIOptions {
    sessionManager?: SessionManager | SessionConfig;
    autoGenerateCredentials?: boolean;
    timeout?: number;
  }

  export interface LoginResponse {
    success: boolean;
    fromCache?: boolean;
    headers?: any;
    data: any;
  }

  export interface InboundConfig {
    remark: string;
    port: number;
    protocol: string;
    settings: any;
    streamSettings?: any;
    listen?: string;
    enable?: boolean;
  }

  export interface ClientConfig {
    id: number;
    settings: string;
  }

  // ===========================================
  // CREDENTIAL GENERATION INTERFACES
  // ===========================================

  export interface CredentialOptions {
    email?: string;
    passwordLength?: number;
    level?: number;
    alterId?: number;
    flow?: string;
    method?: string;
    username?: string;
    limitIp?: number;
    totalGB?: number;
    expiryTime?: number;
    enable?: boolean;
    subId?: string;
    allowedIPs?: string[];
    keepAlive?: number;
  }

  export interface VLESSCredentials {
    id: string;
    email: string;
    flow: string;
    encryption: string;
  }

  export interface VMESSCredentials {
    id: string;
    email: string;
    level: number;
    alterId: number;
  }

  export interface TrojanCredentials {
    password: string;
    email: string;
    level: number;
  }

  export interface ShadowsocksCredentials {
    method: string;
    password: string;
    email: string;
  }

  export interface WireGuardCredentials {
    privateKey: string;
    publicKey: string;
    allowedIPs: string[];
    keepAlive: number;
  }

  export interface SocksCredentials {
    user: string;
    pass: string;
    email: string;
  }

  export interface ValidationResult {
    valid: boolean;
    errors: string[];
  }

  export interface WireGuardKeys {
    privateKey: string;
    publicKey: string;
    generateClientConfig: (allowedIPs?: string[]) => any;
  }

  export interface RealityKeys {
    privateKey: string;
    publicKey: string;
    generateRealityConfig: (dest?: string, serverNames?: string[]) => any;
  }

  // ===========================================
  // SESSION MANAGEMENT INTERFACES
  // ===========================================

  export interface SessionConfig {
    sessionTTL?: number;
    autoRefresh?: boolean;
    refreshThreshold?: number;
    store?: SessionStore;
    redis?: any;
    redisOptions?: any;
    database?: any;
    databaseOptions?: any;
    customHandler?: any;
  }

  export interface SessionStore {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    exists(key: string): Promise<boolean>;
  }

  export interface SessionManager {
    generateSessionKey(baseURL: string, username: string): string;
    storeSession(baseURL: string, username: string, sessionData: any): Promise<string>;
    getSession(baseURL: string, username: string): Promise<any>;
    hasValidSession(baseURL: string, username: string): Promise<boolean>;
    shouldRefreshSession(session: any): boolean;
    deleteSession(baseURL: string, username: string): Promise<void>;
    clearAllSessions(): Promise<void>;
    getStats(): Promise<any>;
  }

  // ===========================================
  // WEB MIDDLEWARE INTERFACES
  // ===========================================

  export interface ExpressMiddlewareConfig {
    baseURL: string;
    username: string;
    password: string;
    sessionManager?: SessionManager;
    sessionKey?: string;
  }

  export interface NextJSConfig {
    baseURL: string;
    username: string;
    password: string;
    sessionManager?: SessionManager;
  }

  export interface ReactHookMethods {
    generateCredentials(protocol: string, options?: CredentialOptions): Promise<any>;
    addClientWithCredentials(inboundId: number, protocol: string, options?: CredentialOptions): Promise<any>;
    getInbounds(): Promise<any[]>;
    getClientTraffic(email: string): Promise<any>;
  }

  // ===========================================
  // PROTOCOL BUILDER INTERFACES
  // ===========================================

  export interface BuilderConfig {
    protocol: string;
    settings: any;
    streamSettings?: any;
    remark?: string;
    port?: number;
    listen?: string;
    enable?: boolean;
  }

  export interface TLSOptions {
    serverName?: string;
    certificates?: any[];
    certFile?: string;
    keyFile?: string;
  }

  export interface RealityOptions {
    keys?: RealityKeys;
    dest?: string;
    serverNames?: string[];
    shortIds?: string[];
  }

  export interface WebSocketOptions {
    path?: string;
    headers?: Record<string, string>;
  }

  export interface HTTP2Options {
    path?: string;
    host?: string[];
  }

  export interface GRPCOptions {
    serviceName?: string;
  }

  // ===========================================
  // MAIN CLASS
  // ===========================================

  export default class ThreeXUI {
    constructor(baseURL: string, username: string, password: string, options?: ThreeXUIOptions);
    
    // Authentication
    login(forceRefresh?: boolean): Promise<LoginResponse>;
    logout(): Promise<void>;

    // Credential Generation Methods
    generateCredentials(protocol: string, options?: CredentialOptions): VLESSCredentials | VMESSCredentials | TrojanCredentials | ShadowsocksCredentials | WireGuardCredentials | SocksCredentials;
    generateUUID(secure?: boolean): string;
    generatePassword(length?: number, options?: any): string;
    generateBulkCredentials(protocol: string, count: number, options?: CredentialOptions): any[];
    getShadowsocksCiphers(): string[];
    getRecommendedShadowsocksCipher(): string;
    generateWireGuardKeys(): WireGuardKeys;
    generateRealityKeys(): RealityKeys;
    generatePort(min?: number, max?: number): number;
    validateCredentials(credentials: any, protocol: string): ValidationResult;

    // Enhanced Client Management
    addClientWithCredentials(inboundId: number, protocol: string, options?: CredentialOptions): Promise<any>;

    // Session Management
    getSessionStats(): Promise<any>;
    clearAllSessions(): Promise<void>;
    isSessionValid(): Promise<boolean>;

    // Original API Methods
    getInbounds(): Promise<any>;
    getInbound(id: number): Promise<any>;
    addInbound(inboundConfig: InboundConfig): Promise<any>;
    deleteInbound(id: number): Promise<any>;
    updateInbound(id: number, inboundConfig: InboundConfig): Promise<any>;
    addClient(clientConfig: ClientConfig): Promise<any>;
    deleteClient(inboundId: number, clientId: string): Promise<any>;
    updateClient(clientId: string, clientConfig: ClientConfig): Promise<any>;
    getClientTrafficsByEmail(email: string): Promise<any>;
    getClientTrafficsById(id: number): Promise<any>;
    getClientIps(email: string): Promise<any>;
    clearClientIps(email: string): Promise<any>;
    resetClientTraffic(inboundId: number, email: string): Promise<any>;
    resetAllTraffics(): Promise<any>;
    resetAllClientTraffics(inboundId: number): Promise<any>;
    deleteDepletedClients(inboundId: number): Promise<any>;
    getOnlineClients(): Promise<any>;
    createBackup(): Promise<any>;

    // Static exports
    static CredentialGenerator: typeof CredentialGenerator;
    static SessionManager: typeof SessionManager;
    static createSessionManager: (options?: SessionConfig) => SessionManager;
  }

  // ===========================================
  // CREDENTIAL GENERATOR CLASS
  // ===========================================

  export class CredentialGenerator {
    static generateUUID(): string;
    static generateSecureUUID(): string;
    static generatePassword(length?: number, options?: any): string;
    static generateShadowsocks2022PSK(method?: string): string;
    static generateWireGuardKeys(): WireGuardKeys;
    static generateRealityKeys(): RealityKeys;
    static generateUsername(prefix?: string): string;
    static generateEmail(domain?: string): string;
    static getRecommendedShadowsocksCipher(): string;
    static getShadowsocksCipherMethods(): string[];
    static generatePort(min?: number, max?: number): number;
    static generateRealityShortId(): string;
    static generateForProtocol(protocol: string, options?: CredentialOptions): any;
    static generateBulk(protocol: string, count: number, options?: CredentialOptions): any[];
    static validateCredentials(credentials: any, protocol: string): ValidationResult;
  }

  // ===========================================
  // SESSION MANAGEMENT CLASSES
  // ===========================================

  export class SessionStore {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    exists(key: string): Promise<boolean>;
  }

  export class MemorySessionStore extends SessionStore {
    constructor();
    getStats(): any;
  }

  export class RedisSessionStore extends SessionStore {
    constructor(redisClient: any, options?: any);
  }

  export class DatabaseSessionStore extends SessionStore {
    constructor(database: any, options?: any);
    cleanupExpired(): Promise<number>;
    static getCreateTableSQL(tableName?: string): string;
  }

  export class CustomSessionHandler {
    constructor(handlers: any);
    validate(key: string): Promise<boolean>;
  }

  export function createSessionManager(options?: SessionConfig): SessionManager;
  export function createMemoryStore(): MemorySessionStore;
  export function createRedisStore(redisClient: any, options?: any): RedisSessionStore;
  export function createDatabaseStore(database: any, options?: any): DatabaseSessionStore;
  export function createCustomHandler(handlers: any): CustomSessionHandler;

  // ===========================================
  // WEB MIDDLEWARE EXPORTS
  // ===========================================

  export function createExpressMiddleware(config: ExpressMiddlewareConfig): any;
  export function withThreeXUI(config: NextJSConfig, handler: any): any;
  export function createReactHook(apiEndpoint?: string): ReactHookMethods;
  export function createNextjsRoutes(config: NextJSConfig): any;

  export const SessionConfig: {
    memory(): SessionConfig;
    redis(redisClient: any, options?: any): SessionConfig;
    database(database: any, options?: any): SessionConfig;
    custom(handlers: any): SessionConfig;
  };

  // ===========================================
  // PROTOCOL BUILDERS
  // ===========================================

  export class BaseBuilder {
    constructor();
    remark(remark: string): this;
    port(port: number): this;
    randomPort(min?: number, max?: number): this;
    listen(listen?: string): this;
    enable(enabled?: boolean): this;
    build(): BuilderConfig;
  }

  export class VLESSBuilder extends BaseBuilder {
    addClient(options?: CredentialOptions): this;
    network(network: string): this;
    tls(options?: TLSOptions): this;
    reality(options?: RealityOptions): this;
    websocket(options?: WebSocketOptions): this;
    http2(options?: HTTP2Options): this;
    grpc(options?: GRPCOptions): this;
    flow(flow: string): this;
  }

  export class VMESSBuilder extends BaseBuilder {
    addClient(options?: CredentialOptions): this;
    network(network: string): this;
    tls(options?: TLSOptions): this;
    websocket(options?: WebSocketOptions): this;
  }

  export class TrojanBuilder extends BaseBuilder {
    addClient(options?: CredentialOptions): this;
    tls(options?: TLSOptions): this;
    fallbacks(fallbacks: any[]): this;
  }

  export class ShadowsocksBuilder extends BaseBuilder {
    method(method: string): this;
    password(password?: string): this;
    generatePassword(length?: number): this;
    network(network: string): this;
  }

  export class WireGuardBuilder extends BaseBuilder {
    serverKeys(keys?: WireGuardKeys): this;
    address(addresses: string | string[]): this;
    addPeer(options?: any): this;
    mtu(mtu: number): this;
  }

  export class ProtocolBuilder {
    static vless(): VLESSBuilder;
    static vmess(): VMESSBuilder;
    static trojan(): TrojanBuilder;
    static shadowsocks(): ShadowsocksBuilder;
    static wireguard(): WireGuardBuilder;
    static templates: {
      vlessReality(options?: any): BuilderConfig;
      vmessWsTls(options?: any): BuilderConfig;
      trojanTls(options?: any): BuilderConfig;
      shadowsocks(options?: any): BuilderConfig;
    };
  }
} 