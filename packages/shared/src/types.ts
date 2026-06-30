// ─── Relay NIP-11 Types ───

export interface RelayNip11 {
  name?: string;
  description?: string;
  icon?: string;
  software?: string;
  version?: string;
  supported_nips?: number[];
  limitation?: RelayLimitation;
  posting_limit?: Record<string, unknown>;
  relay_limitation?: Record<string, unknown>;
  tags?: string[][];
  [key: string]: unknown;
}

export interface RelayLimitation {
  max_message_length?: number;
  max_subscriptions?: number;
  max_filters?: number;
  max_limit?: number;
  max_subid_length?: number;
  max_event_tags?: number;
  max_content_length?: number;
  min_pow_difficulty?: number;
  auth_required?: boolean;
  payment_required?: boolean;
  restricted_writes?: boolean;
  created_at_lower_limit?: number;
  created_at_upper_limit?: number;
  [key: string]: unknown;
}

// ─── Database Entity Types ───

export interface Relay {
  id: string;
  url: string;
  name: string | null;
  description: string | null;
  icon: string | null;
  software: string | null;
  version: string | null;
  supportedNips: number[];
  limitations: RelayLimitation | null;
  country: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RelayInfoSnapshot {
  id: string;
  relayId: string;
  nip11: RelayNip11;
  rawJson: Record<string, unknown>;
  fetchedAt: Date;
}

export interface HealthCheck {
  id: string;
  relayId: string;
  httpReachable: boolean;
  corsConfigured: boolean;
  websocketConnectable: boolean;
  latencyMs: number | null;
  httpStatusCode: number | null;
  errorMessage: string | null;
  checkedAt: Date;
}

export interface RelayEvent {
  id: string;
  relayId: string;
  nostrEventId: string;
  pubkey: string;
  kind: number;
  content: string;
  tags: string[][];
  createdAt: Date;
  receivedAt: Date;
}

export interface MonitoringJob {
  id: string;
  relayId: string;
  enabled: boolean;
  intervalMs: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
}

// ─── API Response Types ───

export interface RelayWithHealth extends Relay {
  lastHealthCheck?: HealthCheck | null;
  latestInfo?: RelayInfoSnapshot | null;
}

export interface RelayCompare {
  relayA: RelayWithHealth;
  relayB: RelayWithHealth;
}

// ─── WebSocket Event Types ───

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export type NostrMessageType =
  | { type: 'EVENT'; subscriptionId: string; event: NostrEvent }
  | { type: 'NOTICE'; message: string }
  | { type: 'EOSE'; subscriptionId: string }
  | { type: 'CLOSED'; subscriptionId: string; reason: string }
  | { type: 'AUTH'; challenge: string };

// ─── NIP-42 AUTH Types ───

export type AuthStatus =
  | 'anonymous'
  | 'auth_required'
  | 'authenticating'
  | 'authenticated'
  | 'auth_failed';

export interface AuthState {
  status: AuthStatus;
  challenge: string | null;
  error: string | null;
  pubkey: string | null;
}

export interface AuthEvent {
  kind: 22242;
  content: '';
  tags: ['relay', string][];
  created_at: number;
  pubkey: string;
  sig: string;
  id: string;
}

// ─── Latency & Health Metrics ───

export interface LatencyMetrics {
  wsRoundTripMs: number | null;
  httpLatencyMs: number | null;
  eoseTimeMs: number | null;
  eoseEventCount: number;
}

export interface FeeInfo {
  admission: number | null;
  subscription: number | null;
  perEvent: number | null;
  currency: string; // 'sats' or 'usd'
}

// ─── Write Test ───

export type WriteTestStatus = 'idle' | 'testing' | 'success' | 'failed';

export interface WriteTestResult {
  status: WriteTestStatus;
  latencyMs: number | null;
  error: string | null;
  eventId: string | null;
}

// ─── NIP Info Display ───

export interface NipDisplayInfo {
  number: number;
  name: string;
  description: string;
  color: string;
  url: string;
}

// ─── Connection Check ───

export type CheckStatus = 'pending' | 'success' | 'error' | 'checking';

export interface ConnectionStatus {
  http: CheckStatus;
  cors: CheckStatus;
  websocket: CheckStatus;
  httpDetail?: string;
  corsDetail?: string;
  wsDetail?: string;
  latencyMs?: number;
}

// ─── Relay Directory / NIP-66 Types ───

export interface RelayMonitorAnnouncement {
  pubkey: string;
  relayUrl: string;
  monitoringRelays: string[];
  supportedNips: number[];
}

export interface RelayLiveness {
  relayUrl: string;
  isOnline: boolean;
  lastSeen: Date;
  monitoredBy: string[];
}

// ─── Request/Response DTOs ───

export interface CreateRelayDto {
  url: string;
  name?: string;
  isPublic?: boolean;
}

export interface UpdateRelayDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
  country?: string;
}

export interface RelayQueryParams {
  search?: string;
  nips?: number[];
  authRequired?: boolean;
  paymentRequired?: boolean;
  isOnline?: boolean;
  country?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'url' | 'lastChecked' | 'latency';
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
