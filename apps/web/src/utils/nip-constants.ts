/**
 * Shared NIP metadata for display across the app.
 * Used by NipBadgeGrid (popover details) and FilterBar (combobox search).
 *
 * Colors come in light/dark pairs validated for WCAG AA contrast:
 *   - Light variants: dark text on light backgrounds (≥4.5:1 on white)
 *   - Dark variants: light text on dark backgrounds (≥4.5:1 on oklch(15.5%))
 */
export const NIP_INFO: Record<
  number,
  { name: string; desc: string; color: string; colorDark: string }
> = {
  0: { name: 'NIP-01', desc: 'Basic protocol flow', color: '#1d4ed8', colorDark: '#60a5fa' },
  1: { name: 'NIP-02', desc: 'Contact List', color: '#1d4ed8', colorDark: '#60a5fa' },
  2: { name: 'NIP-03', desc: 'OpenTimestamps', color: '#1d4ed8', colorDark: '#60a5fa' },
  4: { name: 'NIP-04', desc: 'Encrypted Direct Messages', color: '#be185d', colorDark: '#f472b6' },
  5: { name: 'NIP-05', desc: 'DNS-Based Identity', color: '#047857', colorDark: '#34d399' },
  9: { name: 'NIP-09', desc: 'Event Deletion', color: '#b91c1c', colorDark: '#f87171' },
  11: { name: 'NIP-11', desc: 'Relay Information', color: '#7c3aed', colorDark: '#c084fc' },
  12: { name: 'NIP-12', desc: 'Generic Tag Queries', color: '#1d4ed8', colorDark: '#60a5fa' },
  14: { name: 'NIP-14', desc: 'Subject Tag', color: '#1d4ed8', colorDark: '#60a5fa' },
  15: { name: 'NIP-15', desc: 'End of Stored Events', color: '#1d4ed8', colorDark: '#60a5fa' },
  16: { name: 'NIP-16', desc: 'Event Treatment', color: '#1d4ed8', colorDark: '#60a5fa' },
  17: { name: 'NIP-17', desc: 'Private DMs', color: '#be185d', colorDark: '#f472b6' },
  18: { name: 'NIP-18', desc: 'Reposts', color: '#1d4ed8', colorDark: '#60a5fa' },
  19: { name: 'NIP-19', desc: 'Bech32 Encoded Entities', color: '#a16207', colorDark: '#fbbf24' },
  20: { name: 'NIP-20', desc: 'Command Results', color: '#1d4ed8', colorDark: '#60a5fa' },
  21: { name: 'NIP-21', desc: 'nostr: URI Scheme', color: '#a16207', colorDark: '#fbbf24' },
  22: { name: 'NIP-22', desc: 'Event Created At', color: '#1d4ed8', colorDark: '#60a5fa' },
  23: { name: 'NIP-23', desc: 'Long-form Content', color: '#047857', colorDark: '#34d399' },
  24: { name: 'NIP-24', desc: 'Extra Event Tags', color: '#1d4ed8', colorDark: '#60a5fa' },
  25: { name: 'NIP-25', desc: 'Reactions', color: '#c2410c', colorDark: '#fb923c' },
  28: { name: 'NIP-28', desc: 'Public Chat', color: '#1d4ed8', colorDark: '#60a5fa' },
  33: { name: 'NIP-33', desc: 'Parameterized Replaceable', color: '#1d4ed8', colorDark: '#60a5fa' },
  40: { name: 'NIP-40', desc: 'Expiration Timestamp', color: '#1d4ed8', colorDark: '#60a5fa' },
  42: { name: 'NIP-42', desc: 'Relay Authentication', color: '#b91c1c', colorDark: '#f87171' },
  44: { name: 'NIP-44', desc: 'Versioned Encryption', color: '#be185d', colorDark: '#f472b6' },
  45: { name: 'NIP-45', desc: 'Counting Events', color: '#1d4ed8', colorDark: '#60a5fa' },
  50: { name: 'NIP-50', desc: 'Keywords Filter', color: '#047857', colorDark: '#34d399' },
  51: { name: 'NIP-51', desc: 'Lists', color: '#c2410c', colorDark: '#fb923c' },
  52: { name: 'NIP-52', desc: 'Calendar Events', color: '#c2410c', colorDark: '#fb923c' },
  53: { name: 'NIP-53', desc: 'Live Activities', color: '#c2410c', colorDark: '#fb923c' },
  56: { name: 'NIP-56', desc: 'Reporting', color: '#b91c1c', colorDark: '#f87171' },
  57: { name: 'NIP-57', desc: 'Zaps', color: '#a16207', colorDark: '#fbbf24' },
  58: { name: 'NIP-58', desc: 'Badges', color: '#c2410c', colorDark: '#fb923c' },
  59: { name: 'NIP-59', desc: 'Gift Wrapping', color: '#be185d', colorDark: '#f472b6' },
  60: { name: 'NIP-60', desc: 'Cashu Wallets', color: '#a16207', colorDark: '#fbbf24' },
  61: { name: 'NIP-61', desc: 'Nutzap', color: '#a16207', colorDark: '#fbbf24' },
  62: { name: 'NIP-62', desc: 'Request to Wallet', color: '#a16207', colorDark: '#fbbf24' },
  65: { name: 'NIP-65', desc: 'Relay List Metadata', color: '#047857', colorDark: '#34d399' },
  66: { name: 'NIP-66', desc: 'Relay Discovery', color: '#047857', colorDark: '#34d399' },
  78: { name: 'NIP-78', desc: 'Application-specific Data', color: '#1d4ed8', colorDark: '#60a5fa' },
};

/** Sorted list of all known NIPs for combobox options */
export const NIP_OPTIONS = Object.entries(NIP_INFO)
  .map(([num, info]) => ({
    value: Number(num),
    label: `${info.name} — ${info.desc}`,
    searchText: `NIP-${num} ${info.name} ${info.desc}`.toLowerCase(),
  }))
  .sort((a, b) => a.value - b.value);
