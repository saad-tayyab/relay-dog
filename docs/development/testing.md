# 🧪 Testing Strategy

## Current State

Phase 1 relies on **manual testing** and **type-level verification** (Biome + TypeScript). This is intentional — for a side project in early phases, automated tests have diminishing returns.

## Testing Pyramid

```
        ╱╲
       ╱  ╲        E2E Tests (Phase 4+)
      ╱    ╲       Cypress / Playwright
     ╱──────╲
    ╱        ╲     Integration Tests (Phase 3+)
   ╱          ╲    Drizzle test DB + Hono test client
  ╱────────────╲
 ╱              ╲  Unit Tests (When needed)
╱                ╲ Bun test runner + @testing-library/svelte
╱──────────────────╲
```

## What We Test Now

| Check | Tool | When | Command |
|-------|------|------|---------|
| **Type safety** | TypeScript 6.0 | Every commit (pre-commit hook) | `bunx turbo type-check` |
| **Lint + Format** | Biome 2.5 | Every commit (pre-commit hook) | `bunx biome check .` |
| **Build** | Turborepo + Vite + Bun | Every commit + CI | `bunx turbo build` |
| **Manual QA** | Browser | During development | `bunx turbo dev` |

## What We'll Add

### Phase 2: API Integration Tests

```bash
# Add to apps/api
bun add -d bun:test
```

```typescript
// apps/api/src/__tests__/relays.test.ts
import { describe, it, expect } from 'bun:test'
import { app } from '../index'

describe('Relay API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  it('GET /api/relays returns empty array initially', async () => {
    const res = await app.request('/api/relays')
    expect(res.status).toBe(200)
  })
})
```

### Phase 3: Crypto Unit Tests

```typescript
// packages/shared/src/__tests__/crypto.test.ts
import { describe, it, expect } from 'bun:test'
import { verifyEventSignature, computeEventId } from '../crypto'

describe('Event Verification', () => {
  it('verifies valid Schnorr signature', () => {
    // Test with known valid event
    expect(verifyEventSignature(validEvent)).toBe(true)
  })

  it('rejects tampered event', () => {
    const tampered = { ...validEvent, content: 'hacked' }
    expect(verifyEventSignature(tampered)).toBe(false)
  })

  it('computes correct event ID', () => {
    const id = computeEventId(validEvent)
    expect(id).toBe(validEvent.id)
  })
})
```

### Phase 4: WebSocket Integration Tests

```typescript
// apps/api/src/__tests__/websocket.test.ts
import { describe, it, expect } from 'bun:test'

describe('WebSocket Health Check', () => {
  it('detects reachable relay', async () => {
    const result = await checkWebSocket('wss://relay.damus.io')
    expect(result.connectable).toBe(true)
    expect(result.latencyMs).toBeLessThan(5000)
  }, 10_000)

  it('detects unreachable relay', async () => {
    const result = await checkWebSocket('wss://nonexistent.relay.xyz')
    expect(result.connectable).toBe(false)
  }, 10_000)
})
```

## Running Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific file
bun test apps/api/src/__tests__/relays.test.ts

# Run in watch mode
bun test --watch
```

## CI Integration (Future)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx biome check .
      - run: bunx turbo type-check
      - run: bunx turbo build
      - run: bun test
```

## Manual Testing Checklist (Phase 1)

### NIP-11 Viewer
- [ ] Enter `wss://relay.damus.io` → profile loads
- [ ] Enter `wss://nos.lol` → profile loads
- [ ] Click quick-pick button → auto-fetches
- [ ] Enter invalid URL → error with retry
- [ ] Check NIP badges → correct count and links
- [ ] Check limitations → auth/payment shown correctly
- [ ] Connection status dots → green for reachable relays
- [ ] Toggle raw JSON viewer → formatted JSON
- [ ] Mobile responsive → layout adapts
