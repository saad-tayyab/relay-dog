# 📡 Phase 2: Live Event Stream

## Status

**Planned** 🚧

## Overview

Connect to a relay via WebSocket and stream events in real time. The heart of the inspector — watch what's actually flowing through the relay.

## User Stories

1. **As a developer**, I want to see events flowing through a relay in real time so I can understand what data it carries.
2. **As a developer**, I want to build custom REQ filters (by kind, author, tag) so I can focus on specific events.
3. **As a developer**, I want to see when historical backfill is complete (EOSE) so I know when live events begin.
4. **As a developer**, I want to expand event JSON to see the raw data for debugging.

## Features

### WebSocket Connection
- Connect/disconnect toggle
- Real-time status indicator (connecting, connected, disconnected)
- Auto-reconnect with exponential backoff
- Connection latency display

### REQ Subscription Builder
- **Kinds**: Multi-select for event kinds (0, 1, 4, 42, etc.)
- **Authors**: Filter by pubkey (npub or hex)
- **Tags**: Filter by `#e`, `#p`, or custom tags
- **Time Range**: `since` and `until` timestamps
- **Limit**: Max events to fetch

### Live Event Feed
- Auto-scrolling event list
- Kind labels with color coding (kind 1 = note, kind 0 = metadata, etc.)
- Author pubkey display (with npub conversion)
- Timestamp display (relative + absolute)
- Content preview (truncated, expandable)

### Raw JSON View
- Expandable per-event JSON viewer
- Copy JSON button
- Highlighted fields (id, pubkey, sig)

### EOSE Detection
- Visual indicator when historical backfill is complete
- Count of historical vs. live events

### NOTICE & Errors
- Display relay NOTICE messages
- Show WebSocket error messages
- Connection failure diagnostics

## Technical Details

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

### State Management

```typescript
interface StreamState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  events: NostrEvent[]
  filters: SubscriptionFilter[]
  eoseReceived: boolean
  historicalCount: number
  liveCount: number
}
```

### Component Structure

```
LiveEventStream/
├── ConnectionPanel.tsx      # Connect/disconnect, status
├── FilterBuilder.tsx        # REQ subscription builder
├── EventFeed.tsx            # Scrolling event list
├── EventCard.tsx            # Single event display
├── EventJsonView.tsx        # Expandable raw JSON
└── StatusIndicator.tsx      # EOSE, errors, notices
```

### API Integration

The API server can optionally proxy WebSocket connections to avoid CORS issues:

```
Browser → API (/ws/relay?url=wss://relay.damus.io) → Relay
```

Or the browser can connect directly if the relay has CORS configured.

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
