# 📂 Phase 5: Relay Directory & Comparison

## Status

**Planned** 📋

## Overview

Go from a single-relay inspector to a directory. Users can browse known relays, filter by supported NIPs, and compare two relays side by side.

## User Stories

1. **As a user**, I want to browse a list of known relays so I don't have to type URLs manually.
2. **As a user**, I want to filter relays by supported NIPs so I can find relays that work with my client.
3. **As a user**, I want to compare two relays side by side so I can choose the best one.
4. **As a user**, I want to share a relay profile via URL so others can see what I found.
5. **As a user**, I want to see uptime history so I can pick reliable relays.

## Features

### Relay Discovery (NIP-66)
- Query `kind:30166` events from relay monitors
- Extract relay URLs from monitor events
- Auto-add discovered relays to directory
- Periodic re-scan for new relays

### Filter & Search
- **NIP filter**: Show only relays supporting specific NIPs (e.g., "NIP-42 auth")
- **Free/paid filter**: Toggle by auth_required, payment_required
- **Country filter**: Filter by country code
- **Search**: Full-text search across relay names and descriptions

### Side-by-Side Comparison
- Select two relays from directory
- Compare: NIP-11 info, supported NIPs, limitations, health status
- Highlight differences (green = better, red = worse)
- Share comparison as URL

### Uptime Sparklines
- Store health check history in database
- Render 7-day/30-day sparklines
- Color-coded: green = up, red = down, gray = unknown

### Shareable Permalinks
- URL format: `relayscope.app/relay/relay.damus.io`
- Deep-link to specific relay profile
- Share comparison URLs: `relayscope.app/compare/relay1/relay2`

## Technical Details

### NIP-66 Discovery

```typescript
async function discoverRelays(monitorRelay: string): Promise<string[]> {
  const ws = new WebSocket(monitorRelay)
  const relays: string[] = []

  ws.onopen = () => {
    ws.send(JSON.stringify([
      'REQ',
      'discovery',
      { kinds: [30166], limit: 100 }
    ]))
  }

  ws.onmessage = (msg) => {
    const [type, , event] = JSON.parse(msg.data)
    if (type === 'EVENT') {
      const relayTag = event.tags.find(([k]) => k === 'relay')
      if (relayTag) relays.push(relayTag[1])
    }
    if (type === 'EOSE') {
      ws.close()
    }
  }

  return relays
}
```

### Uptime Sparkline

```typescript
// Query last 7 days of health checks
const checks = await db
  .select()
  .from(healthChecks)
  .where(
    and(
      eq(healthChecks.relayId, relayId),
      gte(healthChecks.checkedAt, sevenDaysAgo)
    )
  )
  .orderBy(healthChecks.checkedAt)

// Render as SVG sparkline
const points = checks.map((c, i) =>
  `${i * (width / checks.length)},${c.httpReachable ? 0 : height}`
)
```

### Component Structure

```
Directory/
├── RelayDirectory.tsx      # Main directory page
├── RelayCard.tsx            # Individual relay card
├── FilterBar.tsx            # NIP, country, free/paid filters
├── ComparisonView.tsx       # Side-by-side comparison
├── UptimeSparkline.tsx      # 7-day/30-day sparkline
└── ShareButton.tsx          # Copy permalink to clipboard
```

## API Endpoints (New)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/discover` | Trigger NIP-66 relay discovery |
| `GET` | `/api/directory` | Browse directory with filters |
| `GET` | `/api/compare/:id1/:id2` | Compare two relays |

## Database Changes

- **health_checks**: Add `checked_at` index for sparkline queries
- **relays**: Add `country`, `is_public` columns for filtering
- **monitoring_jobs**: Add `next_run_at` for scheduling

## Dependencies

| Package | Purpose |
|---------|---------|
| (none) | Uses existing API + shared types |

## Testing

1. Browse directory → should show discovered relays
2. Filter by NIP-42 → should show only auth-capable relays
3. Compare two relays → should show side-by-side table
4. Share permalink → should open correct relay page
5. View sparkline → should show 7-day history

---

*Previous: [Phase 4 — Auth & Health Dashboard](phase-4-auth.md)*
