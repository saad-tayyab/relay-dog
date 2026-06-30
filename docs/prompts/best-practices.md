# 🤖 Prompt Engineering Best Practices (2026)

How to use AI agents effectively for building, reviewing, and maintaining Relay Dog.

## The Golden Rules

### 1. Context Is Everything

AI is only as good as the context you give it. The more specific, the better.

```
❌ Bad:  "Fix the API"
✅ Good: "In apps/api/src/routes/relays.ts, the GET /api/relays endpoint
         returns 500 when the database is empty. Add a null check and
         return an empty array instead."
```

### 2. One Task Per Prompt

Break complex work into atomic prompts. Each prompt should produce one verifiable change.

```
❌ Bad:  "Build the entire Phase 2 feature"
✅ Good: 
  1. "Create a WebSocket connection hook in apps/web/src/lib/stores/relaySocket.svelte.ts"
  2. "Add a connection status indicator component"
  3. "Build the REQ subscription builder UI"
```

### 3. Specify the File

Always name the file you want changed. AI will create or overwrite files if left ambiguous.

```
❌ Bad:  "Add a type for relay events"
✅ Good: "Add a NostrEvent interface to packages/shared/src/types.ts"
```

### 4. Show, Don't Tell

Include example input/output, not just descriptions.

```
❌ Bad:  "Format the error nicely"
✅ Good: "Wrap the error in this format:
         { success: false, error: message, code: 'RELAY_UNREACHABLE' }"
```

### 5. Verify After Every Change

Always ask AI to run checks after making changes.

```
"After making this change, run:
 1. bunx biome check .
 2. bunx turbo type-check
 3. bunx turbo build"
```

---

## Project Architecture

### Monorepo Structure

```
relay-dog/
├── apps/
│   ├── web/          # Vite + Svelte 5 + Tailwind v4
│   └── api/          # Hono + Bun + Drizzle ORM
├── packages/
│   ├── shared/       # Shared types and schemas
│   └── config/       # Shared configs (tsconfig, env)
├── docs/             # Project documentation
├── turbo.json        # Turborepo configuration
├── biome.json        # Biome linting rules
└── package.json      # Root package.json
```

### Package Dependencies

```
@relayscope/web ──→ @relayscope/shared
                   @relayscope/api ──→ @relayscope/shared
```

### File Organization

#### Frontend (`apps/web/src/`)

```
apps/web/src/
├── App.svelte                          # Main app shell (tab routing)
├── components/                         # Svelte components (flat structure)
│   ├── verifier/                       # Exception: subdirectory for feature
│   │   ├── EventVerifier.svelte
│   │   ├── EventInput.svelte
│   │   └── ...
│   ├── RelayProfile.svelte             # Flat structure for most components
│   ├── ConnectionPanel.svelte
│   └── ...
├── lib/
│   ├── composables/                    # Svelte 5 composables (.svelte.ts)
│   │   ├── useLatencyMeasurement.svelte.ts
│   │   ├── useNip42Auth.svelte.ts
│   │   └── ...
│   └── stores/                         # Svelte stores (.svelte.ts)
│       └── relaySocket.svelte.ts
├── utils/                              # Pure utility functions (.ts)
│   ├── relay.ts
│   └── nostrVerify.ts
└── index.css                           # Global styles
```

#### Backend (`apps/api/src/`)

```
apps/api/src/
├── index.ts                            # Hono app entry point
├── routes/                             # API route handlers
│   ├── relays.ts
│   ├── directory.ts
│   └── ...
├── db/
│   ├── index.ts                        # Database connection
│   └── schema.ts                       # Drizzle schema
├── lib/                                # Utility functions
│   ├── errors.ts
│   ├── schemas.ts                      # Zod validation schemas
│   └── ssrf.ts
└── middleware/                          # Hono middleware
    └── auth.ts
```

#### Shared Package (`packages/shared/src/`)

```
packages/shared/src/
├── types.ts                            # TypeScript interfaces
├── schemas.ts                          # Zod validation schemas
└── index.ts                            # Re-exports
```

---

## Code Patterns

### Svelte 5 Runes (Frontend)

All reactivity uses Svelte 5 Runes. Never use Svelte 4 syntax.

