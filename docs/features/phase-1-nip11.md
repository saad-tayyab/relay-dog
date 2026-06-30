# 🔍 Phase 1: NIP-11 Viewer (MVP)

## Status

**Implemented** ✅

## Overview

The MVP provides a single-page web app for inspecting a Nostr relay's NIP-11 information document. Enter a relay URL, get a complete profile with connection status checks.

## User Stories

1. **As a developer**, I want to paste a relay URL and see its NIP-11 info so I can quickly understand what the relay supports.
2. **As a developer**, I want to see which NIPs a relay supports so I know if it's compatible with my client.
3. **As a developer**, I want to check if a relay is reachable (HTTP, CORS, WebSocket) so I can debug connection issues.
4. **As a user**, I want to see the relay's limitations (auth required, max message size) so I know what to expect.

## Features

### URL Input
- Text input with `wss://` auto-completion
- Quick-pick buttons for popular relays (damus, nos.lol, primal, etc.)
- Enter key or button click to inspect

### Relay Profile
- **Name** and **description** from NIP-11
- **Icon** (loaded from relay)
- **Software** and **version** info
- Responsive layout (works on mobile)

### NIP Badge Grid
- Color-coded badges for each supported NIP
- Hover shows NIP description
- Click opens NIP spec on GitHub
- Sorted numerically

### Limitations Panel
- Max message size, max subscriptions, max filters
- Auth required / payment required (red/green badges)
- All fields from the `limitation` object

### Connection Status
- **HTTP Reachable**: Fetch with `Accept: application/nostr+json`
- **CORS Configured**: Check for CORS headers
- **WebSocket Connectable**: Attempt WS connection (5s timeout)
- Latency measurement in ms
- Visual status dots (green/red/yellow)

### Raw JSON Viewer
- Collapsible `<details>` toggle
- Formatted JSON with syntax highlighting (via monospace font)
- Shows the complete NIP-11 document

## Technical Details

### Frontend
- **Component**: Single `App.svelte` (350 lines)
- **Styling**: Tailwind v4 with custom dark theme tokens
- **State**: Svelte 5 `$state` runes (no state manager needed)
- **No external UI libraries**: All components are custom

### Connection Checks
```typescript
// Performed in parallel with NIP-11 fetch
const [info, connStatus] = await Promise.all([
  fetchNip11(normalized),
  checkConnections(normalized),
])
```

### NIP Database
Built-in database of 40+ NIPs with:
- Display name
- Description
- Color code
- GitHub link

### Error Handling
- Graceful fallback if NIP-11 fetch fails
- Connection checks still run even if NIP-11 fails
- Retry button on error state
- Loading spinner during fetch

## API Integration (Phase 1)

The MVP can work **without** the API server — all NIP-11 fetching and connection checks happen client-side. The API integration adds:

- **Persistence**: Store relays and health check history
- **Monitoring**: Background health checks every 60s
- **Directory**: Browse saved relays

## Testing

### Manual Testing
1. Enter `wss://relay.damus.io` → should show profile with 8+ NIPs
2. Enter `wss://nonexistent.relay.xyz` → should show error with retry
3. Click a quick-pick button → should auto-fetch
4. Toggle raw JSON viewer → should show formatted JSON
5. Check connection status dots → should show green for reachable relays

### Edge Cases
- Empty URL → button disabled
- URL without protocol → auto-adds `wss://`
- HTTP-only relay URL → converts to HTTPS for NIP-11 fetch
- Relay with no NIP-11 support → shows limited profile
- Slow relay → loading spinner until response

## Future Enhancements

- [ ] Deep-linking (`/relay/damus.io`)
- [ ] Share relay profile as URL
- [ ] Compare two relays side-by-side
- [ ] Export relay profile as JSON

---

*Next: [Phase 2 — Live Event Stream](phase-2-events.md)*

---

*Last updated: v0.1.0 — 2026-06-30*
