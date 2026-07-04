import type { RelayLimitation } from './nip11';

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
  lastDiscovery: {
    rttOpen: number | null;
    rttRead: number | null;
    rttWrite: number | null;
    networkType: string | null;
    discoveredAt: Date;
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
