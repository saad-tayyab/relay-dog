import type { RelayFees, RelayLimitation, RelayNip11 } from './nip11';

// ─── Relay Entity Types ───

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
  banner: string | null;
  pubkey: string | null;
  self: string | null;
  contact: string | null;
  termsOfService: string | null;
  paymentsUrl: string | null;
  fees: RelayFees | null;
}

export interface RelayInfoSnapshot {
  id: string;
  relayId: string;
  nip11: RelayNip11;
  rawJson: Record<string, unknown>;
  fetchedAt: Date;
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

// ─── API Response Types ───

export interface RelayWithHealth extends Relay {
  latestInfo?: RelayInfoSnapshot | null;
}

export interface RelayCompare {
  relayA: RelayWithHealth;
  relayB: RelayWithHealth;
}

// ─── Latency & Health Metrics ───

export interface LatencyMetrics {
  wsRoundTripMs: number | null;
  httpLatencyMs: number | null;
  eoseTimeMs: number | null;
  eoseEventCount: number;
}

/**
 * @deprecated Use `RelayFees` with `RelayFeeEntry` instead. Not a real NIP-11 field.
 * Kept for backwards compatibility — will be removed in a future version.
 */
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

// ─── NIP Info Display ───

export interface NipDisplayInfo {
  number: number;
  name: string;
  description: string;
  color: string;
  url: string;
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
