// ─── Relay NIP-11 Types ───

export interface RelayNip11 {
  name?: string;
  description?: string;
  banner?: string;
  icon?: string;
  pubkey?: string;
  self?: string;
  contact?: string;
  supported_nips?: number[];
  software?: string;
  version?: string;
  terms_of_service?: string;
  limitation?: RelayLimitation;
  payments_url?: string;
  fees?: RelayFees;
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
  default_limit?: number;
  [key: string]: unknown;
}

export interface RelayFeeEntry {
  kinds?: number[];
  amount: number;
  unit: string;
  period?: number;
}

export interface RelayFees {
  admission?: RelayFeeEntry[];
  subscription?: RelayFeeEntry[];
  publication?: RelayFeeEntry[];
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

// ─── Relay Directory Types ───

export interface DirectoryRelay {
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
  lastHealthCheck: {
    httpReachable: boolean;
    corsConfigured: boolean;
    websocketConnectable: boolean;
    latencyMs: number | null;
    checkedAt: Date;
  } | null;
}

export interface DirectoryFilters {
  search?: string;
  nips?: number[];
  authRequired?: boolean;
  paymentRequired?: boolean;
  country?: string;
  sortBy: 'name' | 'url' | 'lastChecked' | 'latency';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface DirectoryResponse {
  relays: DirectoryRelay[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Comparison Types ───

export interface RelayComparison {
  relayA: DirectoryRelay;
  relayB: DirectoryRelay;
  diff: ComparisonDiff;
}

export interface ComparisonDiff {
  nipsOnlyInA: number[];
  nipsOnlyInB: number[];
  sharedNips: number[];
  latencyWinner: 'A' | 'B' | 'tie';
  healthWinner: 'A' | 'B' | 'tie';
}

// ─── Uptime Sparkline Types ───

export interface UptimeDataPoint {
  timestamp: Date;
  isUp: boolean;
  latencyMs: number | null;
}

export interface UptimeSparklineData {
  relayId: string;
  period: '7d' | '30d';
  dataPoints: UptimeDataPoint[];
  uptimePercent: number;
}

// ─── NIP-66 Discovery Types ───

export interface DiscoveryResult {
  relaysFound: number;
  newRelays: number;
  relayUrls: string[];
  discoveredAt: Date;
}

export interface RelayDiscovery {
  id: string;
  relayUrl: string;
  monitorPubkey: string;
  rttOpen: number | null;
  rttRead: number | null;
  rttWrite: number | null;
  networkType: string | null;
  relayType: string | null;
  supportedNips: number[];
  requirements: string[];
  topics: string[];
  geohash: string | null;
  discoveredAt: Date;
}

export interface RelayDiscoveryEvent {
  kind: 30166;
  tags: string[][];
  content: string;
  pubkey: string;
  created_at: number;
}

// ─── NIP-65 Relay List Types ───

export interface RelayListEntry {
  id: string;
  authorPubkey: string;
  relayUrl: string;
  marker: string | null;
  listedAt: Date;
}

export interface RelayListEvent {
  kind: 10002;
  tags: string[][];
  content: string;
  pubkey: string;
  created_at: number;
}

export interface RelayPopularity {
  readCount: number;
  writeCount: number;
  readers: string[];
  writers: string[];
}

// ─── NIP-67 EOSE Hint Types ───

export type EoseHint = 'finish' | 'more';

export interface EoseResult {
  subscriptionId: string;
  hints: EoseHint[];
  complete: boolean;
  hasMore: boolean;
}

// ─── NIP-40 Expiration Types ───

export interface ExpirationInfo {
  isExpired: boolean;
  expiresAt: Date | null;
  remainingMs: number | null;
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
