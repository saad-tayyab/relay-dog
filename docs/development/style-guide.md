---
title: "🎨 Style Guide"
version: "0.10.0"
status: "current"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 🎨 Style Guide

> **v0.10.0** · **Current** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---


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

## Accessibility (WCAG 2.2 AA)

> **Every component must pass all 12 checks below.** See `docs/features/phase-9-accessibility.md` for full details.

### The 12-Check Accessibility Checklist

| # | Check | WCAG SC | Enforcement |
|---|-------|---------|-------------|
| 1 | All SVGs have `aria-hidden="true"` | 1.1.1 | Every `<svg>` |
| 2 | All inputs have `<label>` (visible or `sr-only`) | 1.3.1, 3.3.2 | Every `<input>`, `<select>`, `<textarea>` |
| 3 | All interactive elements are native HTML | 2.1.1 | `<button>`, `<input>`, `<select>`, `<a>` — never `<div onclick>` |
| 4 | All buttons have `min-h-[44px]` | 2.5.5 | Every clickable element |
| 5 | All icon-only buttons have `aria-label` | 4.1.2 | Buttons without visible text |
| 6 | All toggles have `aria-expanded`/`aria-pressed` | 4.1.2 | Expandable sections, pressed states |
| 7 | All dynamic errors use `role="alert"` | 3.3.1 | Error messages |
| 8 | All dynamic status uses `role="status"` or `aria-live` | 4.1.3 | Copy feedback, auto-updates, toasts |
| 9 | All validation hints use `aria-describedby` | 3.3.2 | Connected hint text |
| 10 | Animations respect `prefers-reduced-motion` | 2.3.3 | Global CSS handles this |
| 11 | Focus visible on all interactive elements | 2.4.7 | Global `:focus-visible` handles this |
| 12 | No info conveyed by color alone | 1.4.1 | Icons + text alongside color |

### ARIA Roles & Labels

```svelte
<!-- ✅ Use role="alert" for error messages that appear dynamically -->
<div role="alert" class="text-error">...</div>

<!-- ✅ Use role="status" for loading states and non-critical updates -->
<div role="status" aria-label="Loading">...</div>

<!-- ✅ Use aria-live="polite" for dynamic content that should be announced -->
<div aria-live="polite" role="status">...</div>

<!-- ✅ Always label icon-only buttons -->
<button aria-label="Close comparison view">✕</button>

<!-- ✅ Add aria-hidden to decorative emojis and SVGs -->
<span aria-hidden="true">⚡</span>

<!-- ✅ Associate labels with inputs using for/id -->
<label for="relay-url" class="sr-only">Relay URL</label>
<input id="relay-url" ... />
```

### WAI-ARIA Tabs Pattern

```svelte
<!-- ✅ Use AccessibleTabs component for all tab interfaces -->
<script>
  import AccessibleTabs from '../shared/AccessibleTabs.svelte';
</script>

<AccessibleTabs
  ariaLabel="Section tabs"
  tabs={[
    { id: 'tab1', label: 'Tab 1', icon: '⚡' },
    { id: 'tab2', label: 'Tab 2', icon: '🔐' },
  ]}
  activeTab={current}
  onTabChange={(id) => (current = id)}
>
  {#if current === 'tab1'}...{/if}
</AccessibleTabs>
```

Never implement tabs manually — always use `AccessibleTabs`. It provides:
- `role="tablist"` / `role="tab"` / `role="tabpanel"`
- Arrow key navigation
- `aria-selected`, `aria-controls`, `aria-labelledby`
- 44×44px touch targets

### Touch Targets (WCAG 2.2 SC 2.5.8)

```svelte
<!-- ✅ Minimum 44×44px for all interactive elements -->
<button class="min-h-[44px] min-w-[44px] px-4 py-2.5 ...">Action</button>

<!-- ✅ Use the .touch-target class for convenience -->
<button class="touch-target ...">Action</button>

<!-- ❌ Never use small padding without explicit min dimensions -->
<button class="px-2 py-1 ...">Too small</button>
```

### Focus Indicators

```css
/* ✅ Already in index.css — :focus-visible ring */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### Reduced Motion

```css
/* ✅ Already in index.css — respects user preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### WCAG 2.2 New Criteria

```css
/* SC 2.4.11: Focus Not Obscured — add scroll-padding for sticky/fixed UI */
html {
  scroll-padding-top: 5rem;    /* header height */
  scroll-padding-bottom: 5rem; /* mobile nav height */
}
```

```svelte
<!-- SC 2.5.8: Target Size — minimum 24×24px (we use 44×44px) -->
<button class="min-h-[44px] min-w-[44px] ...">Action</button>

<!-- SC 3.3.8: Accessible Authentication — no CAPTCHAs, use type="password" -->
<input type="password" ... />
<button aria-expanded={show} onclick={() => show = !show}>
  {show ? 'Hide' : 'Show'}
</button>
```

### Composable Patterns

```typescript
// ✅ Always handle clipboard errors
const clipboard = createClipboard();
await clipboard.copy(text);
// clipboard.copied, clipboard.error for UI feedback

// ✅ Always debounce search inputs
const debouncedFetch = createDebounce(fetchRelays, 300);

// ✅ Always add concurrency guards
if (publishing) return; // Prevent double-submit

// ✅ Always close WebSockets on error
ws.onerror = () => {
  ws.close();  // Don't forget this!
  resolve(null);
};
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

---
