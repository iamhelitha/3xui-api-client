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
    maxRequestsPerMinute?: number;
    maxLoginAttemptsPerHour?: number;
    isDevelopment?: boolean;
    enableCSP?: boolean;
    userAgent?: string;
    token?: string;
    apiToken?: string;
    /**
     * Panel version detection mode.
     * - 'auto': Automatically detect panel version (tries modern first, falls back to legacy)
     * - 'modern': Use only modern panel endpoints (/panel/api/login)
     * - 'legacy': Use only legacy panel endpoints (/login)
     * @default 'auto'
     */
    panelVersion?: 'auto' | 'modern' | 'legacy';
  }

  export interface LoginResponse {
    success: boolean;
    fromCache?: boolean;
    cookie?: string | null;
    headers?: any;
    data: any;
    message?: string;
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
  // MODERN API INTERFACES (3X-UI >= 2.x)
  // ===========================================

  /** Standard envelope returned by /panel/api/* (Modern API) endpoints. */
  export interface ModernApiResponse<T = any> {
    success: boolean;
    msg: string;
    obj: T;
  }

  export interface ModernClient {
    id?: number;
    email: string;
    subId?: string;
    uuid?: string;
    password?: string;
    flow?: string;
    security?: string;
    limitIp?: number;
    /** Data limit in gigabytes (auto-converted to bytes internally) */
    totalGB?: number;
    expiryTime?: number;
    enable?: boolean;
    tgId?: number | string;
    group?: string;
    comment?: string;
    reset?: number;
    createdAt?: number;
    updatedAt?: number;
    [key: string]: any;
  }

  export interface ModernClientDetail {
    client: ModernClient;
    inboundIds: number[];
  }

  export interface ModernClientTraffic {
    id: number;
    inboundId: number;
    enable: boolean;
    email: string;
    uuid?: string;
    subId?: string;
    up: number;
    down: number;
    expiryTime: number;
    total: number;
    reset: number;
    lastOnline: number;
  }

  export interface PagedClientsResult {
    items: Array<ModernClient & { traffic?: ModernClientTraffic }>;
    total: number;
    filtered: number;
    page: number;
    pageSize: number;
    summary?: Record<string, any>;
  }

  export interface AddModernClientPayload {
    inboundIds: number[];
    client: ModernClient;
  }

  export interface BulkCreateClientEntry {
    inboundIds: number[];
    client: ModernClient;
  }

  export interface BulkSkipReport {
    email: string;
    reason: string;
  }

  export interface BulkCreateResult {
    created: number;
    skipped?: BulkSkipReport[];
  }

  export interface BulkAdjustPayload {
    emails: string[];
    /** Days to add (or subtract, if negative) to expiryTime. Clients with unlimited expiry (0) are skipped. */
    addDays?: number;
    /** Bytes to add (or subtract, if negative) to totalGB. Clients with unlimited traffic (0) are skipped. */
    addBytes?: number;
  }

  export interface BulkAdjustResult {
    adjusted: number;
    skipped?: BulkSkipReport[];
  }

  export interface BulkDeleteResult {
    deleted: number;
    skipped?: BulkSkipReport[];
  }

  export interface BulkAttachDetachResult {
    attached?: string[] | null;
    detached?: string[] | null;
    skipped?: string[] | null;
    errors?: string[];
  }

  export interface BulkAffectedResult {
    affected: number;
  }

  export interface ModernGroup {
    name: string;
    clientCount: number;
    trafficUsed: number;
  }

  export interface CustomGeoResource {
    id: number;
    type: 'geosite' | 'geoip';
    alias: string;
    url: string;
    localPath?: string;
    lastUpdatedAt?: number;
    lastModified?: string;
    createdAt?: number;
    updatedAt?: number;
  }

  export interface AddCustomGeoPayload {
    type: 'geosite' | 'geoip';
    alias: string;
    url: string;
  }

  export interface AddNodePayload {
    name: string;
    remark?: string;
    /** URL scheme of the node's panel, e.g. 'http' | 'https'. */
    scheme: string;
    address: string;
    port: number;
    /** Base path of the node's panel (must end with '/'), e.g. '/abc123/'. */
    basePath: string;
    /** Required - the API token configured on the target node's panel. */
    apiToken: string;
    enable?: boolean;
    /** Required to register a node at a private/internal address (e.g. self-registration). */
    allowPrivateAddress?: boolean;
    /** TLS certificate verification mode for connecting to the node, e.g. 'verify' | 'skip'. */
    tlsVerifyMode?: string;
    /** Pinned certificate SHA-256 fingerprint, used when tlsVerifyMode requires pinning. */
    pinnedCertSha256?: string;
    [key: string]: any;
  }

  export interface NodeData {
    id: number;
    name: string;
    remark: string;
    scheme: string;
    address: string;
    port: number;
    basePath: string;
    apiToken: string;
    enable: boolean;
    allowPrivateAddress: boolean;
    tlsVerifyMode: string;
    pinnedCertSha256: string;
    guid: string;
    status: string;
    lastHeartbeat: number;
    latencyMs: number;
    xrayVersion: string;
    panelVersion: string;
    cpuPct: number;
    memPct: number;
    uptimeSecs: number;
    lastError: string;
    xrayState: string;
    xrayError: string;
    configDirty: boolean;
    configDirtyAt: number;
    inboundCount: number;
    clientCount: number;
    onlineCount: number;
    depletedCount: number;
    createdAt: number;
    updatedAt: number;
    [key: string]: any;
  }

  export interface NodeHistoryPoint {
    /** Unix timestamp in seconds */
    t: number;
    /** Metric value at time `t` */
    v: number;
  }

  export interface TestNodeResult {
    status: 'online' | 'offline' | string;
    latencyMs: number;
    xrayVersion: string;
    panelVersion: string;
    cpuPct: number;
    memPct: number;
    uptimeSecs: number;
    error: string;
    xrayState: string;
    xrayError: string;
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
    /** Data limit in gigabytes (auto-converted to bytes internally) */
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
    constructor(baseURL: string, options: ThreeXUIOptions);
    
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
    
    // Security helpers
    getSecurityStats(): any;
    clearBlockedIPs(): void;
    validateCredentialStrength(credential: string, type: 'password' | 'uuid' | 'port'): { isValid: boolean; issues: string[]; strength: 'weak' | 'medium' | 'strong' };
    generateSecureToken(): string;
    setDevelopmentMode(enabled: boolean): void;

    // Enhanced Client Management
    addClientWithCredentials(inboundId: number, protocol: string, options?: CredentialOptions): Promise<any>;
    updateClientWithCredentials(clientId: string, inboundId: number, options?: CredentialOptions): Promise<any>;

    // Session Management
    getSessionStats(): Promise<any>;
    clearAllSessions(): Promise<void>;
    isSessionValid(): Promise<boolean>;

    // ===========================================
    // Modern API Methods (3X-UI >= 2.x)
    // ===========================================

    // --- Clients ---
    getClients(): Promise<ModernApiResponse<ModernClient[]>>;
    getPagedClients(params?: {
        page?: number;
        size?: number;
        sort?: string;
        order?: 'asc' | 'desc';
        email?: string;
    }): Promise<ModernApiResponse<PagedClientsResult>>;
    getClient(email: string): Promise<ModernApiResponse<ModernClientDetail>>;
    getClientTraffic(email: string): Promise<ModernApiResponse<ModernClientTraffic>>;
    getSubLinks(subId: string): Promise<ModernApiResponse<string[]>>;
    getClientLinks(email: string): Promise<ModernApiResponse<string[]>>;
    addModernClient(data: AddModernClientPayload): Promise<ModernApiResponse<null>>;
    updateModernClient(email: string, data: Partial<ModernClient>): Promise<ModernApiResponse<null>>;
    deleteModernClient(email: string): Promise<ModernApiResponse<null>>;
    attachClientToInbounds(email: string, data: { inboundIds: number[] }): Promise<ModernApiResponse<any>>;
    detachClientFromInbounds(email: string, data: { inboundIds: number[] }): Promise<ModernApiResponse<any>>;
    resetAllModernClientTraffics(): Promise<ModernApiResponse<null>>;
    deleteDepletedModernClients(): Promise<ModernApiResponse<{ deleted: number }>>;
    bulkAdjustModernClients(data: BulkAdjustPayload): Promise<ModernApiResponse<BulkAdjustResult>>;
    bulkDeleteModernClients(data: { emails: string[] }): Promise<ModernApiResponse<BulkDeleteResult>>;
    bulkCreateModernClients(data: BulkCreateClientEntry[]): Promise<ModernApiResponse<BulkCreateResult>>;
    bulkAttachModernClients(data: { emails: string[]; inboundIds: number[] }): Promise<ModernApiResponse<BulkAttachDetachResult>>;
    bulkDetachModernClients(data: { emails: string[]; inboundIds: number[] }): Promise<ModernApiResponse<BulkAttachDetachResult>>;
    bulkResetTrafficModernClients(data: { emails: string[] }): Promise<ModernApiResponse<BulkAffectedResult>>;
    resetModernClientTrafficByEmail(email: string): Promise<ModernApiResponse<null>>;
    updateModernClientTrafficByEmail(email: string, data: { up: number; down: number }): Promise<ModernApiResponse<null>>;
    getModernClientIps(email: string): Promise<ModernApiResponse<string[] | string>>;
    clearModernClientIps(email: string): Promise<ModernApiResponse<null>>;
    getOnlines(): Promise<ModernApiResponse<string[]>>;
    getModernLastOnline(): Promise<ModernApiResponse<Record<string, number>>>;

    // --- Client Groups ---
    getGroups(): Promise<ModernApiResponse<ModernGroup[]>>;
    getGroupEmails(groupName: string): Promise<ModernApiResponse<string[]>>;
    createGroup(data: { name: string }): Promise<ModernApiResponse<any>>;
    renameGroup(data: { oldName: string; newName: string }): Promise<ModernApiResponse<any>>;
    deleteGroup(data: { name: string }): Promise<ModernApiResponse<any>>;
    bulkAddGroups(data: { emails: string[]; group: string }): Promise<ModernApiResponse<BulkAffectedResult>>;
    bulkRemoveGroups(data: { emails: string[] }): Promise<ModernApiResponse<BulkAffectedResult>>;

    // --- Nodes ---
    getNodes(): Promise<ModernApiResponse<NodeData[]>>;
    getNode(id: number | string): Promise<ModernApiResponse<NodeData>>;
    getNodeHistory(id: number | string, metric: string, bucket: number | string): Promise<ModernApiResponse<NodeHistoryPoint[]>>;
    addNode(data: AddNodePayload): Promise<ModernApiResponse<NodeData>>;
    updateNode(id: number | string, data: Partial<AddNodePayload>): Promise<ModernApiResponse<null>>;
    deleteNode(id: number | string): Promise<ModernApiResponse<null>>;
    setNodeEnable(id: number | string, enable?: boolean): Promise<ModernApiResponse<null>>;
    testNode(data: AddNodePayload | { address: string; port: number; [key: string]: any }): Promise<ModernApiResponse<TestNodeResult>>;
    probeNode(id: number | string): Promise<ModernApiResponse<TestNodeResult>>;

    // --- Custom Geo ---
    getCustomGeos(): Promise<ModernApiResponse<CustomGeoResource[]>>;
    getGeoAliases(): Promise<ModernApiResponse<{ geosite: string[] | null; geoip: string[] | null }>>;
    addCustomGeo(data: AddCustomGeoPayload): Promise<ModernApiResponse<null>>;
    updateCustomGeo(id: string | number, data: AddCustomGeoPayload): Promise<ModernApiResponse<null>>;
    deleteCustomGeo(id: string | number): Promise<ModernApiResponse<any>>;
    downloadCustomGeo(id: string | number): Promise<ModernApiResponse<any>>;
    updateAllCustomGeo(): Promise<ModernApiResponse<{ succeeded: string[] | null; failed: string[] | null }>>;

    // ===========================================
    // Original API Methods
    // ===========================================
    getInbounds(): Promise<any>;
    getInbound(id: number): Promise<any>;
    addInbound(inboundConfig: InboundConfig): Promise<any>;
    deleteInbound(id: number): Promise<any>;
    updateInbound(id: number, inboundConfig: InboundConfig): Promise<any>;
    importInbounds(inbounds: InboundConfig | InboundConfig[]): Promise<any[]>;
    getLastOnline(): Promise<any>;
    addClient(clientConfig: ClientConfig): Promise<any>;
    deleteClient(inboundId: number, clientId: string): Promise<any>;
    updateClient(clientId: string, clientConfig: ClientConfig): Promise<any>;
    /** @param trafficConfig.totalGB Data limit in gigabytes (auto-converted to bytes internally) */
    updateClientTraffic(email: string, trafficConfig: { totalGB?: number; expiryTime?: number }): Promise<any>;
    deleteClientByEmail(inboundId: number, email: string): Promise<any>;
    getClientTrafficsByEmail(email: string): Promise<any>;
    getClientTrafficsById(id: string): Promise<any>;
    getClientIps(email: string): Promise<any>;
    clearClientIps(email: string): Promise<any>;
    resetClientTraffic(inboundId: number, email: string): Promise<any>;
    resetAllTraffics(): Promise<any>;
    resetAllClientTraffics(inboundId: number): Promise<any>;
    deleteDepletedClients(inboundId: number): Promise<any>;
    getOnlineClients(): Promise<any>;
    createBackup(): Promise<any>;
    backupToTgBot(): Promise<any>;

    // Server Management
    getServerStatus(): Promise<any>;
    /**
     * Get CPU usage history.
     * @param bucket - Bucket size in seconds. Must be one of: 2, 30, 60, 120, 180, 300 (default: 60)
     */
    getCPUHistory(bucket?: number): Promise<any>;
    getXrayVersion(): Promise<any>;
    getConfigJson(): Promise<any>;
    /**
     * Download database.
     * @returns Raw SQLite database file content as a string (starts with "SQLite format 3 ..."), not a Buffer
     */
    getDb(): Promise<ModernApiResponse<string>>;
    stopXrayService(): Promise<any>;
    restartXrayService(): Promise<any>;
    /**
     * Install specific Xray version.
     * @param version - Version to install (e.g., "1.8.0").
     * @throws {Error} If `version` is not a non-empty string or is "latest".
     */
    installXray(version: string): Promise<any>;
    getPanelLogs(count?: number): Promise<any>;
    getXrayLogs(count?: number): Promise<any>;
    updateGeofile(fileName?: string): Promise<any>;
    /**
     * Import database.
     * @param formData - FormData containing the database file
     */
    importDB(formData: any): Promise<any>;

    // --- Panel Settings ---
    getAllSettings(): Promise<any>;
    /**
     * Update panel settings
     * NOTE: API requires ALL settings to be sent together.
     * This method automatically fetches current settings, merges your updates, and sends all.
     * @param updates - Partial settings object (will be merged with current settings)
     * Example: updateSetting({ webPort: 7070 }) - will fetch all settings, update webPort, send all
     */
    updateSetting(updates: Record<string, any>): Promise<any>;
    /**
     * Update admin username and password
     * ⚠️ CRITICAL: This endpoint changes your login credentials.
     * After update, internal credentials are refreshed and session re-authenticated.
     * If re-authentication fails, old credentials are restored and error is thrown.
     * See test/PHASE-C-CRITICAL-FINDINGS.md for security considerations.
     */
    updateUser(oldUsername: string, oldPassword: string, newUsername: string, newPassword: string): Promise<any>;
    restartPanel(): Promise<any>;
    getDefaultSettings(): Promise<any>;
    getDefaultJsonConfig(): Promise<any>;

    // --- Xray Configuration ---
    getXrayConfig(): Promise<any>;
    /**
     * Update Xray configuration.
     * @param config - Xray configuration content (JSON string or object).
     * @throws {Error} If `config` is an invalid JSON string or not a valid object.
     */
    updateXrayConfig(config: string | object): Promise<any>;
    /**
     * Manage WARP.
     * @param action - Action to perform (data, del, config, reg, changeIp, license, interval)
     * @param data - Additional data for the action
     */
    manageWarp(action: string, data?: Record<string, any>): Promise<any>;
    getOutboundsTraffic(): Promise<any>;
    resetOutboundsTraffic(): Promise<any>;
    getXrayResult(): Promise<any>;

    // --- Server-side credential / certificate generators ---
    getNewUUID(): Promise<ModernApiResponse<{ uuid: string }>>;
    getNewX25519Cert(): Promise<ModernApiResponse<{ privateKey: string; publicKey: string; password?: string }>>;
    getNewmldsa65(): Promise<ModernApiResponse<{ verify: string; seed: string }>>;
    getNewmlkem768(): Promise<ModernApiResponse<{ seed: string; client: string }>>;
    getNewVlessEnc(): Promise<ModernApiResponse<Record<string, string>>>;
    getNewEchCert(sni?: string): Promise<ModernApiResponse<{ echServerKeys: string; echConfigList: string }>>;
    getWebCertFiles(): Promise<ModernApiResponse<any>>;
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

  // Optional: expose security helpers for advanced users
  export const SecurityEnhancer: {
    InputValidator: any;
    SecureHeaders: any;
    SecurityMonitor: any;
    CredentialSecurity: any;
    ErrorSecurity: any;
  };
}