---
title: "📂 Phase 5: Relay Directory"
version: "0.10.0"
status: "complete"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 📂 Phase 5: Relay Directory

> **v0.10.0** · **Complete** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---


## Status

**Complete** ✅ (2026-06-30)

## Overview

Go from a single-relay inspector to a directory. Users can browse known relays, filter by supported NIPs, and compare two relays side by side.

## User Stories

1. **As a user**, I want to browse a list of known relays so I don't have to type URLs manually.
2. **As a user**, I want to filter relays by supported NIPs so I can find relays that work with my client.
3. **As a user**, I want to compare two relays side by side so I can choose the best one.
4. **As a user**, I want to share a relay profile via URL so others can see what I found.
5. **As a user**, I want to see uptime history so I can pick reliable relays.

## Features

### Directory Browse & Filter

- **Search**: Full-text search across relay names and URLs (ILIKE)
- **NIP filter**: Show only relays supporting specific NIPs (e.g., "NIP-42 auth")
- **Free/paid filter**: Toggle by auth_required, payment_required
- **Country filter**: Filter by ISO country code
- **Sort**: By name, URL, last checked, or latency

### Side-by-Side Comparison

- Select two relays from directory
- Compare: NIP-11 info, supported NIPs, limitations, health status
- Highlight differences (latency winner, health winner, NIPs only in A/B)
- Diff analysis: shared NIPs, NIPs unique to each relay

### Country List

- `GET /api/directory/countries` returns distinct country codes from public relays
- Used for country filter dropdown

### Shareable Permalinks

- URL format: `relayscope.app/relay/relay.damus.io`
- Deep-link to specific relay profile
- Share comparison URLs: `relayscope.app/compare/relay1/relay2`

## Technical Details

### Component Structure

```
components/
├── RelayDirectory.svelte      # Main directory page
├── RelayCard.svelte            # Individual relay card
├── FilterBar.svelte            # NIP, country, free/paid filters
├── ComparisonView.svelte       # Side-by-side comparison (semantic <table>)
├── AddRelay.svelte             # Add relay form
├── AddToDirectory.svelte       # Add to directory toggle
├── MonitorDataPanel.svelte     # NIP-66 monitor observations display
├── FeeDisplay.svelte           # Admission/subscription/publication fee display
├── ExpiredBadge.svelte         # NIP-40 expiration indicator
├── AuthPrefixDisplay.svelte    # NIP-42 OK/CLOSED prefix display
├── AuthStatusBadge.svelte      # Auth status indicator
├── EoseIndicator.svelte        # NIP-67 EOSE completeness hint
├── RelayListBadge.svelte       # NIP-65 relay list popularity badge
├── LatencyPanel.svelte         # Latency metrics display
├── WriteTestPanel.svelte       # Write test results
├── ConnectionStatusPanel.svelte # Connection status overview
└── SectionCard.svelte          # Consistent card layout
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/directory` | Browse directory with filters (public relays only) |
| `GET` | `/api/directory/countries` | List available country codes |
| `GET` | `/api/directory/compare/:id1/:id2` | Compare two relays side by side |

## Database Changes

Already shipped in Phase 1/7:
- **relays**: `country`, `is_public` columns for filtering; `banner`, `pubkey`, `self`, `contact`, `terms_of_service`, `payments_url`, `fees` columns from NIP-11
- **health_checks**: `checked_at` index for sparkline queries

## Dependencies

| Package | Purpose |
|---------|---------|
| (none) | Uses existing API + shared types |

## Testing

1. Browse directory → should show public relays
2. Filter by NIP-42 → should show only auth-capable relays
3. Filter by country → should show only relays from that country
4. Compare two relays → should show side-by-side table with diff analysis
5. Search by name → should return matching relays
6. Sort by latency → should order relays by last health check latency

---

*Previous: [Phase 4 — Auth & Health Dashboard](phase-4-auth.md) | Next: [Phase 6 — Security Hardening](phase-6-security-hardening.md)*

---
