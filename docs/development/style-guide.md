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

Use Tailwind utility classes for all styling. Reference theme tokens from `index.css` — never hardcode raw color values.

#### Theme Tokens Reference

The project uses a **two-tier token system**: shadcn standard tokens for structural UI, and custom domain tokens for status semantics.

**Text tokens:**

| Token | Use For | Example |
|-------|---------|---------|
| `text-foreground` | Primary text (headings, body, labels) | `<h2 class="text-foreground">` |
| `text-muted-foreground` | Secondary/tertiary text (descriptions, placeholders, helpers) | `<p class="text-muted-foreground text-sm">` |
| `text-primary` | Accent/brand color (links, active states, highlights) | `<a class="text-primary">` |
| `text-card-foreground` | Card content text | `<Card.Root>` uses this automatically |
| `text-primary-foreground` | Text on primary-colored backgrounds | Button default variant |
| `text-destructive` | Destructive action text | Shadcn destructive button/badge |
| `text-success` | Success states (online relays, valid sigs) | `<span class="text-success">✓ Verified</span>` |
| `text-warning` | Warning states (EOSE incomplete, auth-required) | `<span class="text-warning">⚠ More events</span>` |
| `text-error` | Error states (failed checks, unreachable) | `<div class="text-error">Connection failed</div>` |

**Background tokens:**

| Token | Use For | Example |
|-------|---------|---------|
| `bg-background` | Page root background | Applied to `<body>` via base layer |
| `bg-card` | Card/tab surfaces | `<SectionCard>` uses this |
| `bg-muted` | Inset surfaces (stat boxes, code blocks, input groups) | `<div class="bg-muted rounded-lg">` |
| `bg-primary` | Active indicators, selected states | `<span class="bg-primary">` dot |
| `bg-popover` | Dropdown/overlay backgrounds | Shadcn dropdowns use this |
| `bg-success-dim` | Success background (low opacity) | `bg-success-dim border border-success/20 text-success` |
| `bg-warning-dim` | Warning background (low opacity) | `bg-warning-dim border border-warning/20 text-warning` |
| `bg-error-dim` | Error background (low opacity) | `bg-error-dim border border-error/20 text-error` |

**Border tokens:**

| Token | Use For | Example |
|-------|---------|---------|
| `border-border` | Universal borders (cards, dividers, inputs) | `<div class="border border-border">` |
| `border-primary` | Active/selected borders | `<div class="border-2 border-primary">` |
| `border-success` | Success state borders | Combined with `bg-success-dim` |
| `border-warning` | Warning state borders | Combined with `bg-warning-dim` |
| `border-error` | Error state borders | Combined with `bg-error-dim` |

**Event kind tokens** (used in `EventCard`, `TagDecoder`):

| Token | Color | Event Kind |
|-------|-------|------------|
| `text-kind-metadata` / `bg-kind-metadata` | Blue | kind 0 (metadata) |
| `text-kind-note` / `bg-kind-note` | Green | kind 1 (notes) |
| `text-kind-dm` / `bg-kind-dm` | Purple | kind 4 (DMs) |
| `text-kind-channel` / `bg-kind-channel` | Cyan | kind 40-49 (channels) |
| `text-kind-unknown` / `bg-kind-unknown` | Gray | Unrecognized kinds |

**Status pattern** — always use the trio for status badges:

```svelte
<!-- ✅ Correct: dim background + border + text -->
<div class="bg-success-dim border border-success/20 text-success px-3 py-2 rounded-lg">
  ✓ Verified
</div>
<div class="bg-warning-dim border border-warning/20 text-warning px-3 py-2 rounded-lg">
  ⚠ More events available
</div>
<div class="bg-error-dim border border-error/20 text-error px-3 py-2 rounded-lg">
  ✗ Connection failed
</div>
```