```svelte
<script lang="ts">
  // ✅ Props via $props()
  let { relay, onSelect }: { relay: Relay; onSelect: (id: string) => void } = $props();
  
  // ✅ Local state via $state()
  let isExpanded = $state(false);
  let loading = $state(false);
  
  // ✅ Derived values via $derived()
  const displayName = $derived(relay.name || 'Unknown');
  const hasError = $derived(error !== null);
  
  // ✅ Side effects via $effect()
  $effect(() => {
    if (relayId) {
      fetchData(relayId);
    }
  });
</script>
```

### Composable Pattern (Frontend)

Composables are functions that return reactive state. Use getter-based return pattern.

```typescript
// apps/web/src/lib/composables/useExample.svelte.ts

export function useExample() {
  // ✅ Reactive state
  let data = $state<DataType | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  
  // ✅ Non-reactive refs
  let abortController: AbortController | null = null;
  
  // ✅ Actions
  async function fetchData(id: string): Promise<void> {
    loading = true;
    error = null;
    
    try {
      const res = await fetch(`/api/data/${id}`, {
        signal: AbortSignal.timeout(10_000),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      data = json.data;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to fetch data';
    } finally {
      loading = false;
    }
  }
  
  function reset() {
    data = null;
    loading = false;
    error = null;
  }
  
  // ✅ Getter-based return pattern
  return {
    get data() { return data; },
    get loading() { return loading; },
    get error() { return error; },
    fetchData,
    reset,
  };
}
```

### Store Pattern (Frontend)

Stores use the same getter-based return pattern as composables.

```typescript
// apps/web/src/lib/stores/relaySocket.svelte.ts

export function relaySocket(getRelayUrl: () => string) {
  // ✅ Reactive state
  let status = $state<ConnectionStatus>('disconnected');
  let events = $state<NostrEvent[]>([]);
  
  // ✅ Non-reactive refs
  let ws: WebSocket | null = null;
  let backoff = 1000;
  
  // ✅ Functions
  function connect() {
    // Implementation
  }
  
  function disconnect() {
    // Implementation
  }
  
  // ✅ Getter-based return
  return {
    get status() { return status; },
    get events() { return events; },
    connect,
    disconnect,
  };
}
```

### Component Pattern (Frontend)

Components use `$props()` for inputs and `$state()`/`$derived()` for reactivity.

```svelte
<script lang="ts">
  import SectionCard from './SectionCard.svelte';
  
  let { relay, onSelect }: {
    relay: Relay;
    onSelect: (id: string) => void;
  } = $props();
  
  let isHovered = $state(false);
  const displayName = $derived(relay.name || 'Unknown');
</script>

<button
  type="button"
  onclick={() => onSelect(relay.id)}
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
  class="transition-all {isHovered ? 'ring-2 ring-accent' : ''}"
>
  <SectionCard>
    <h3>{displayName}</h3>
  </SectionCard>
</button>
```

### API Route Pattern (Backend)

Routes use Hono with Zod validation and Drizzle ORM.

```typescript
// apps/api/src/routes/example.ts

import { zValidator } from '@hono/zod-validator';
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { exampleTable } from '../db/schema';
import { requireApiKey } from '../middleware/auth';

const exampleRoutes = new Hono();

// ✅ GET endpoint with query params
exampleRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100);
  
  const results = await db
    .select()
    .from(exampleTable)
    .limit(limit)
    .offset((page - 1) * limit);
  
  return c.json({
    success: true,
    data: results,
  });
});

// ✅ POST endpoint with validation
exampleRoutes.post(
  '/',
  requireApiKey,
  zValidator('json', createExampleSchema),
  async (c) => {
    const body = c.req.valid('json');
    
    const [result] = await db
      .insert(exampleTable)
      .values(body)
      .returning();
    
    return c.json({ success: true, data: result }, 201);
  }
);

// ✅ Error handling
exampleRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  
  const [result] = await db
    .select()
    .from(exampleTable)
    .where(eq(exampleTable.id, id))
    .limit(1);
  
  if (!result) {
    return c.json({ success: false, error: 'Not found' }, 404);
  }
  
  return c.json({ success: true, data: result });
});

export default exampleRoutes;
```

### Type Pattern (Shared)

Types are defined in `packages/shared/src/types.ts`.

