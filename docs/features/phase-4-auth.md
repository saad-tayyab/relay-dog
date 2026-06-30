# 🔑 Phase 4: Auth & Health Dashboard

## Status

**Complete** ✅ (2026-06-30)

## Overview

Handle auth-required relays and add latency/health metrics. This is the hardest feature and the one that sets your tool apart.

## User Stories

1. **As a developer**, I want to authenticate with NIP-42 relays so I can inspect auth-gated content.
2. **As a developer**, I want to measure WebSocket latency so I can compare relay performance.
3. **As a developer**, I want to know how long EOSE takes so I can gauge relay responsiveness.
4. **As a developer**, I want to publish a test event so I can verify write access.
5. **As a user**, I want to see relay fees so I know the cost before paying.

## Features

### NIP-42 AUTH
- Detect when relay requires authentication
- Trigger NIP-42 AUTH challenge flow
- Sign AUTH event via NIP-07 browser extension
- Display auth status (authenticated / auth required / anonymous)
- Graceful fallback if no NIP-07 extension installed

### Latency Measurement
- WebSocket round-trip timing (send ping, measure pong)
- HTTP latency (NIP-11 fetch time)
- Display in ms with color coding (< 100ms green, < 500ms yellow, > 500ms red)

### EOSE Timing
- Measure time from REQ to EOSE
- Display "Loaded 1,234 historical events in 3.2s"
- Compare across relays

### Write Test
- Publish a test event (`kind:27676` or similar)
- Confirm relay accepts it (OK response)
- Display success/failure with latency

### Fee Display
- Parse NIP-11 `limitation` for payment fields
- Show admission fee, subscription tiers, per-event cost
- Format as USD/sats with clear labels

## Technical Details

### NIP-42 Flow

```typescript
// 1. Relay sends AUTH challenge
const ws = new WebSocket(url)
ws.onmessage = (msg) => {
  const [type, challenge] = JSON.parse(msg.data)
  if (type === 'AUTH') {
    // 2. Sign AUTH event via NIP-07
    const authEvent = await window.nostr.signEvent({
      kind: 22242,
      content: '',
      tags: [['relay', url], ['challenge', challenge]],
      created_at: Math.floor(Date.now() / 1000),
    })
    // 3. Send back
    ws.send(JSON.stringify(['AUTH', authEvent]))
  }
}
```

### Latency Measurement

```typescript
async function measureWsLatency(url: string): Promise<number> {
  const start = performance.now()
  const ws = new WebSocket(url)
  return new Promise((resolve, reject) => {
    ws.onopen = () => {
      ws.send(JSON.stringify(['REQ', 'ping', { limit: 0 }]))
    }
    ws.onmessage = (msg) => {
      const [type] = JSON.parse(msg.data)
      if (type === 'EOSE') {
        const latency = performance.now() - start
        ws.close()
        resolve(latency)
      }
    }
    setTimeout(() => { ws.close(); reject(new Error('timeout')) }, 10000)
  })
}
```

## Dependencies

| Package | Purpose |
|---------|---------|
| NIP-07 browser extension | `window.nostr` for signing |
| (no new npm packages) | All crypto already available |

## Testing

1. Connect to auth-required relay → should show AUTH challenge
2. Click authenticate → should sign via extension
3. Measure latency → should show ms value
4. Run write test → should confirm OK
5. Check fee display → should parse NIP-11 limitation

---

*Previous: [Phase 3 — Event Verifier](phase-3-verifier.md) | Next: [Phase 5 — Relay Directory](phase-5-directory.md)*
