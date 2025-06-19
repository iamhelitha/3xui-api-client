declare module '3xui-api-client' {
  export interface ThreeXUIResponse<T = any> {
    success: boolean;
    msg: string;
    obj: T | null;
  }

  export interface InboundConfig {
    remark: string;
    port: number;
    protocol: string;
    settings: any;
    streamSettings?: any;
    sniffing?: any;
    allocate?: any;
  }

  export interface ClientConfig {
    id: number;
    settings: string;
  }

  export interface ClientData {
    id: string;
    email: string;
    limitIp?: number;
    totalGB?: number;
    expiryTime?: number;
    enable?: boolean;
    tgId?: string;
    subId?: string;
  }

  export interface InboundData {
    id: number;
    up: number;
    down: number;
    total: number;
    remark: string;
    enable: boolean;
    expiryTime: number;
    clientStats: ClientTrafficData[] | null;
    listen: string;
    port: number;
    protocol: string;
    settings: string;
    streamSettings: string;
    tag: string;
    sniffing: string;
    allocate: string;
  }

  export interface ClientTrafficData {
    id: number;
    inboundId: number;
    enable: boolean;
    email: string;
    up: number;
    down: number;
    expiryTime: number;
    total: number;
    reset: number;
  }

  export interface OnlineClientData {
    email: string;
    ip: string;
    connectedAt: string;
  }

  export interface LoginResponse {
    success: boolean;
    headers: any;
    data: any;
  }

  export default class ThreeXUI {
    constructor(baseURL: string, username: string, password: string);
    
    // Authentication
    login(): Promise<LoginResponse>;
    
    // Inbound Management
    getInbounds(): Promise<ThreeXUIResponse<InboundData[]>>;
    getInbound(id: number): Promise<ThreeXUIResponse<InboundData>>;
    addInbound(inboundConfig: InboundConfig): Promise<ThreeXUIResponse<any>>;
    updateInbound(id: number, inboundConfig: Partial<InboundConfig>): Promise<ThreeXUIResponse<any>>;
    deleteInbound(id: number): Promise<ThreeXUIResponse<number>>;
    
    // Client Management
    addClient(clientConfig: ClientConfig): Promise<ThreeXUIResponse<null>>;
    updateClient(clientId: string, clientConfig: ClientConfig): Promise<ThreeXUIResponse<null>>;
    deleteClient(inboundId: number, clientId: string): Promise<ThreeXUIResponse<null>>;
    getClientTrafficsByEmail(email: string): Promise<ThreeXUIResponse<ClientTrafficData>>;
    getClientTrafficsById(id: string): Promise<ThreeXUIResponse<ClientTrafficData[]>>;
    getClientIps(email: string): Promise<ThreeXUIResponse<string>>;
    clearClientIps(email: string): Promise<ThreeXUIResponse<null>>;
    
    // Traffic Management
    resetClientTraffic(inboundId: number, email: string): Promise<ThreeXUIResponse<null>>;
    resetAllTraffics(): Promise<ThreeXUIResponse<null>>;
    resetAllClientTraffics(inboundId: number): Promise<ThreeXUIResponse<null>>;
    deleteDepletedClients(inboundId: number): Promise<ThreeXUIResponse<null>>;
    
    // System Operations
    getOnlineClients(): Promise<ThreeXUIResponse<OnlineClientData[]>>;
    createBackup(): Promise<ThreeXUIResponse<string>>;
  }
} 