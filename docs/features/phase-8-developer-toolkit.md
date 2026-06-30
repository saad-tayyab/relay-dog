# 🛠️ Phase 8: Developer Toolkit Expansion

## Status

**Complete** ✅ (2026-07-01)

## Overview

Expand relay-dog from a relay inspector into a complete **Nostr developer toolkit**. Adds six new standalone tools — Key Converter, NIP-05 Checker, QR Code Generator, Event Publisher, Event Deleter, and Event Backup — plus a restructured app navigation to accommodate them.

This phase responds to a competitive analysis of [NostrDeck](https://www.nostrdeck.com/#premium), which offers similar tools but with shallower functionality. Our advantage is **developer depth** — every tool pairs with our existing relay inspection infrastructure for a tighter debugging workflow.

## User Stories

1. **As a developer**, I want to convert between npub, nsec, and hex key formats so I don't have to use a separate site.
2. **As a developer**, I want to verify a NIP-05 identifier independently so I can check identity resolution without pasting a full event.
3. **As a developer**, I want to generate QR codes for npub keys and relay URLs so I can share them easily.
4. **As a developer**, I want to compose and publish Nostr events from the browser so I can create test events during debugging.
5. **As a developer**, I want to mass-delete events from relays via NIP-09 so I can clean up test data after debugging sessions.
6. **As a developer**, I want to backup my events to a file and restore them later so I don't lose data when switching relays.

## Features

### 1. Key Converter

Convert between Nostr key formats in any direction.

**Supported conversions:**
- **npub** (bech32 public key) ↔ **hex** (64-char public key)
- **nsec** (bech32 private key) ↔ **hex** (64-char private key)
- Display all three formats simultaneously for any input
- Copy-to-clipboard button for each format

**Safety:**
- nsec/private key input shows a **⚠ warning banner** — "Never share your nsec with anyone"
- nsec display uses a visibility toggle (hidden by default)
- No keys are sent anywhere — all conversion is client-side via `@noble/hashes` bech32 encoding

**Input handling:**
- Auto-detect input format (npub/nsec/hex prefix detection)
- Invalid key shows inline validation error
- Supports both uppercase and lowercase hex

**NIPs:** NIP-19 (bech32 encoded keys)

### 2. NIP-05 Checker

Standalone NIP-05 identity verification tool. (Extracts and extends the NIP-05 check logic already in the Event Verifier.)

**Input:** Paste any NIP-05 identifier (e.g., `alice@example.com`)

**What it does:**
1. Parse the identifier into `local` and `domain` parts
2. Fetch `https://<domain>/.well-known/nostr.json?name=<local>`
3. Verify the response contains the expected pubkey mapping
4. Display verification result with details

**Results panel:**
- ✅ **Verified** — pubkey matches, DNS resolved correctly
- ❌ **Failed** — show specific failure (DNS error, pubkey mismatch, invalid response)
- ⚠️ **Partial** — NIP-05 exists but pubkey doesn't match expected input
- Display: resolved pubkey (npub + hex), domain, HTTP status code, response time

**Advanced options:**
- Optional hex pubkey input to verify against (if omitted, just check that the identifier resolves)
- Show raw JSON response from `/.well-known/nostr.json`
- History of last 5 checks (session-only, not persisted)

**NIPs:** NIP-05 (DNS Identifiers)

### 3. QR Code Generator

Generate QR codes for Nostr profiles, relay URLs, and event data.

**Input types:**
- **npub** — generates QR for profile sharing
- **Relay URL** (`wss://...`) — generates QR for relay sharing
- **Event JSON** — generates QR for sharing a specific event
- **Any text** — fallback for arbitrary content

**Output:**
- QR code rendered via `qrcode` library (no server dependency)
- Download as PNG (with white margin)
- Copy image to clipboard
- Adjustable size (200px / 300px / 500px)

**UI:**
- Paste input → auto-detect type → show preview
- Live preview updates as input changes
- "Share" button context-aware (copies appropriate format)

### 4. Event Publisher

Compose, sign, and publish Nostr events to any relay. The developer-friendly counterpart to the Event Verifier — create test events instead of just inspecting them.

**Composer UI:**
- **Kind selector**: Numeric input with preset buttons for common kinds (0, 1, 3, 5, 7, 27676)
- **Content textarea**: Raw text input with character count and max-length indicator (from relay NIP-11 limitations)
- **Tags editor**: Add/remove/reorder tags. Pre-filled tag templates:
  - `e` — Event reference (with event ID input)
  - `p` — Profile reference (with pubkey input)
  - `t` — Hashtag
  - `d` — Replaceable event coordinate
  - Custom tags (freeform key-value pairs)
- **Created at**: Auto-filled with current timestamp, editable
- **Target relay**: Select from recently inspected relays, or paste any relay URL

**Signing & Publishing:**
- Sign via NIP-07 browser extension (`window.nostr.signEvent`)
- Show signed event JSON before publishing (review step)
- Publish to selected relay via WebSocket `["EVENT", event]`
- Display relay response: OK (with event ID) or error
- Latency measurement: time from publish → OK response

**Pre-fill from Verifier:**
- "Edit & Re-publish" button on Event Verifier tab → pre-fills composer with the verified event (minus sig/id, since it will be re-signed)

**NIPs:** NIP-01 (event structure), NIP-07 (browser signing)

### 5. Event Deleter (NIP-09)

Mass-delete events from relays by publishing kind 5 (deletion) events.

**Input modes:**
1. **Manual**: Paste event IDs (comma-separated or newline-separated)
2. **From Stream**: Select events from the Live Stream tab (checkboxes on each EventCard)
3. **From Verifier**: "Delete this event" button on verified events

**What it does:**
1. Collect event IDs to delete
2. Optionally add a reason in the kind 5 content field
3. Sign kind 5 event via NIP-07
4. Publish to target relay(s)
5. Display results: how many relays accepted the deletion

**Target relay selection:**
- Single relay (from inspector context)
- All connected relays (if multiple are open)
- Custom relay URL input

**Safety:**
- Confirmation dialog before publishing deletions: "Delete N events from relay X?"
- Show the kind 5 event JSON before sending
- Note: "Deletion is a request — relays may not honor it"

**NIPs:** NIP-09 (Event Deletion)

### 6. Event Backup & Restore

Backup Nostr events to a file and restore them to any relay.

**Backup:**
- **Source**: Select author pubkey (hex or npub)
- **Filter options**:
  - Event kinds (checkboxes: 0, 1, 3, 7, etc.)
  - Date range (since/until)
  - Limit (max events to backup)
- **Relay source**: Which relay(s) to fetch from (use currently inspected relay, or add custom)
- Subscribe via REQ → collect events → export as JSON
- **Export format**: Standard JSON array of Nostr events (NIP-01 compliant)
- **Filename**: `nostr-backup-<pubkey-short>-<date>.json`

**Restore:**
- Upload JSON file (drag & drop or file picker)
- Parse and validate events (check signatures via Event Verifier logic)
- Preview: Show event count, kinds breakdown, date range
- Select target relay
- Publish events sequentially via NIP-07 signing
- Progress bar: "Restored 47 / 120 events..."
- Skip already-existing events (check by event ID via REQ filter)

**NIPs:** NIP-01 (event structure), NIP-07 (browser signing)

## App Navigation Restructure

Move from single-page tabs to a **section-based navigation** to accommodate the expanded toolkit.

### Current structure (Phases 1–7):
```
[ NIP-11 Info | Live Stream | 🔐 Verifier | 📂 Directory ]
```

### New structure (Phase 8):
```
⚡ Inspector  |  🔐 Verifier  |  ✍️ Publisher  |  🧰 Tools  |  📂 Directory
```

**Inspector** (rename of current "NIP-11 Info" tab):
- NIP-11 Info, Connection Status, Latency, Write Test, Fee Display

**Live Stream** (sub-view within Inspector):
- Accessible via a "Live Stream" button/panel inside the Inspector section
- Still has WebSocket connection, filter builder, event feed

**Verifier** (current, unchanged):
- Event Verifier tab content

**Publisher** (new):
- Event Publisher, Event Deleter

**Tools** (new section, sub-tabs):
- Key Converter
- NIP-05 Checker
- QR Code Generator
- Event Backup & Restore

**Directory** (current, unchanged):
- Relay directory, comparison

### Implementation approach:
- Use URL hash routing (`#inspector`, `#verifier`, `#publisher`, `#tools`, `#directory`)
- Each section is a top-level component rendered conditionally
- Deep-linking supported: `relayscope.app/#tools?key-converter`
- Mobile: hamburger menu or bottom nav bar

## Technical Details

### Current Component Structure (as of Phase 7)

```
apps/web/src/
├── App.svelte                              # Main app (467 lines, tab-based routing)
├── components/
│   ├── verifier/                           # Event Verifier (subdirectory)
│   │   ├── EventVerifier.svelte
│   │   ├── EventInput.svelte
│   │   ├── VerificationPanel.svelte
│   │   ├── EventDetails.svelte
│   │   ├── TagDecoder.svelte
│   │   └── KindBadge.svelte
│   ├── AuthPrefixDisplay.svelte            # NIP-42 auth prefix display
│   ├── AuthStatusBadge.svelte              # Auth status indicator
│   ├── ComparisonView.svelte               # Side-by-side relay comparison
│   ├── ConnectionPanel.svelte              # WebSocket connection panel
│   ├── ConnectionStatusPanel.svelte        # Connection status display
│   ├── EoseIndicator.svelte                # EOSE indicator
│   ├── ErrorMessage.svelte                 # Error display with retry
│   ├── EventCard.svelte                    # Event display card
│   ├── EventFeed.svelte                    # Event feed container
│   ├── ExpiredBadge.svelte                 # NIP-40 expired event badge
│   ├── FeeDisplay.svelte                   # Relay fee display
│   ├── FilterBar.svelte                    # Filter bar for directory
│   ├── FilterBuilder.svelte                # REQ filter builder
│   ├── LatencyPanel.svelte                 # Latency measurement panel
│   ├── LimitationsPanel.svelte             # NIP-11 limitations display
│   ├── LoadingSpinner.svelte               # Loading spinner
│   ├── MonitorDataPanel.svelte             # Monitoring data display
│   ├── NipBadgeGrid.svelte                 # NIP badge grid
│   ├── RelayCard.svelte                    # Relay card for directory
│   ├── RelayDirectory.svelte               # Relay directory component
│   ├── RelayListBadge.svelte               # Relay list badge
│   ├── RelayProfile.svelte                 # Relay profile display
│   ├── SectionCard.svelte                  # Generic section card
│   ├── StatusDot.svelte                    # Status indicator dot
│   └── WriteTestPanel.svelte               # Write test panel
├── lib/
│   ├── composables/
│   │   ├── useDirectory.svelte.ts          # Directory state management
│   │   ├── useLatencyMeasurement.svelte.ts # Latency measurement
│   │   ├── useNip42Auth.svelte.ts          # NIP-42 auth flow
│   │   ├── usePermalink.svelte.ts          # Permalink generation
│   │   ├── useRelayDiscovery.svelte.ts     # Relay discovery
│   │   └── useWriteTest.svelte.ts          # Write test logic
│   └── stores/
│       └── relaySocket.svelte.ts           # WebSocket store (289 lines)
├── utils/
│   ├── nostrVerify.ts                      # Event verification logic
│   └── relay.ts                            # Relay utilities (NIP-11, connections)
├── index.css
├── main.ts
└── vite-env.d.ts
```

### Target Component Structure (after Phase 8)

```
apps/web/src/
├── App.svelte                              # Router shell (refactored)
├── components/
│   ├── nav/                                # NEW: Navigation components
│   │   ├── NavBar.svelte                   # Top navigation bar
│   │   └── MobileNav.svelte                # Bottom nav / hamburger
│   ├── inspector/                          # Renamed from root components
│   │   ├── RelayProfile.svelte             # (moved from root)
│   │   ├── NipBadgeGrid.svelte             # (moved from root)
│   │   ├── LimitationsPanel.svelte         # (moved from root)
│   │   ├── ConnectionStatusPanel.svelte    # (moved from root)
│   │   ├── LatencyPanel.svelte             # (moved from root)
│   │   ├── WriteTestPanel.svelte           # (moved from root)
│   │   ├── FeeDisplay.svelte               # (moved from root)
│   │   ├── ConnectionPanel.svelte          # (moved from root)
│   │   ├── AuthStatusBadge.svelte          # (moved from root)
│   │   └── MonitorDataPanel.svelte         # (moved from root)
│   ├── stream/                             # Live Stream (moved from root)
│   │   ├── EventFeed.svelte                # (moved from root)
│   │   ├── EventCard.svelte                # (moved from root)
│   │   ├── FilterBuilder.svelte            # (moved from root)
│   │   ├── EoseIndicator.svelte            # (moved from root)
│   │   └── ExpiredBadge.svelte             # (moved from root)
│   ├── verifier/                           # (existing, unchanged)
│   │   ├── EventVerifier.svelte
│   │   ├── EventInput.svelte
│   │   ├── VerificationPanel.svelte
│   │   ├── EventDetails.svelte
│   │   ├── TagDecoder.svelte
│   │   └── KindBadge.svelte
│   ├── publisher/                          # NEW
│   │   ├── EventComposer.svelte            # Main composer UI
│   │   ├── TagEditor.svelte                # Tag add/remove/reorder
│   │   ├── PublishPanel.svelte             # Sign + publish + result
│   │   └── EventDeleter.svelte             # NIP-09 mass delete
│   ├── tools/                              # NEW
│   │   ├── KeyConverter.svelte             # npub ↔ nsec ↔ hex
│   │   ├── Nip05Checker.svelte             # Standalone NIP-05 verification
│   │   ├── QRCodeGenerator.svelte          # QR for npub/relay/events
│   │   └── EventBackup.svelte              # Backup & restore
│   ├── directory/                          # (moved from root)
│   │   ├── RelayDirectory.svelte
│   │   ├── RelayCard.svelte
│   │   ├── FilterBar.svelte
│   │   ├── ComparisonView.svelte
│   │   └── RelayListBadge.svelte
│   └── shared/                             # Shared/reusable components
│       ├── AccessibleTabs.svelte           # NEW: WAI-ARIA tabs pattern
│       ├── Toast.svelte                    # NEW: Accessible notifications
│       ├── SectionCard.svelte              # (moved from root)
│       ├── StatusDot.svelte                # (moved from root)
│       ├── LoadingSpinner.svelte           # (moved from root)
│       └── ErrorMessage.svelte             # (moved from root)
├── lib/
│   ├── composables/                        # (existing + new)
│   │   ├── useDirectory.svelte.ts          # (existing)
│   │   ├── useLatencyMeasurement.svelte.ts # (existing)
│   │   ├── useNip42Auth.svelte.ts          # (existing)
│   │   ├── usePermalink.svelte.ts          # (existing)
│   │   ├── useRelayDiscovery.svelte.ts     # (existing)
│   │   ├── useWriteTest.svelte.ts          # (existing)
│   │   ├── useKeyConverter.svelte.ts       # NEW: Key conversion state
│   │   ├── useNip05Checker.svelte.ts       # NEW: NIP-05 check state
│   │   ├── useEventComposer.svelte.ts      # NEW: Publisher state (uses SimplePool)
│   │   ├── useEventDeleter.svelte.ts       # NEW: Deleter state (uses SimplePool)
│   │   ├── useEventBackup.svelte.ts        # NEW: Backup/restore state
│   │   ├── useDebounce.svelte.ts           # NEW: Debounce utility
│   │   └── useCopyToClipboard.svelte.ts    # NEW: Clipboard with feedback
│   └── stores/
│       └── relaySocket.svelte.ts           # (existing)
├── utils/                                  # (existing + new)
│   ├── nostrVerify.ts                      # (existing)
│   ├── relay.ts                            # (existing)
│   ├── keys.ts                             # NEW: Key format conversion (npub/nsec/hex)
│   ├── nip05.ts                            # NEW: NIP-05 DNS resolution + verification
│   ├── qrcode.ts                           # NEW: QR generation wrapper
│   ├── backup.ts                           # NEW: Backup/restore logic
│   └── router.ts                           # NEW: Hash-based section routing
├── index.css
├── main.ts
└── vite-env.d.ts
```

### Key Conversion Utilities

```typescript
// apps/web/src/utils/keys.ts

import { bech32 } from '@scure/base'

const NSEC_PREFIX = 'nsec'
const NPUB_PREFIX = 'npub'

export function hexToNpub(hex: string): string {
  const bytes = Uint8Array.from(hex.match(/.{1,2}/g)!.map(b => Number.parseInt(b, 16)))
  return bech32.encode(NPUB_PREFIX, bech32.toWords(bytes))
}

export function hexToNsec(hex: string): string {
  const bytes = Uint8Array.from(hex.match(/.{1,2}/g)!.map(b => Number.parseInt(b, 16)))
  return bech32.encode(NSEC_PREFIX, bech32.toWords(bytes))
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function npubToHex(npub: string): string {
  const { prefix, words } = bech32.decode(npub)
  if (prefix !== NPUB_PREFIX) throw new Error('Not an npub')
  return bytesToHex(Uint8Array.from(bech32.fromWords(words)))
}

export function nsecToHex(nsec: string): string {
  const { prefix, words } = bech32.decode(nsec)
  if (prefix !== NSEC_PREFIX) throw new Error('Not an nsec')
  return bytesToHex(Uint8Array.from(bech32.fromWords(words)))
}

export function detectKeyFormat(input: string): 'npub' | 'nsec' | 'hex' | 'unknown' {
  if (input.startsWith('npub1')) return 'npub'
  if (input.startsWith('nsec1')) return 'nsec'
  if (/^[0-9a-f]{64}$/i.test(input)) return 'hex'
  return 'unknown'
}

export function convertKey(input: string): {
  npub: string; nsec: string | null; hex: string; format: string
} {
  const format = detectKeyFormat(input)
  switch (format) {
    case 'npub': {
      const hex = npubToHex(input)
      return { npub: input, nsec: hexToNsec(hex), hex, format: 'npub' }
    }
    case 'nsec': {
      const hex = nsecToHex(input)
      return { npub: hexToNpub(hex), nsec: input, hex, format: 'nsec' }
    }
    case 'hex': {
      return { npub: hexToNpub(input), nsec: hexToNsec(input), hex: input, format: 'hex' }
    }
    default:
      throw new Error('Unrecognized key format')
  }
}
```

### NIP-05 Resolution

```typescript
// apps/web/src/utils/nip05.ts

export interface Nip05Result {
  identifier: string
  local: string
  domain: string
  verified: boolean
  resolvedPubkey: string | null
  expectedPubkey: string | null
  npub: string | null
  httpStatus: number | null
  responseTimeMs: number
  rawResponse: Record<string, unknown> | null
  error: string | null
}

export async function verifyNip05(
  identifier: string,
  expectedPubkey?: string,
): Promise<Nip05Result> {
  const [local, domain] = identifier.split('@')
  const start = performance.now()

  try {
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(local)}`
    const res = await fetch(url)
    const json = await res.json()
    const responseTimeMs = performance.now() - start

    const resolvedPubkey = json.names?.[local] ?? null
    const verified = resolvedPubkey !== null &&
      (!expectedPubkey || resolvedPubkey === expectedPubkey)

    return {
      identifier,
      local,
      domain,
      verified,
      resolvedPubkey,
      expectedPubkey: expectedPubkey ?? null,
      npub: resolvedPubkey ? hexToNpub(resolvedPubkey) : null,
      httpStatus: res.status,
      responseTimeMs,
      rawResponse: json,
      error: null,
    }
  } catch (e) {
    return {
      identifier,
      local,
      domain,
      verified: false,
      resolvedPubkey: null,
      expectedPubkey: expectedPubkey ?? null,
      npub: null,
      httpStatus: null,
      responseTimeMs: performance.now() - start,
      rawResponse: null,
      error: e instanceof Error ? e.message : 'Resolution failed',
    }
  }
}
```

### Hash Router

```typescript
// apps/web/src/utils/router.ts

