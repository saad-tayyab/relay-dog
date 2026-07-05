/**
 * Shared NIP metadata for display across the app.
 * Used by NipBadgeGrid (popover details) and FilterBar (combobox search).
 *
 * Colors are organized by semantic category rather than raw hex.
 * Each category maps to CSS custom properties (--nip-{category}) that
 * automatically adapt to light/dark mode and stay consistent with the
 * app's OKLCH token system.
 */
export type NipCategory = 'protocol' | 'dm' | 'identity' | 'deletion' | 'relay' | 'zap' | 'social';

export const NIP_INFO: Record<number, { name: string; desc: string; category: NipCategory }> = {
  0: { name: 'NIP-01', desc: 'Basic protocol flow', category: 'protocol' },
  1: { name: 'NIP-02', desc: 'Contact List', category: 'protocol' },
  2: { name: 'NIP-03', desc: 'OpenTimestamps', category: 'protocol' },
  4: { name: 'NIP-04', desc: 'Encrypted Direct Messages', category: 'dm' },
  5: { name: 'NIP-05', desc: 'DNS-Based Identity', category: 'identity' },
  9: { name: 'NIP-09', desc: 'Event Deletion', category: 'deletion' },
  11: { name: 'NIP-11', desc: 'Relay Information', category: 'relay' },
  12: { name: 'NIP-12', desc: 'Generic Tag Queries', category: 'protocol' },
  14: { name: 'NIP-14', desc: 'Subject Tag', category: 'protocol' },
  15: { name: 'NIP-15', desc: 'End of Stored Events', category: 'protocol' },
  16: { name: 'NIP-16', desc: 'Event Treatment', category: 'protocol' },
  17: { name: 'NIP-17', desc: 'Private DMs', category: 'dm' },
  18: { name: 'NIP-18', desc: 'Reposts', category: 'protocol' },
  19: { name: 'NIP-19', desc: 'Bech32 Encoded Entities', category: 'zap' },
  20: { name: 'NIP-20', desc: 'Command Results', category: 'protocol' },
  21: { name: 'NIP-21', desc: 'nostr: URI Scheme', category: 'zap' },
  22: { name: 'NIP-22', desc: 'Event Created At', category: 'protocol' },
  23: { name: 'NIP-23', desc: 'Long-form Content', category: 'identity' },
  24: { name: 'NIP-24', desc: 'Extra Event Tags', category: 'protocol' },
  25: { name: 'NIP-25', desc: 'Reactions', category: 'social' },
  28: { name: 'NIP-28', desc: 'Public Chat', category: 'protocol' },
  33: { name: 'NIP-33', desc: 'Parameterized Replaceable', category: 'protocol' },
  40: { name: 'NIP-40', desc: 'Expiration Timestamp', category: 'protocol' },
  42: { name: 'NIP-42', desc: 'Relay Authentication', category: 'deletion' },
  44: { name: 'NIP-44', desc: 'Versioned Encryption', category: 'dm' },
  45: { name: 'NIP-45', desc: 'Counting Events', category: 'protocol' },
  50: { name: 'NIP-50', desc: 'Keywords Filter', category: 'identity' },
  51: { name: 'NIP-51', desc: 'Lists', category: 'social' },
  52: { name: 'NIP-52', desc: 'Calendar Events', category: 'social' },
  53: { name: 'NIP-53', desc: 'Live Activities', category: 'social' },
  56: { name: 'NIP-56', desc: 'Reporting', category: 'deletion' },
  57: { name: 'NIP-57', desc: 'Zaps', category: 'zap' },
  58: { name: 'NIP-58', desc: 'Badges', category: 'social' },
  59: { name: 'NIP-59', desc: 'Gift Wrapping', category: 'dm' },
  60: { name: 'NIP-60', desc: 'Cashu Wallets', category: 'zap' },
  61: { name: 'NIP-61', desc: 'Nutzap', category: 'zap' },
  62: { name: 'NIP-62', desc: 'Request to Wallet', category: 'zap' },
  65: { name: 'NIP-65', desc: 'Relay List Metadata', category: 'identity' },
  66: { name: 'NIP-66', desc: 'Relay Discovery', category: 'identity' },
  78: { name: 'NIP-78', desc: 'Application-specific Data', category: 'protocol' },
};

/**
 * Resolve a NIP category to CSS variable references for inline styling.
 * Returns { main, bg, border } as `var(--nip-{category}[-suffix])` strings
 * that automatically adapt to light/dark mode.
 */
const CATEGORY_VARS: Record<NipCategory, { main: string; bg: string; border: string }> = {
  protocol: {
    main: 'var(--nip-protocol)',
    bg: 'var(--nip-protocol-bg)',
    border: 'var(--nip-protocol-border)',
  },
  dm: { main: 'var(--nip-dm)', bg: 'var(--nip-dm-bg)', border: 'var(--nip-dm-border)' },
  identity: {
    main: 'var(--nip-identity)',
    bg: 'var(--nip-identity-bg)',
    border: 'var(--nip-identity-border)',
  },
  deletion: {
    main: 'var(--nip-deletion)',
    bg: 'var(--nip-deletion-bg)',
    border: 'var(--nip-deletion-border)',
  },
  relay: { main: 'var(--nip-relay)', bg: 'var(--nip-relay-bg)', border: 'var(--nip-relay-border)' },
  zap: { main: 'var(--nip-zap)', bg: 'var(--nip-zap-bg)', border: 'var(--nip-zap-border)' },
  social: {
    main: 'var(--nip-social)',
    bg: 'var(--nip-social-bg)',
    border: 'var(--nip-social-border)',
  },
};

const DEFAULT_CATEGORY: NipCategory = 'protocol';

/**
 * Get inline style object for a NIP badge based on its category.
 * Use in Svelte: style={getNipStyle(info?.category)}
 */
export function getNipStyle(category?: NipCategory): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} {
  const vars = CATEGORY_VARS[category ?? DEFAULT_CATEGORY];
  return { backgroundColor: vars.bg, color: vars.main, borderColor: vars.border };
}

/** Sorted list of all known NIPs for combobox options */
export const NIP_OPTIONS = Object.entries(NIP_INFO)
  .map(([num, info]) => ({
    value: Number(num),
    label: `${info.name} — ${info.desc}`,
    searchText: `NIP-${num} ${info.name} ${info.desc}`.toLowerCase(),
  }))
  .sort((a, b) => a.value - b.value);
