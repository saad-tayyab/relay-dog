# 📡 Phase 2: Live Event Stream

## Status

**Complete** ✅

## Overview

Connect to a relay via WebSocket and stream events in real time. The heart of the inspector — watch what's actually flowing through the relay.

## User Stories

1. **As a developer**, I want to see events flowing through a relay in real time so I can understand what data it carries.
2. **As a developer**, I want to build custom REQ filters (by kind, author, tag) so I can focus on specific events.
3. **As a developer**, I want to see when historical backfill is complete (EOSE) so I know when live events begin.
4. **As a developer**, I want to expand event JSON to see the raw data for debugging.

## Features

### WebSocket Connection ✅
- Connect/disconnect toggle
- Real-time status indicator (connecting, connected, disconnected)
- Auto-reconnect with exponential backoff (1s → 30s, 2x multiplier)
- 10s connection timeout

### REQ Subscription Builder ✅
- **Kinds**: Comma-separated event kinds (default: "1")
- **Authors**: Hex pubkey filter (comma-separated)
- **Limit**: Max events to fetch (default: 50)
- **Time Range**: `since` and `until` datetime pickers
- Subscribe / Unsubscribe toggle with subscription ID display

### Live Event Feed ✅
- Auto-scrolling event list (pauses when user scrolls up)
- Kind labels with color coding (0=blue, 1=green, 4=purple, 42=cyan)
- Author pubkey display (truncated to 8 chars)
- Timestamp display (relative: "2m ago", "1h ago")
- Content preview (first 200 chars, truncated)
- Event count display

### Raw JSON View ✅
- Expandable per-event JSON viewer
- Copy JSON button per event
- Collapsible with arrow indicator

### EOSE Detection ✅
- Visual indicator when historical backfill is complete
- Count of historical vs. live events
- "Loaded N historical events" banner

### NOTICE & Errors ✅
- Display relay NOTICE messages
- Show WebSocket error messages
- Connection failure diagnostics

## Technical Details

### Files Created

| File | Purpose |
|------|---------|
| `lib/stores/relaySocket.svelte.ts` | Core WebSocket store with reconnect, dedup, EOSE (Svelte 5 runes) |
| `components/ConnectionPanel.svelte` | Status display, connect/disconnect, stats |
| `components/FilterBuilder.svelte` | REQ subscription builder with filter inputs |
| `components/EventFeed.svelte` | Auto-scrolling event list with EventCard |
| `components/EventCard.svelte` | Individual event display |

### Hook API

```typescript
const { status, events, send, connect, disconnect, eose, notices, error } =
  useRelaySocket(relayUrl);
```

### WebSocket Protocol

```typescript
// NIP-01 message types
const WS_MESSAGES = {
  // Client → Relay
  REQ:    ["REQ", subscriptionId, filter],
  EVENT:  ["EVENT", event],
  CLOSE:  ["CLOSE", subscriptionId],

  // Relay → Client
  EVENT:  ["EVENT", subscriptionId, event],
  EOSE:   ["EOSE", subscriptionId],
  NOTICE: ["NOTICE", message],
  AUTH:   ["AUTH", challenge],
}
```

## Testing

1. Connect to `wss://relay.damus.io` → events should start flowing
2. Add kind filter (kind 1) → only notes should appear
3. Disconnect → events stop, status shows "disconnected"
4. Reconnect → historical events load, then live events resume
5. Check EOSE indicator → should appear after initial load

## Dependencies

- **NIP-01**: Core protocol (REQ, EVENT, EOSE, CLOSE, NOTICE)
- **NIP-11**: Already implemented (Phase 1)

---

*Previous: [Phase 1 — NIP-11 Viewer](phase-1-nip11.md) | Next: [Phase 3 — Event Verifier](phase-3-verifier.md)*

---

*Last updated: v0.2.0 — 2026-06-30*