export type Section = 'inspector' | 'verifier' | 'publisher' | 'tools' | 'directory'

export function getHashSection(): Section {
  const hash = window.location.hash.replace('#', '').split('?')[0] as Section
  return ['inspector', 'verifier', 'publisher', 'tools', 'directory'].includes(hash)
    ? hash : 'inspector'
}

export function setHashSection(section: Section): void {
  window.location.hash = section
}
```

### Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `@scure/base` | bech32 encoding for key conversion | `^1.2.0` (existing) |
| `qrcode` | QR code generation (client-side) | `^1.5.4` |
| `@noble/curves` | Schnorr signing for event publish | (existing) |
| `@noble/hashes` | SHA-256 for event serialization | (existing) |

## Testing

1. **Key Converter**:
   - Paste `npub1...` → should display npub, nsec, and hex
   - Paste 64-char hex → should display all three formats
   - Paste `nsec1...` → should show warning banner, toggle visibility
   - Paste garbage → should show "Unrecognized key format" error

2. **NIP-05 Checker**:
   - Paste `satoshi@nostpleb.com` → should resolve or show DNS error
   - Paste with expected pubkey → should verify match/mismatch
   - Paste invalid domain → should show fetch error
   - Check response time is displayed in ms

3. **QR Code Generator**:
   - Paste npub → should render QR code
   - Download as PNG → should produce valid image file
   - Change size → QR should resize
   - Paste relay URL → should generate QR with relay URL content

4. **Event Publisher**:
   - Set kind=1, add content → sign via NIP-07 → publish → OK response
   - Publish to auth-required relay → should trigger NIP-42 flow first
   - Pre-fill from Verifier → all fields should populate
   - Character count should update as content changes

5. **Event Deleter**:
   - Paste 3 event IDs → confirm dialog → publish kind 5 → relay accepts
   - Select from Live Stream → checkbox → delete → events removed
   - Publish to relay without NIP-09 → should show warning about relay compliance

6. **Event Backup**:
   - Fetch events from relay → export as JSON → file downloads
   - Re-import JSON → preview shows event count and kinds breakdown
   - Restore to relay → progress bar advances → events published
   - Duplicate detection: existing events should be skipped

7. **Navigation**:
   - Click each nav item → correct section renders
   - Hash updates in URL bar
   - Direct URL to `#tools` → tools section loads
   - Mobile: nav switches to responsive layout
   - Browser back/forward buttons navigate between sections

## Effort Summary

| Feature | Duration | Difficulty |
|---------|----------|------------|
| Key Converter | 1 day | Easy |
| NIP-05 Checker | 1 day | Easy |
| QR Code Generator | 1 day | Easy |
| Event Publisher | 3–4 days | Medium |
| Event Deleter | 2–3 days | Medium |
| Event Backup & Restore | 3–4 days | Medium |
| Navigation Restructure | 2–3 days | Medium |
| **Total** | **~2 weeks** | |

---

*Previous: [Phase 7 — NIP Compliance](phase-7-nip-compliance.md)*

---

*Last updated: v0.8.0 — 2026-06-30*