```typescript
// packages/shared/src/types.ts

// ✅ Interfaces for object shapes
export interface Relay {
  id: string;
  url: string;
  name: string | null;
  description: string | null;
  supportedNips: number[];
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Type aliases for unions
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ✅ Request/Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  totalPages: number;
}

// ✅ Database entity types
export interface HealthCheck {
  id: string;
  relayId: string;
  httpReachable: boolean;
  websocketConnectable: boolean;
  latencyMs: number | null;
  checkedAt: Date;
}
```

---

## WCAG 2.2 Accessibility Requirements

> **This section is mandatory for all frontend prompts.** Every component created or modified must comply with these requirements. Reference `docs/features/phase-9-accessibility.md` for full details.

### The 12 Accessibility Rules

When building or modifying **any** frontend component, you **must** follow all 12 rules:

| # | Rule | WCAG SC | How to Enforce |
|---|------|---------|----------------|
| 1 | All SVGs have `aria-hidden="true"` | 1.1.1 | Every `<svg>` must have this attribute |
| 2 | All inputs have `<label>` (visible or `sr-only`) | 1.3.1, 3.3.2 | Every `<input>`, `<select>`, `<textarea>` needs a label |
| 3 | All interactive elements are native HTML | 2.1.1 | Use `<button>`, `<input>`, `<select>`, `<a>` — never `<div onclick>` |
| 4 | All buttons have `min-h-[44px]` touch targets | 2.5.5 | Add this class to every button |
| 5 | All icon-only buttons have `aria-label` | 4.1.2 | Any button without visible text needs `aria-label` |
| 6 | All toggle buttons have `aria-expanded` or `aria-pressed` | 4.1.2 | Expandable sections, pressed states |
| 7 | All dynamic errors use `role="alert"` | 3.3.1 | Error messages that appear without user action |
| 8 | All dynamic status uses `role="status"` or `aria-live` | 4.1.3 | Copy feedback, auto-updating counts, toasts |
| 9 | All validation hints use `aria-describedby` | 3.3.2 | Connect hint text to its input |
| 10 | All animations respect `prefers-reduced-motion` | 2.3.3 | Global CSS handles this — don't add new animations without it |
| 11 | Focus is visible on all interactive elements | 2.4.7 | Global `:focus-visible` handles this — don't override it |
| 12 | No information conveyed by color alone | 1.4.1 | Use icons + text alongside color indicators |

### Accessibility Prompt Template

When creating a new component, always include this in the prompt:

```
Accessibility requirements (WCAG 2.2 AA):
- All SVGs must have aria-hidden="true"
- All inputs must have associated <label> (visible or sr-only)
- All interactive elements must be native HTML elements
- All buttons must have min-h-[44px] touch targets
- All icon-only buttons must have aria-label
- All toggle buttons must have aria-expanded or aria-pressed
- All dynamic errors must use role="alert"
- All dynamic status must use role="status" or aria-live="polite"
- All validation hints must be connected via aria-describedby
- All animations must respect prefers-reduced-motion (global CSS handles this)
- Focus must be visible on all interactive elements (global :focus-visible handles this)
- No information should be conveyed by color alone
```

### Common ARIA Patterns

#### Skip Link (every page)
```svelte
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold">
  Skip to main content
</a>
```

#### Landmark Regions
```svelte
<header class="sticky top-0 z-10">...</header>
<main id="main-content">...</main>
<nav aria-label="Section navigation">...</nav>
<footer>...</footer>
<form role="search" aria-label="Search">...</form>
```

#### Dynamic Error Messages
```svelte
{#if error}
  <div role="alert" class="px-3 py-2 rounded-lg bg-error-dim ...">
    ⚠ {error}
  </div>
{/if}
```

#### Copy Button Feedback
```svelte
<div aria-live="polite" class="sr-only">
  {copied ? 'Copied to clipboard' : ''}
</div>
<button onclick={handleCopy}>
  {copied ? '✓ Copied' : 'Copy'}
</button>
```

#### Form Input with Hint
```svelte
<input
  id="my-input"
  aria-describedby="my-hint"
  aria-invalid={hasError}
  ...
/>
<p id="my-hint" role="status" class="text-xs text-warning">
  Must contain @
</p>
```

#### Show/Hide Sensitive Data
```svelte
<button aria-expanded={visible} onclick={() => visible = !visible}>
  {visible ? 'Hide' : 'Show'}
</button>
{#if visible}
  <p>{sensitiveData}</p>
{/if}
```