**Rules:**
- Never hardcode raw colors (`bg-blue-500`, `text-gray-400`) — always use tokens
- `text-muted-foreground` is the default for secondary text — use it liberally
- `bg-muted` is for inset surfaces that need to be visually distinct from cards
- The `-dim` variants are always used with `border-{status}/20` for a subtle tinted look
- shadcn components handle their own token usage — don't override shadcn primitive colors

#### WCAG 2.2 Contrast Requirements

All color choices must satisfy these minimum contrast ratios (verified in `index.css`):

| WCAG SC | Level | Requirement | Applies To |
|---------|-------|-------------|------------|
| **1.4.3** | AA | ≥ 4.5:1 normal text, ≥ 3:1 large text (≥18pt / ≥14pt bold) | All text on backgrounds |
| **1.4.6** | AAA | ≥ 7:1 normal text, ≥ 4.5:1 large text | Preferred for body text |
| **1.4.11** | AA | ≥ 3:1 for UI components and graphical objects | Borders, icons, focus rings |
| **1.4.1** | A | Color must not be the sole means of conveying information | Status indicators |

**Verified contrast pairs (light / dark mode):**

| Pair | Light Ratio | Dark Ratio | Status |
|------|------------|------------|--------|
| foreground / background | 18:1 | 16:1 | ✅ AAA |
| primary / background | 7.3:1 | 5.5:1 | ✅ AA+ |
| muted-foreground / background | 7.3:1 | 9.8:1 | ✅ AAA |
| border / background | 3.2:1 | 3.2:1 | ✅ SC 1.4.11 |
| success / background | 4.6:1 | 5.0:1 | ✅ AA |
| warning / background | 4.8:1 | 6.5:1 | ✅ AA |
| error / background | 5.0:1 | 5.5:1 | ✅ AA |

**Rules for status colors (SC 1.4.1):**
- Never use color alone to indicate pass/fail, good/bad, online/offline
- Always pair color with an icon (✓/✗/⚠) or text label ("Fast"/"Slow", "Online"/"Offline")
- Use `role="alert"` for errors, `role="status"` for non-critical updates
- The `StatusDot` component is `aria-hidden` — always provide adjacent text

**Rules for NIP badges and dynamic colors:**
- Use theme tokens (`text-kind-metadata`, etc.) not hardcoded Tailwind palette colors
- For inline `style="color: ..."`, provide light/dark variants (see `NIP_INFO` in `nip-constants.ts`)
- Avatar fallback colors must use ≤33% HSL lightness to guarantee 4.5:1 with `text-white`

### shadcn-svelte Migration Conventions (Phase 13)

- Keep generated/open-code UI primitives under `apps/web/src/lib/components/ui/**`.
- Use `$lib` imports for shadcn primitives (e.g. `import { Button } from '$lib/components/ui/button'`).
- Use `cn()` only from `$lib/shadcn/utils` (never from `$lib/utils`).
- Preserve existing `@` alias for app code while supporting `$lib` for shadcn-style imports.
- Token mapping must remain non-cyclic:
  - backing tokens like `--success`, `--warning`, `--error`
  - mapped utility tokens like `--color-success: var(--success)`
- Preserve Relay Dog accessibility/global CSS behavior in `apps/web/src/index.css`:
  - keyframes (`pulse-dot`, `fade-in`, `slide-up`)
  - `:focus-visible` styles
  - `prefers-reduced-motion` handling
  - `.touch-target` and `.sr-only` utilities
- Density target is **Rhea-like compact UI**; if CLI schema does not expose `rhea`, keep config schema-valid and apply compact class choices during component migrations.
- Preferred primitives during migration:
  - Actions: `Button`
  - Containers: `Card`
  - Fields: `Field`, `Label`, `Input`, `Textarea`, `Select`
  - Feedback: `Alert`, `Badge`, `Spinner`, `Skeleton`, `Empty`
  - Overlays: `Dialog`, `Sheet`, `AlertDialog`, `Popover`, `Tooltip`
  - Toasts: `Sonner` (`svelte-sonner`)

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
  outline: 2px solid var(--color-primary);
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
