# 📏 Code Style Guide

## TypeScript

### General Rules

```typescript
// ✅ Use explicit types for function signatures
function fetchRelay(url: string): Promise<RelayNip11> { ... }

// ❌ Don't use `any`
const data: any = await fetch(url)

// ✅ Use `unknown` for untyped data
const data: unknown = await fetch(url)

// ✅ Use type inference for variables
const count = 42  // inferred as number

// ✅ Use interfaces for object shapes
interface RelayConfig {
  url: string
  name?: string
}

// ✅ Use type aliases for unions
type CheckStatus = 'pending' | 'success' | 'error' | 'checking'
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase | `relayUrl`, `healthCheck` |
| Functions | camelCase | `fetchRelay()`, `checkHealth()` |
| Types/Interfaces | PascalCase | `RelayInfo`, `HealthCheck` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Files | kebab-case | `relay-monitor.ts`, `health-check.ts` |
| Database columns | snake_case | `relay_id`, `http_reachable` |
| Svelte components | PascalCase | `RelayProfile.svelte`, `NipBadge.svelte` |
| Svelte stores | camelCase | `relaySocket.svelte.ts` |

### Imports

```typescript
// 1. External packages first
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'

// 2. Internal packages
import { db } from '../db'
import type { Relay } from '@relayscope/shared'

// 3. Relative imports last
import { checkHealth } from './utils'
```

---

## Svelte (Frontend)

### Component Style

```svelte
<!-- ✅ Svelte 5 Runes syntax -->
<script lang="ts">
  // Props via $props()
  let { relay, onSelect }: { relay: Relay; onSelect: (id: string) => void } = $props();
  
  // Reactive state via $state()
  let isExpanded = $state(false);
  
  // Derived values via $derived()
  const displayName = $derived(relay.name || 'Unknown');
</script>

<div class="...">
  <h2>{displayName}</h2>
</div>
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase | `relayUrl`, `healthCheck` |
| Functions | camelCase | `fetchRelay()`, `checkHealth()` |
| Types/Interfaces | PascalCase | `RelayInfo`, `HealthCheck` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Files | kebab-case | `relay-monitor.ts`, `health-check.ts` |
| Database columns | snake_case | `relay_id`, `http_reachable` |
| Svelte components | PascalCase | `RelayProfile.svelte`, `NipBadge.svelte` |
| Svelte stores | camelCase | `relaySocket.svelte.ts` |

### Runes Reference

```svelte
<script lang="ts">
  // ✅ $state for reactive local state
  let count = $state(0);
  
  // ✅ $derived for computed values
  const doubled = $derived(count * 2);
  
  // ✅ $effect for side effects
  $effect(() => {
    console.log('Count changed:', count);
  });
  
  // ✅ $props() for component props
  let { title, count }: Props = $props();
  
  // ✅ Snippets replace ReactNode/children
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

<!-- ✅ Event handlers use lowercase -->
<button onclick={() => count++}>Click</button>

<!-- ✅ bind: for two-way binding -->
<input bind:value={name} />

<!-- ✅ Each blocks with keyed lists -->
{#each items as item (item.id)}
  <div>{item.name}</div>
{/each}

<!-- ✅ Conditional rendering -->
{#if condition}
  <p>Visible</p>
{:else}
  <p>Hidden</p>
{/if}
```

### Tailwind Rules

Same as before — use Tailwind utility classes, use custom theme tokens from index.css, avoid inline styles, avoid CSS files for components.

### Stores

```typescript
// ✅ Reactive stores use .svelte.ts extension with getter returns
// apps/web/src/lib/stores/relaySocket.svelte.ts
export function relaySocket(getRelayUrl: () => string) {
  let status = $state('disconnected');
  
  return {
    get status() { return status; },
    connect,
    disconnect,
  };
}

// ✅ Usage in components
const socket = relaySocket(() => normalizedUrl);
// Access reactively: socket.status
```

---

## API (Backend)

### Route Style

```typescript
// ✅ Group routes by resource
const relayRoutes = new Hono()

relayRoutes.get('/', async (c) => { ... })
relayRoutes.get('/:id', async (c) => { ... })
relayRoutes.post('/', async (c) => { ... })

// ✅ Use consistent error responses
return c.json({ success: false, error: 'Not found' }, 404)

// ✅ Always validate input
const body = await c.req.json<CreateRelayDto>()
if (!body.url) {
  return c.json({ success: false, error: 'URL is required' }, 400)
}
```

### Database Queries

```typescript
// ✅ Use Drizzle's type-safe query builder
const [relay] = await db
  .select()
  .from(relays)
  .where(eq(relays.id, id))
  .limit(1)

// ✅ Use transactions for multi-step operations
await db.transaction(async (tx) => {
  await tx.insert(relays).values(data)
  await tx.insert(healthChecks).values(healthData)
})

// ❌ Don't use raw SQL unless necessary
await db.execute(sql`SELECT * FROM relays WHERE id = ${id}`)
```

---

## Error Handling

```typescript
// ✅ Always handle errors gracefully
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
} catch (e: unknown) {
  // ✅ Use `unknown` and narrow
  const message = e instanceof Error ? e.message : 'Unknown error'
  console.error(`Failed to fetch ${url}:`, message)
  throw new Error(message)
}
```

---

## File Organization

```
src/
├── index.ts          # Entry point only
├── routes/           # One file per resource
│   ├── relays.ts
│   └── events.ts
├── jobs/             # Background tasks
│   └── relayMonitor.ts
├── db/               # Database layer
│   ├── schema.ts     # Table definitions
│   └── index.ts      # Connection
└── utils/            # Shared utilities
    └── url.ts
```

---

## Git

### Commit Messages

Follow [Conventional Commits](https://conventionalcommits.org):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Good**:
```
feat(web): add NIP-11 relay profile viewer
fix(api): handle CORS errors for unreachable relays
docs: update API endpoint examples
```

**Bad**:
```
update code
fix bug
WIP
```

### PR Titles

Same format as commit messages:
```
feat(web): add live event stream viewer
```