#### Progress Bar
```svelte
<div
  role="progressbar"
  aria-valuenow={current}
  aria-valuemin={0}
  aria-valuemax={total}
  aria-label="Upload progress"
  class="h-2 rounded-full bg-dark-surface"
>
  <div class="h-full bg-accent" style="width: {(current/total)*100}%"></div>
</div>
```

#### Toggle Button
```svelte
<button
  aria-pressed={isActive}
  onclick={() => isActive = !isActive}
  class="min-h-[44px] ..."
>
  {isActive ? 'On' : 'Off'}
</button>
```

#### Expandable Section
```svelte
<button
  aria-expanded={isExpanded}
  onclick={() => isExpanded = !isExpanded}
>
  Details
</button>
{#if isExpanded}
  <div>Expanded content</div>
{/if}
```

### WCAG 2.2 New Criteria to Remember

These are **new in WCAG 2.2** (not in 2.1) — don't forget them:

| Criterion | What to Do |
|-----------|------------|
| **2.4.11 Focus Not Obscured** | Add `scroll-padding-top/bottom` to `html` when using sticky/fixed UI |
| **2.4.13 Focus Appearance** | Use `:focus-visible` with 2px+ outline and high contrast |
| **2.5.7 Dragging Movements** | Provide single-pointer alternative for any drag interaction |
| **2.5.8 Target Size** | All buttons ≥24×24px CSS pixels (we use 44×44px) |
| **3.2.6 Consistent Help** | If help exists, keep it in the same location across pages |
| **3.3.7 Redundant Entry** | Don't ask users to re-enter info they already provided |
| **3.3.8 Accessible Auth** | No CAPTCHAs or cognitive function tests; use `type="password"` for sensitive inputs |

---

## Prompt Templates

### New Feature (Frontend)

```
Create [COMPONENT_NAME] in apps/web/src/components/[FEATURE]/[ComponentName].svelte.

Requirements:
- [Requirement 1]
- [Requirement 2]

Constraints:
- Use Svelte 5 Runes ($state, $derived, $effect, $props())
- Follow component pattern from apps/web/src/components/RelayProfile.svelte
- Use SectionCard for consistent card layout
- Use Tailwind v4 with theme tokens (dark-bg, dark-card, accent, etc.)

After making changes, run:
1. bunx biome check .
2. bunx turbo type-check
```

### New Feature (Backend)

```
Create [ROUTE_NAME] in apps/api/src/routes/[route-name].ts.

Requirements:
- [Requirement 1]
- [Requirement 2]

Constraints:
- Use Hono with Zod validation
- Follow API pattern from apps/api/src/routes/relays.ts
- Use Drizzle ORM for database queries
- Add error handling with proper HTTP status codes

After making changes, run:
1. bunx biome check .
2. bunx turbo type-check
```

### New Feature (Shared)

```
Add [TYPE_NAME] to packages/shared/src/types.ts.

Requirements:
- [Requirement 1]
- [Requirement 2]

Constraints:
- Use TypeScript interfaces for object shapes
- Use type aliases for unions
- Export all types

After making changes, run:
1. bunx biome check .
2. bunx turbo type-check
```

### Bug Fix

```
In [FILE], [DESCRIPTION_OF_BUG].

Expected: [WHAT SHOULD HAPPEN]
Actual: [WHAT ACTUALLY HAPPENS]

Fix it and verify with:
1. bunx biome check .
2. bunx turbo type-check
3. bunx turbo build
```

### Refactor

```
Refactor [FILE] to [GOAL].

Current code:
```[language]
[PASTE CURRENT CODE]
```

Requirements:
- Preserve all existing behavior
- Use [PATTERN] instead of [OLD_PATTERN]
- Follow conventions in docs/development/style-guide.md

After making changes, run:
1. bunx biome check .
2. bunx turbo type-check
```

### Code Review

```
Review [FILE] for:
1. TypeScript best practices
2. Error handling completeness
3. Security issues
4. Performance concerns

Reference: docs/development/style-guide.md
```

### Documentation

```
Update [DOC_FILE] to reflect [CHANGE].

Current content: [PASTE RELEVANT SECTION]
New content should include: [WHAT_TO_ADD]
```

---

## Project-Specific Prompts

### Working on Relay Dog

Always reference the project context:

```
I'm working on Relay Dog, a Nostr relay inspector.

Tech stack:
- Bun 1.3 + Turborepo monorepo
- Apps: Vite+Svelte 5 (web), Hono+Bun (api)
- Drizzle ORM + PostgreSQL
- Biome for linting, TypeScript 6.0
- Svelte 5 Runes ($state, $derived, $effect, $props())
- Stores use getter-based return pattern (see relaySocket.svelte.ts)
- Components use SectionCard for consistent card layout
- Tailwind v4 with custom theme tokens (dark-bg, dark-card, dark-surface, dark-border, accent, accent-dim, text-primary, text-secondary, text-muted, warning, etc.)

Project docs are in docs/. Always check:
- docs/development/style-guide.md for code conventions
- docs/architecture/database.md for schema
- docs/api/endpoints.md for API patterns
- docs/features/ for feature specs
- docs/prompts/best-practices.md for prompt guidelines
```

### Phase-Specific

```
I'm working on Phase [N]: [PHASE_NAME].

Feature spec: docs/features/phase-[N]-[name].md

What to build:
1. [Task 1]
2. [Task 2]

NIPs involved: [NIP-XX, NIP-YY]

After implementation, verify:
1. bunx biome check .
2. bunx turbo type-check
3. bunx turbo build
4. Manual test: [HOW_TO_TEST]
```

### Creating a Composable

```
Create a composable [COMPOSABLE_NAME] in apps/web/src/lib/composables/[name].svelte.ts.

Requirements:
- [State variables needed]
- [Actions/methods needed]

Constraints:
- Use Svelte 5 Runes ($state, $derived, $effect)
- Use getter-based return pattern (see useLatencyMeasurement.svelte.ts)
- Include reset() method for cleanup
- Handle errors gracefully

After making changes, run:
1. bunx biome check .
2. bunx turbo type-check
```

### Creating a Component

```
Create a component [COMPONENT_NAME] in apps/web/src/components/[ComponentName].svelte.

Requirements:
- [Props needed]
- [UI elements]
- [Behavior]

Constraints:
- Use $props() for inputs
- Use SectionCard for card layout
- Use Tailwind v4 theme tokens
- Follow component pattern from RelayProfile.svelte

After making changes, run:
1. bunx biome check .
2. bunx turbo type-check
```

### Creating an API Route

```
Create an API route [ROUTE_NAME] in apps/api/src/routes/[route-name].ts.

Requirements:
- [Endpoints needed]
- [Request/response format]
- [Validation]

Constraints:
- Use Hono framework
- Use Zod for validation
- Use Drizzle ORM for queries
- Follow route pattern from relays.ts
- Add requireApiKey middleware for mutating endpoints

After making changes, run:
1. bunx biome check .
2. bunx turbo type-check
```

---

## Anti-Patterns to Avoid

### 1. Vague Prompts
```
❌ "Make it better"
✅ "Replace the inline styles in RelayCard with Tailwind classes"
```

### 2. Multiple Unrelated Changes
```
❌ "Fix the API and update the README and add tests"
✅ "Fix the null pointer in GET /api/relays" (one thing)
```

### 3. Skipping Verification
```
❌ [Make change, move on]
✅ "After making this change, run biome check and type-check"
```

### 4. Not Providing Error Messages
```
❌ "It doesn't work"
✅ "Getting this error: TS2345: Argument of type 'string' is not assignable to parameter of type 'number'"
```

### 5. Ignoring Existing Patterns
```
❌ "Create a new way to handle errors"
✅ "Use the same error pattern from apps/api/src/routes/relays.ts"
```

### 6. Using Wrong File Extensions
```
❌ "Create useExample.ts in lib/composables/"
✅ "Create useExample.svelte.ts in apps/web/src/lib/composables/"
```

### 7. Using Svelte 4 Syntax
```
❌ export let relay;
✅ let { relay } = $props();

❌ $: displayName = relay.name || 'Unknown';
✅ const displayName = $derived(relay.name || 'Unknown');

❌ let isExpanded = false;
✅ let isExpanded = $state(false);
```

### 8. Using Wrong Command Prefix
```
❌ bun run lint
✅ bunx biome check .

❌ bun run type-check
✅ bunx turbo type-check
```

---

## Effective Workflow

### Feature Development

