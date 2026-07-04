// ─── Nostr Event Types ───

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

// ─── NIP-40 Expiration Types ───

export interface ExpirationInfo {
  isExpired: boolean;
  expiresAt: Date | null;
  remainingMs: number | null;
}

// ─── NIP-67 EOSE Hint Types ───

export type EoseHint = 'finish' | 'more';

export interface EoseResult {
  subscriptionId: string;
  hints: EoseHint[];
  complete: boolean;
  hasMore: boolean;
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

// ─── NIP-66 Monitor Types ───

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
