// ─── Backwards Compatibility ───
//
// This file is kept for backwards compatibility.
// All types have been split into domain modules:
//   - ./nip11    → NIP-11 protocol types
//   - ./relay    → Relay entity, health check, DTO types
//   - ./event    → Nostr event, NIP-66/65/67 types
//   - ./directory → Directory relay, comparison, uptime types
//   - ./auth     → NIP-42 auth types
//   - ./api     → API response types
//
// Import from the domain module directly for new code:
//   import type { RelayNip11 } from '@relayscope/shared/nip11';

export * from './api';
export * from './auth';
export * from './directory';
export * from './event';
export * from './nip11';
export * from './relay';