```
1. Read the feature spec
   → "Read docs/features/phase-8-developer-toolkit.md and summarize what needs to be built"

2. Plan the implementation
   → "Based on the spec, list the files I need to create/modify"

3. Implement one piece at a time
   → "Create the router utility in apps/web/src/lib/utils/router.ts"
   → "Create the NavBar component in apps/web/src/components/nav/NavBar.svelte"
   → "Refactor App.svelte for section-based routing"

4. Verify after each step
   → "Run bunx biome check . && bunx turbo type-check && bunx turbo build"

5. Test manually
   → "Start the dev server and test the navigation"

6. Update docs
   → "Update docs/features/phase-8-developer-toolkit.md to mark completed items"
```

### Debugging

```
1. Describe the problem precisely
   → "In apps/web/src/App.svelte, clicking the retry button
      throws 'Cannot read property of undefined'"

2. Share the error
   → "Error: TypeError: Cannot read properties of undefined (reading 'url')
      at App.svelte:245:23"

3. Ask for the fix
   → "Fix this null check. The relay state might be null when the
      component mounts before the fetch completes."

4. Verify
   → "Run bunx biome check . && bunx turbo type-check && bunx turbo build"
```

---

## Version-Specific Notes

### TypeScript 6.0
- Stricter CSS import handling → needs `vite-env.d.ts`
- Use `satisfies` operator for type narrowing
- `--noEmit` in Vite apps (Vite handles bundling)

### Biome 2.5
- Run `biome check --write .` for auto-fix
- Tailwind CSS support via `tailwindDirectives: true`
- Some rules are `warn` not `error` — fix them but don't block
- Use `bunx biome check .` not `bun run lint`

### Svelte 5
- Use Runes: `$state`, `$derived`, `$effect`, `$props()` for all reactivity
- Component files use `.svelte` extension
- Composable files use `.svelte.ts` extension (required for runes)
- Store files use `.svelte.ts` extension (required for runes)
- Snippets replace React's `children` prop
- Event handlers are lowercase: `onclick`, `onsubmit`
- `bind:value` for two-way input binding
- Scoped CSS by default, but prefer Tailwind
- Use `SectionCard` for consistent card layouts

### Hono 4.12
- Use `Bun.serve()` directly (not `@hono/node-server`)
- `app.fetch` for Bun integration
- Built-in middleware: `cors`, `logger`, `prettyJSON`
- Use `zValidator` for request validation

### Drizzle ORM 0.45
- Use `$inferSelect` for type inference
- Use `returning()` to avoid extra queries
- Use transactions for multi-step writes
- `drizzle-kit generate` for migrations (not `push` in prod)

### Turborepo
- Use `bunx turbo [command]` for running tasks
- Tasks are defined in `turbo.json`
- `type-check` depends on `^type-check` (builds dependencies first)

---

## Quick Reference

### Commands

```bash
# Development
bun run dev              # Start all dev servers
bun run build            # Build all packages
bun run lint             # Lint all packages
bun run type-check       # Type-check all packages

# Database
bun run db:generate      # Generate migration
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio

# Individual packages
bunx biome check .       # Lint current package
bunx turbo type-check    # Type-check all packages
bunx turbo build         # Build all packages
```

### File Extensions

| Type | Extension | Location |
|------|-----------|----------|
| Svelte components | `.svelte` | `apps/web/src/components/` |
| Svelte composables | `.svelte.ts` | `apps/web/src/lib/composables/` |
| Svelte stores | `.svelte.ts` | `apps/web/src/lib/stores/` |
| Utility functions | `.ts` | `apps/web/src/utils/` or `apps/api/src/lib/` |
| API routes | `.ts` | `apps/api/src/routes/` |
| Types | `.ts` | `packages/shared/src/` |

### Theme Tokens

```css
/* Background colors */
dark-bg          /* Main background */
dark-card        /* Card background */
dark-surface     /* Surface background */

/* Border colors */
dark-border      /* Default border */

/* Text colors */
text-primary     /* Primary text */
text-secondary   /* Secondary text */
text-muted       /* Muted text */

/* Accent colors */
accent           /* Primary accent */
accent-dim       /* Dimmed accent */
accent-border    /* Accent border */

/* Status colors */
success          /* Success state */
warning          /* Warning state */
error            /* Error state */
```

---

*Last updated: 2026-07-01*
*Feature spec: docs/features/phase-8-developer-toolkit.md*
