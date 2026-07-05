---
title: "🎨 Phase 13: shadcn-svelte Migration"
version: "1.0.0"
status: "complete"
last_updated: "2026-07-05"
author: "Saad Tayyab"
---

# 🎨 Phase 13: shadcn-svelte Migration

> **v1.0.0** · **Complete** · Updated 2026-07-05 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---

## Status

**Complete** ✅ (2026-07-05)

## Overview

Migrate Relay Dog's web UI to May 2026 shadcn-svelte practices using the Rhea compact product-interface direction, while preserving existing Svelte 5, Tailwind CSS v4, accessibility, and Relay Dog product behavior. This phase introduces app-local shadcn-svelte primitives, semantic OKLCH design tokens, and a controlled replacement path for the current `@relayscope/ui` primitives.

> **Note:** Relay Dog is already on Svelte 5 and Tailwind CSS v4. Phase 13 is a UI-system migration, not a rewrite of relay, Nostr, API, or persistence behavior.
>
> **Reference:** [Style Guide](../development/style-guide.md) — accessibility, Svelte 5, and Tailwind conventions that must remain valid during the migration.

## User Stories

1. **As a developer**, I want Relay Dog to use shadcn-svelte open-code components so UI primitives are consistent, inspectable, and easy to customize.
2. **As a user**, I want the interface to become denser and more product-focused without losing readability or accessibility.
3. **As a developer**, I want shadcn-svelte aliases, generated components, and tokens to avoid collisions with existing app utilities.
4. **As a maintainer**, I want `@relayscope/ui` usage reduced to genuinely shared components so the app has one clear owner for UI primitives.

## Features

### 1. shadcn-svelte Foundation

Add `apps/web/components.json`, `$lib` alias support, and the non-colliding `$lib/shadcn/utils` utility path required by the shadcn-svelte CLI.

### 2. Rhea-Oriented Theme Tokens

Merge shadcn-svelte semantic OKLCH variables into `apps/web/src/index.css`, preserve Relay Dog custom tokens, and avoid cyclic `--color-*` mappings.

### 3. App-Local UI Primitives

Generate shadcn-svelte primitives into `apps/web/src/lib/components/ui`, including core, form, feedback, overlay, and navigation components.

### 4. Incremental Feature Migration

Replace `@relayscope/ui` and hand-rolled UI patterns feature-by-feature, starting with a low-risk tool form before broader relay, verifier, publisher, and directory surfaces.

### 5. Accessibility Verification

Preserve WCAG 2.2 AA expectations from Phase 9 and verify keyboard, screen-reader, focus, motion, and contrast behavior after each migration slice.

## Table of Contents

1. [Current State](#1-current-state)
2. [Target State](#2-target-state)
3. [Latest May 2026 Practices](#3-latest-may-2026-practices)
4. [Phase 0 — Foundation](#phase-0--foundation)
5. [Phase 1 — Install & Init](#phase-1--install--init)
6. [Phase 2 — CSS & Theming](#phase-2--css--theming)
7. [Phase 3 — Core Components](#phase-3--core-components)
8. [Phase 4 — Forms & Inputs](#phase-4--forms--inputs)
9. [Phase 5 — Overlays & Feedback](#phase-5--overlays--feedback)
10. [Phase 6 — Navigation](#phase-6--navigation)
11. [Phase 7 — Replace Custom UI Package](#phase-7--replace-custom-ui-package)
12. [Phase 8 — Migrate Feature Components](#phase-8--migrate-feature-components)
13. [Phase 9 — Dark Mode](#phase-9--dark-mode)
14. [Phase 10 — Accessibility Audit](#phase-10--accessibility-audit)
15. [Monorepo Notes](#15-monorepo-notes)
16. [Component Mapping](#16-component-mapping)
17. [Risks](#17-risks)
18. [Verification Checklist](#18-verification-checklist)
19. [Files Changed](#19-files-changed)
20. [Effort](#20-effort)
21. [References](#21-references)

---

## 1. Current State

### Tech Stack

| Layer | Version | Notes |
|-------|---------|-------|
| Svelte | 5.56.4 | Already on Svelte 5, uses `$props`, `$state`, `$derived` |
| Tailwind CSS | 4.3.2 | `@tailwindcss/vite` plugin, `@theme` directive in CSS |
| Vite | 8.1.3 | `@sveltejs/vite-plugin-svelte` v7 |
| Biome | 2.5.2 | Formatter + linter (no ESLint / Prettier) |
| Bun | 1.3.14 | Package manager + runtime |
| Turborepo | 2.10.3 | Monorepo task runner |
| TypeScript | 6.0.3 | Strict mode |

### Existing Custom UI (`packages/ui/`)

| Component | Purpose |
|-----------|---------|
| `SectionCard` | Card wrapper with dark-theme borders/shadow |
| `Toast` | Custom notification toasts |
| `LoadingSpinner` | Inline loading indicator |
| `ErrorMessage` | Error display block |
| `EmptyState` | Empty state placeholder |
| `StatusDot` | Small coloured dot for status |
| `AccessibleTabs` | Tab panel with full ARIA + arrow-key nav |

### Current CSS Tokens (`apps/web/src/index.css`)

Already uses **OKLCH** colour format with Tailwind v4 `@theme`:

```
--color-dark-bg, --color-dark-card, --color-dark-border, --color-dark-surface
--color-accent, --color-success, --color-warning, --color-error
--color-text-primary, --color-text-secondary, --color-text-muted
--color-accent-dim, --color-success-dim, --color-warning-dim, --color-error-dim
```

Plus content-width tokens, custom keyframes (`pulse-dot`, `fade-in`, `slide-up`), and accessibility CSS (`prefers-reduced-motion`, `:focus-visible`, `.sr-only`, `.touch-target`).

### Component Inventory (43 `.svelte` files)

```
apps/web/src/components/
  auth/          AuthPrefixDisplay, AuthStatusBadge
  connection/    ConnectionPanel, LatencyPanel, EoseIndicator,
                 ConnectionStatusPanel, WriteTestPanel
  event/         Event display components
  filter/        FilterBuilder, FilterBar
  inspector/     InspectorSection
  monitoring/    Monitoring components
  nav/           NavBar, MobileNav
  nip11/         NIP-11 display components
  publisher/     EventComposer, TagEditor, EventDeleter, PublisherSection
  relay/         RelayCard, AddToDirectory
  search/        SearchBar
  tools/         KeyConverter, ToolsSection, EventBackup,
                 QRCodeGenerator, Nip05Checker
  verifier/      EventVerifier, EventInput, TagDecoder,
                 VerificationPanel, KindBadge, EventDetails
```

### No shadcn-svelte

- No `components.json` anywhere in the repo
- No `bits-ui`, `clsx`, `tailwind-merge`, `tw-animate-css`, or `svelte-sonner` in dependencies
- All UI is hand-rolled or from `@relayscope/ui`

---

## 2. Target State

```
apps/web/
  components.json                         ← shadcn-svelte config
  src/
    lib/
      components/
        ui/                               ← shadcn base components (owned source)
          button/
          card/
          input/
          textarea/
          select/
          checkbox/
          switch/
          label/
          badge/
          alert/
          separator/
          skeleton/
          dialog/
          sheet/
          alert-dialog/
          tooltip/
          popover/
          dropdown-menu/
          tabs/
          breadcrumb/
          table/
          avatar/
          progress/
        nav/                              ← app-specific (NavBar, MobileNav)
        relay/                            ← app-specific
        ...                               ← other feature domains
      hooks/                              ← shadcn-svelte hooks
      shadcn/
        utils.ts                          ← cn() utility, kept away from src/lib/utils/
    index.css                             ← full shadcn theme + custom tokens
```

### New Dependencies

```jsonc
{
  // apps/web/package.json additions
  "dependencies": {
    "bits-ui": "^1.x",
    "svelte-sonner": "^1.x"
  },
  "devDependencies": {
    "clsx": "^2.x",
    "tailwind-merge": "^3.x",
    "tw-animate-css": "^1.x"
  }
}
```

Let the `shadcn-svelte` CLI add and pin the exact compatible dependency versions. Treat this table as a dependency family checklist, not as manually maintained version constraints.

---

## 3. Latest May 2026 Practices

### 3.1 Tailwind CSS v4 Integration

shadcn-svelte fully supports Tailwind CSS v4. Key differences from v3:

- **No `tailwind.config.js`** — config lives entirely in CSS via `@theme inline`
- **`@custom-variant dark (&:is(.dark *))`** — replaces the old `darkMode: ["class"]`
- **`tw-animate-css`** — replaces the `tailwindcss-animate` plugin
- **OKLCH** — the preferred colour format (we already use it)
- **`@source` directive** — controls content scanning paths

### 3.2 Svelte 5 Runes (Already Used)

All shadcn-svelte components use Svelte 5 runes:

- `$props()` — component props (no `export let`)
- `$state()` — reactive state
- `$derived()` — computed values
- `$effect()` — side effects
- `{#snippet}` / `{@render}` — replacement for named slots

### 3.3 Bits UI Primitives

All interactive components are built on **Bits UI** headless primitives:

- Provides unstyled, accessible behaviour
- Exposes `data-slot` attributes for custom CSS targeting
- Namespace imports: `import * as Dialog from "$lib/components/ui/dialog"`
- You get upstream behaviour fixes via `bits-ui` updates; the styled layer stays yours

### 3.4 Rhea Style (May 2026 Target)

Rhea is the May 2026 shadcn-svelte target style for Relay Dog:

- More compact than Luma
- Smaller spacing and denser surfaces
- Built for focused product interfaces
- Keeps Tailwind's spacing scale predictable; do not redefine global `--spacing`
- Use Rhea directly when `shadcn-svelte/create` or the CLI supports it

If the CLI rejects `"style": "rhea"` in `components.json`, keep `components.json` schema-valid and document the fallback: generate a Rhea reference app with `shadcn-svelte/create`, then port the Rhea component source and class choices into Relay Dog's owned `apps/web/src/lib/components/ui` files.

### 3.5 Open Code Architecture

- Component source lives in **your** project, not in `node_modules`
- You own and can modify every component
- Primitives (`bits-ui`) get behaviour fixes via dep updates
- The styled layer stays fully under your control

### 3.6 CSS Variable Theming

Full theme via CSS custom properties:

- `:root` — base theme variables
- `.dark` — dark overrides
- `@theme inline` — registers variables as Tailwind utility classes
- Custom colours use a backing token plus a Tailwind utility token, e.g. `--relay-warning` and `--color-warning: var(--relay-warning)` in `@theme inline`

### 3.7 Accessibility Requirements

- **Dialog, Sheet, Drawer** require a `<Title>` for accessibility (WCAG)
- Bits UI handles ARIA attributes automatically
- Components use `data-slot` without breaking semantic structure
- `role="status"`, `aria-live`, proper labelling patterns are built in

---

## 4. Phase 0 — Foundation

> Set up config files and aliases so the shadcn-svelte CLI works correctly.

### 4.1 Create `components.json` in `apps/web/`

```json
{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "style": "rhea",
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "$lib/components",
    "utils": "$lib/shadcn/utils",
    "ui": "$lib/components/ui",
    "hooks": "$lib/composables",
    "lib": "$lib"
  },
  "typescript": true,
  "registry": "https://shadcn-svelte.com/registry"
}
```

> `tailwind.config` is empty because we're on Tailwind v4 (CSS-only config). The `utils` alias intentionally points at `$lib/shadcn/utils` because this repo already has `apps/web/src/lib/utils/` as an app utility directory.
>
> If the installed CLI/schema does not accept `"style": "rhea"`, remove only that field or use the CLI-generated value, then keep Rhea as the visual migration target.

### 4.2 Ensure `$lib` Alias

Add to `apps/web/vite.config.ts`:

```ts
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
    '$lib': resolve(__dirname, './src/lib'),   // ← add this
  },
},
```

Add to `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "$lib": ["./src/lib"],
      "$lib/*": ["./src/lib/*"],
      "@": ["./src"],
      "@/*": ["./src/*"]
    }
  }
}
```

### 4.3 Verify

```bash
bun run --filter @relayscope/web type-check
bun run --filter @relayscope/web lint
```

---

## 5. Phase 1 — Install & Init

> Run the shadcn-svelte CLI to scaffold the foundation.

### 5.1 Run CLI Init

```bash
bun x shadcn-svelte@latest init \
  --cwd apps/web \
  --base-color zinc \
  --css src/index.css \
  --components-alias '$lib/components' \
  --lib-alias '$lib' \
  --utils-alias '$lib/shadcn/utils' \
  --hooks-alias '$lib/composables' \
  --ui-alias '$lib/components/ui'
```

The CLI will:
- Verify / update `components.json`
- Install `clsx`, `tailwind-merge`, `tw-animate-css`, `bits-ui`
- Create `src/lib/shadcn/utils.ts` with the `cn()` helper
- Set up CSS variables in the global CSS file

### 5.2 If CLI Overwrites CSS

Review the generated diff before accepting any `src/index.css` change. After init, merge:
- Keep your custom Relay Dog tokens (`--color-dark-*`, `--color-accent-*`, etc.)
- Adopt shadcn variables (`--background`, `--foreground`, `--card`, etc.)
- See Phase 2 for the full merged CSS

### 5.3 Install Sonner

```bash
bun x shadcn-svelte@latest add sonner --cwd apps/web
```

### 5.5 Current Implementation Notes (2026-07-05)

- `shadcn-svelte` CLI (`v1.3.0`) in `apps/web` now supports Rhea preset via interactive init; project config is now `style: "rhea"`.
- Init run at repo root still fails preflight (expected): this CLI must be run from app workspace (`apps/web`) for Svelte/Tailwind detection.
- CSS was overwritten by CLI once; it was then corrected to preserve Relay Dog accessibility utilities, keyframes, `@source`, and product token compatibility while keeping shadcn semantic variables.

### 5.4 Verify

```bash
bun run --filter @relayscope/web type-check
bun run --filter @relayscope/web lint
```

---

## 6. Phase 2 — CSS & Theming

> Merge shadcn-svelte's full CSS variable system with Relay Dog's existing OKLCH design tokens.

### 6.1 Full Merged `apps/web/src/index.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
@source "../../../packages/ui/src";

@custom-variant dark (&:is(.dark *));

/* ═══════════════════════════════════════════
   shadcn-svelte theme + Relay Dog tokens
   ═══════════════════════════════════════════ */

:root {
  --radius: 0.625rem;

  /* shadcn semantic tokens — mapped from Relay Dog palette */
  --background:    oklch(16.2% 0.01  285.2);    /* was --color-dark-bg      */
  --foreground:    oklch(92.9% 0.013 255.5);    /* was --color-text-primary */
  --card:          oklch(23.5% 0.025 284);       /* was --color-dark-card    */
  --card-foreground: oklch(92.9% 0.013 255.5);
  --popover:       oklch(23.5% 0.025 284);
  --popover-foreground: oklch(92.9% 0.013 255.5);
  --primary:       oklch(72.2% 0.177 305.5);    /* was --color-accent       */
  --primary-foreground: oklch(100% 0 0);
  --secondary:     oklch(27% 0.03 283.7);       /* was --color-dark-surface */
  --secondary-foreground: oklch(92.9% 0.013 255.5);
  --muted:         oklch(27% 0.03 283.7);
  --muted-foreground: oklch(62% 0.041 257.4);   /* was --color-text-muted   */
  --accent:        oklch(72.2% 0.177 305.5);
  --accent-foreground: oklch(100% 0 0);
  --destructive:   oklch(71.1% 0.166 22.2);     /* was --color-error        */
  --destructive-foreground: oklch(100% 0 0);
  --border:        oklch(31% 0.05 283.9);       /* was --color-dark-border  */
  --input:         oklch(31% 0.05 283.9);
  --ring:          oklch(72.2% 0.177 305.5);

  /* Charts */
  --chart-1: oklch(72.2% 0.177 305.5);
  --chart-2: oklch(77.3% 0.153 163.2);
  --chart-3: oklch(83.7% 0.164 84.4);
  --chart-4: oklch(71.1% 0.166 22.2);
  --chart-5: oklch(62% 0.041 257.4);

  /* Sidebar (future-proof) */
  --sidebar: oklch(16.2% 0.01 285.2);
  --sidebar-foreground: oklch(92.9% 0.013 255.5);
  --sidebar-primary: oklch(72.2% 0.177 305.5);
  --sidebar-primary-foreground: oklch(100% 0 0);
  --sidebar-accent: oklch(27% 0.03 283.7);
  --sidebar-accent-foreground: oklch(92.9% 0.013 255.5);
  --sidebar-border: oklch(31% 0.05 283.9);
  --sidebar-ring: oklch(72.2% 0.177 305.5);

  /* Relay Dog backing tokens */
  --relay-dark-bg:          oklch(16.2% 0.01  285.2);
  --relay-dark-card:        oklch(23.5% 0.025 284);
  --relay-dark-border:      oklch(31% 0.05 283.9);
  --relay-dark-surface:     oklch(27% 0.03 283.7);
  --relay-accent:           oklch(72.2% 0.177 305.5);
  --relay-accent-dim:       oklch(72.2% 0.177 305.5 / 0.15);
  --relay-accent-border:    oklch(72.2% 0.177 305.5 / 0.3);
  --relay-success:          oklch(77.3% 0.153 163.2);
  --relay-success-dim:      oklch(77.3% 0.153 163.2 / 0.12);
  --relay-warning:          oklch(83.7% 0.164 84.4);
  --relay-warning-dim:      oklch(83.7% 0.164 84.4 / 0.12);
  --relay-error:            oklch(71.1% 0.166 22.2);
  --relay-error-dim:        oklch(71.1% 0.166 22.2 / 0.12);
  --relay-text-primary:     oklch(92.9% 0.013 255.5);
  --relay-text-secondary:   oklch(71.1% 0.035 256.8);
  --relay-text-muted:       oklch(62% 0.041 257.4);

  /* Legacy CSS variable compatibility for existing non-Tailwind usages */
  --color-dark-bg:          var(--relay-dark-bg);
  --color-dark-card:        var(--relay-dark-card);
  --color-dark-border:      var(--relay-dark-border);
  --color-dark-surface:     var(--relay-dark-surface);
  --color-accent:           var(--relay-accent);
  --color-accent-dim:       var(--relay-accent-dim);
  --color-accent-border:    var(--relay-accent-border);
  --color-success:          var(--relay-success);
  --color-success-dim:      var(--relay-success-dim);
  --color-warning:          var(--relay-warning);
  --color-warning-dim:      var(--relay-warning-dim);
  --color-error:            var(--relay-error);
  --color-error-dim:        var(--relay-error-dim);
  --color-text-primary:     var(--relay-text-primary);
  --color-text-secondary:   var(--relay-text-secondary);
  --color-text-muted:       var(--relay-text-muted);
  --width-content:          48rem;
  --width-content-xl:       64rem;
  --width-content-2xl:      72rem;
}

.dark {
  /* Dark overrides — currently the app is dark-only so these mirror :root.
     Add distinct values here when light-mode support is added. */
  --background:    oklch(16.2% 0.01  285.2);
  --foreground:    oklch(92.9% 0.013 255.5);
  /* ... extend as needed ... */
}

/* ═══════════════════════════════════════════
   Register tokens with Tailwind v4
   ═══════════════════════════════════════════ */

@theme inline {
  /* Radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Semantic colours → Tailwind utilities */
  --color-background:             var(--background);
  --color-foreground:             var(--foreground);
  --color-card:                   var(--card);
  --color-card-foreground:        var(--card-foreground);
  --color-popover:                var(--popover);
  --color-popover-foreground:     var(--popover-foreground);
  --color-primary:                var(--primary);
  --color-primary-foreground:     var(--primary-foreground);
  --color-secondary:              var(--secondary);
  --color-secondary-foreground:   var(--secondary-foreground);
  --color-muted:                  var(--muted);
  --color-muted-foreground:       var(--muted-foreground);
  --color-accent:                 var(--accent);
  --color-accent-foreground:      var(--accent-foreground);
  --color-destructive:            var(--destructive);
  --color-border:                 var(--border);
  --color-input:                  var(--input);
  --color-ring:                   var(--ring);
  --color-chart-1:                var(--chart-1);
  --color-chart-2:                var(--chart-2);
  --color-chart-3:                var(--chart-3);
  --color-chart-4:                var(--chart-4);
  --color-chart-5:                var(--chart-5);
  --color-sidebar:                var(--sidebar);
  --color-sidebar-foreground:     var(--sidebar-foreground);
  --color-sidebar-primary:        var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent:         var(--sidebar-accent);
  --color-sidebar-accent-foreground:  var(--sidebar-accent-foreground);
  --color-sidebar-border:         var(--sidebar-border);
  --color-sidebar-ring:           var(--sidebar-ring);

  /* Relay Dog custom Tailwind utilities */
  --color-dark-bg:         var(--relay-dark-bg);
  --color-dark-card:       var(--relay-dark-card);
  --color-dark-border:     var(--relay-dark-border);
  --color-dark-surface:    var(--relay-dark-surface);
  --color-accent-dim:      var(--relay-accent-dim);
  --color-accent-border:   var(--relay-accent-border);
  --color-success:         var(--relay-success);
  --color-success-dim:     var(--relay-success-dim);
  --color-warning:         var(--relay-warning);
  --color-warning-dim:     var(--relay-warning-dim);
  --color-error:           var(--relay-error);
  --color-error-dim:       var(--relay-error-dim);
  --color-text-primary:    var(--relay-text-primary);
  --color-text-secondary:  var(--relay-text-secondary);
  --color-text-muted:      var(--relay-text-muted);
}

/* ═══════════════════════════════════════════
   Base layer
   ═══════════════════════════════════════════ */

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
    margin: 0;
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* ═══════════════════════════════════════════
   Existing custom keyframes & utilities
   (preserve — no changes)
   ═══════════════════════════════════════════ */

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.animate-pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.3s ease-out forwards; }

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-slide-up { animation: slide-up 0.35s ease-out forwards; }

/* ═══════════════════════════════════════════
   Accessibility (preserve — no changes)
   ═══════════════════════════════════════════ */

html {
  scroll-padding-top: 5rem;
  scroll-padding-bottom: 5rem;
}

#root { min-height: 100vh; }

.touch-target {
  min-height: 44px;
  min-width: 44px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

### 6.2 Backward-Compatible Token Mapping

| Relay Dog Token | shadcn Token | Tailwind Utility |
|-----------------|-------------|-----------------|
| `--color-accent` | `--primary` | `bg-primary text-primary-foreground` |
| `--color-dark-bg` | `--background` | `bg-background text-foreground` |
| `--color-dark-card` | `--card` | `bg-card text-card-foreground` |
| `--color-dark-border` | `--border` | `border-border` |
| `--color-dark-surface` | `--secondary` | `bg-secondary text-secondary-foreground` |
| `--color-error` | `--destructive` | `bg-destructive text-destructive-foreground` |
| `--color-text-primary` | `--foreground` | `text-foreground` |
| `--color-text-muted` | `--muted-foreground` | `text-muted-foreground` |

Custom tokens (`--color-success`, `--color-warning`, `--color-*_dim`) stay as Relay Dog tokens, registered in `@theme inline` for direct utility use.

### 6.3 Verify

Visually — the app should look **identical** after this CSS change. No component migration has happened yet.

---

## 7. Phase 3 — Core Components

> Install the foundational components every feature will use.

```bash
bun x shadcn-svelte@latest add button button-group card badge alert separator skeleton empty spinner --cwd apps/web
```

### Component Usage Patterns

**Button** — all actions:
```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
</script>

<Button variant="default"   size="default">Connect</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline"   size="icon"><Icon /></Button>
<Button variant="ghost"     size="sm">Cancel</Button>
```

**Card** — replaces `SectionCard`:
```svelte
<script lang="ts">
  import * as Card from "$lib/components/ui/card";
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Relay Info</Card.Title>
    <Card.Description>NIP-11 details</Card.Description>
  </Card.Header>
  <Card.Content>{children}</Card.Content>
  <Card.Footer>...</Card.Footer>
</Card.Root>
```

**Badge** — status, kinds, tags:
```svelte
<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
</script>

<Badge variant="outline">kind 1</Badge>
<Badge variant="default">online</Badge>
```

**Separator** — dividers:
```svelte
<script lang="ts">
  import { Separator } from "$lib/components/ui/separator";
</script>

<Separator />
```

**Skeleton** — loading placeholders:
```svelte
<script lang="ts">
  import { Skeleton } from "$lib/components/ui/skeleton";
</script>

<Skeleton class="h-4 w-[250px]" />
<Skeleton class="h-12 w-12 rounded-full" />
```

**Empty** — empty states:
```svelte
<script lang="ts">
  import * as Empty from "$lib/components/ui/empty";
</script>

<Empty.Root>
  <Empty.Header>
    <Empty.Title>No events found</Empty.Title>
    <Empty.Description>Try another relay or filter.</Empty.Description>
  </Empty.Header>
</Empty.Root>
```

**Spinner** — inline loading:
```svelte
<script lang="ts">
  import { Spinner } from "$lib/components/ui/spinner";
</script>

<Spinner aria-label="Connecting to relay" />
```

### Verify

```bash
bun run --filter @relayscope/web type-check
bun run --filter @relayscope/web lint
```

---

## 8. Phase 4 — Forms & Inputs

> Install form components for Inspector, Publisher, Verifier, Tools.

```bash
bun x shadcn-svelte@latest add field input input-group textarea select native-select checkbox switch radio-group label --cwd apps/web
```

### Vite SPA Form Strategy

Relay Dog is currently a Vite SPA, not a SvelteKit app with route actions. Use shadcn's `Field`, `Label`, `Input`, `Textarea`, `Select`, `Native Select`, `Checkbox`, `Switch`, and `Radio Group` for form composition now. Defer the full shadcn `form` stack until there is a SvelteKit-backed form flow, because `Form` is built around Formsnap, Superforms, and Zod.

### Component Usage Patterns

```svelte
<script lang="ts">
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import * as Field from "$lib/components/ui/field";
  import * as Select from "$lib/components/ui/select";
</script>

<Field.Root>
  <Label for="relay-url">Relay URL</Label>
  <Input id="relay-url" placeholder="wss://relay.example.com" />
  <Field.Description>Use a WebSocket relay URL.</Field.Description>
</Field.Root>

<Select.Root type="single">
  <Select.Trigger class="w-[180px]">Select kind</Select.Trigger>
  <Select.Content>
    <Select.Item value="1">Text Note (1)</Select.Item>
    <Select.Item value="10002">Relay List (10002)</Select.Item>
  </Select.Content>
</Select.Root>
```

### Verify

Manual test: Inspector URL input, Publisher kind selector, Verifier event input, Tool settings.

---

## 9. Phase 5 — Overlays & Feedback

> Install overlays and replace custom Toast.

```bash
bun x shadcn-svelte@latest add dialog sheet alert-dialog tooltip popover sonner --cwd apps/web
```

### Dialog (requires Title for accessibility)

```svelte
<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
</script>

<Dialog.Root>
  <Dialog.Trigger>
    <Button variant="outline">Settings</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Settings</Dialog.Title>
      <Dialog.Description>Configure inspector options.</Dialog.Description>
    </Dialog.Header>
    <!-- content -->
  </Dialog.Content>
</Dialog.Root>
```

### Sheet (side panel)

```svelte
<script lang="ts">
  import * as Sheet from "$lib/components/ui/sheet";
</script>

<Sheet.Root>
  <Sheet.Trigger>
    <Button variant="outline" size="icon">☰</Button>
  </Sheet.Trigger>
  <Sheet.Content side="right">
    <Sheet.Header>
      <Sheet.Title>Relay Details</Sheet.Title>
    </Sheet.Header>
    <!-- content -->
  </Sheet.Content>
</Sheet.Root>
```

### Sonner (replaces custom Toast)

```svelte
<!-- src/App.svelte or root layout -->
<script lang="ts">
  import { Toaster } from "$lib/components/ui/sonner";
</script>

<Toaster richColors position="bottom-right" />

<!-- Usage anywhere -->
<script lang="ts">
  import { toast } from "svelte-sonner";
</script>

<button onclick={() => toast.success("Relay connected!")}>Connect</button>
```

### Tooltip

```svelte
<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <Button variant="ghost" size="icon">⚡</Button>
    </Tooltip.Trigger>
    <Tooltip.Content><p>Inspector</p></Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### AlertDialog (confirmation)

```svelte
<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger>
    <Button variant="destructive">Remove Relay</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you sure?</AlertDialog.Title>
      <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Remove</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
```

### Verify

- Dialog opens, closes, traps focus, announces title
- Sheet slides in, closes on overlay click
- Toast displays and auto-dismisses
- Tooltip appears on hover/focus
- AlertDialog traps focus, confirms/cancels properly

---

## 10. Phase 6 — Navigation

> Install navigation and layout components.

```bash
bun x shadcn-svelte@latest add tabs breadcrumb dropdown-menu table avatar progress --cwd apps/web
```

### Tabs (replaces AccessibleTabs)

```svelte
<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";
</script>

<Tabs.Root value="inspector">
  <Tabs.List>
    <Tabs.Trigger value="inspector">⚡ Inspector</Tabs.Trigger>
    <Tabs.Trigger value="verifier">🔐 Verifier</Tabs.Trigger>
    <Tabs.Trigger value="publisher">✍️ Publisher</Tabs.Trigger>
    <Tabs.Trigger value="tools">🧰 Tools</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="inspector">...</Tabs.Content>
  <Tabs.Content value="verifier">...</Tabs.Content>
  <Tabs.Content value="publisher">...</Tabs.Content>
  <Tabs.Content value="tools">...</Tabs.Content>
</Tabs.Root>
```

> Bits UI handles all ARIA roles, arrow-key navigation, and `aria-selected` automatically.

### DropdownMenu (action menus)

```svelte
<script lang="ts">
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon">⋯</Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item>Copy URL</DropdownMenu.Item>
    <DropdownMenu.Item>View NIP-11</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-destructive">Remove</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### Table (relay lists, event lists)

```svelte
<script lang="ts">
  import * as Table from "$lib/components/ui/table";
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>URL</Table.Head>
      <Table.Head>Status</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each relays as relay}
      <Table.Row>
        <Table.Cell>{relay.url}</Table.Cell>
        <Table.Cell><Badge>{relay.status}</Badge></Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

### Verify

- Tabs keyboard-navigate with arrow keys
- DropdownMenu opens, items are selectable
- Table renders and is scrollable on mobile
- Breadcrumb navigates correctly

---

## 11. Phase 7 — Replace Custom UI Package

> Swap out `@relayscope/ui` components with shadcn equivalents.

### Replacement Map

| `@relayscope/ui` | Action | shadcn-svelte Equivalent |
|-------------------|--------|--------------------------|
| `SectionCard` | **Replace** | `Card` |
| `Toast` | **Replace** | `Sonner` |
| `AccessibleTabs` | **Replace** | `Tabs` (Bits UI) |
| `ErrorMessage` | **Replace** | `Alert variant="destructive"` |
| `LoadingSpinner` | **Replace** | `Spinner` |
| `EmptyState` | **Replace** | `Empty` |
| `StatusDot` | **Keep** | No shadcn equivalent |

### Update `packages/ui/src/index.ts`

```ts
// After migration — only truly shared, non-shadcn components remain
export { default as StatusDot } from './lib/StatusDot.svelte';
// Removed: SectionCard, Toast, ErrorMessage, AccessibleTabs, EmptyState, LoadingSpinner
```

### Where shadcn Components Live

shadcn components go in **`apps/web/src/lib/components/ui/`** — owned source code in the web app. This is the open-code philosophy by design.

`@relayscope/ui` retains only shared, app-agnostic components used (or potentially used) across multiple packages.

### Verify

```bash
bun run --filter @relayscope/ui type-check
bun run --filter @relayscope/web type-check
```

---

## 12. Phase 8 — Migrate Feature Components

> Replace custom UI patterns with shadcn-svelte across all 43 components.

### Migration Order (by dependency depth)

Leaf components first, containers last:

| # | Directory | Components | Primary shadcn Replacements |
|---|-----------|-----------|----------------------------|
| 1 | `nav/` | NavBar, MobileNav | `Tabs` or `Button`, `Sheet` |
| 2 | `relay/` | RelayCard, AddToDirectory | `Card`, `Badge`, `Button`, `DropdownMenu` |
| 3 | `inspector/` | InspectorSection | `Card`, `Input`, `Button` |
| 4 | `verifier/` | EventVerifier, TagDecoder, etc. | `Card`, `Badge`, `Input`, `Button`, `Alert` |
| 5 | `publisher/` | EventComposer, TagEditor, etc. | `Card`, `Textarea`, `Select`, `Button` |
| 6 | `tools/` | KeyConverter, QRCodeGenerator, etc. | `Card`, `Input`, `Button`, `Badge` |
| 7 | `filter/` | FilterBuilder, FilterBar | `Input`, `Select`, `Checkbox`, `Button` |
| 8 | `connection/` | ConnectionPanel, LatencyPanel, etc. | `Card`, `Badge`, `Progress`, `Button` |
| 9 | `search/` | SearchBar | `Input` with icon |
| 10 | `auth/` | AuthPrefixDisplay, AuthStatusBadge | `Badge`, `Card` |
| 11 | `nip11/` | NIP-11 display | `Card`, `Table`, `Badge` |
| 12 | `monitoring/` | Monitoring components | `Card`, `Badge`, `Table`, `Progress` |
| 13 | `event/` | Event display | `Card`, `Badge` |

### Diff Patterns

**Card wrapper:**
```diff
- <div class="bg-dark-card border border-dark-border rounded-xl p-6 ...">
+ <Card.Root>
+   <Card.Content class="p-6">
      ...
- </div>
+   </Card.Content>
+ </Card.Root>
```

**Button:**
```diff
- <button class="px-4 py-2 bg-accent rounded-lg text-sm font-medium ...">
+ <Button variant="default" size="sm">Click me</Button>
- </button>
```

**Badge / Tag:**
```diff
- <span class="px-2 py-1 bg-accent-dim text-accent rounded-full text-xs ...">
+ <Badge variant="outline">online</Badge>
- </span>
```

**Error display:**
```diff
- <div role="alert" class="text-error ...">
+ <Alert variant="destructive">
    ...
- </div>
+ </Alert>
```

### Per-Component Checklist

For each component migration:
1. Replace raw HTML with shadcn component imports
2. Swap custom CSS classes for Tailwind utilities using shadcn tokens
3. Ensure `$props()` types still pass type-check
4. Verify accessibility (labels, ARIA, keyboard)
5. Visual spot-check

### Verify

```bash
bun run --filter @relayscope/web type-check
bun run --filter @relayscope/web lint
bun run dev
# Manual walkthrough: Inspector, Verifier, Publisher, Tools, Directory
```

---

## 13. Phase 9 — Dark Mode

> Formalize dark/light mode support using shadcn's CSS variable system.

### Current State

The app is dark-only. The shadcn theme CSS already maps dark tokens to `:root` variables, so the app works immediately.

### Add Dark Mode Toggle (Optional / Future)

```svelte
<!-- ThemeToggle.svelte -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  let theme = $state<"light" | "dark">("dark");

  function toggle() {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
</script>

<Button variant="ghost" size="icon" onclick={toggle}>
  {#if theme === "dark"}
    <SunIcon class="h-5 w-5" />
  {:else}
    <MoonIcon class="h-5 w-5" />
  {/if}
  <span class="sr-only">Toggle theme</span>
</Button>
```

### Add Light Mode Values (When Ready)

```css
:root {
  /* Light theme values */
  --background:    oklch(1 0 0);
  --foreground:    oklch(0.145 0 0);
  --card:          oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  /* ... etc ... */
}

.dark {
  /* Dark theme values (current Relay Dog palette) */
  --background:    oklch(16.2% 0.01 285.2);
  --foreground:    oklch(92.9% 0.013 255.5);
  /* ... etc ... */
}
```

### Verify

- Toggle between light and dark — all components render correctly
- Custom tokens (`--color-success`, etc.) have both light and dark values
- No contrast issues in either mode

---

## 14. Phase 10 — Accessibility Audit

> Verify all migrated components meet WCAG 2.2 AA (per `docs/development/style-guide.md`).

### The 12-Check Audit (from existing style guide)

| # | Check | How to Verify |
|---|-------|--------------|
| 1 | All SVGs have `aria-hidden="true"` | Search all `.svelte` files for `<svg` without `aria-hidden` |
| 2 | All inputs have `<label>` (visible or `sr-only`) | Verify every `<Input>`, `<Select>`, `<Textarea>` has a `Label` |
| 3 | All interactive elements are native HTML | No `<div onclick>` — all use `<Button>` or native |
| 4 | All buttons ≥ 44px touch target | Verify `size` prop or `min-h-[44px]` class |
| 5 | Icon-only buttons have `aria-label` | Check all `size="icon"` buttons |
| 6 | Toggles have `aria-expanded`/`aria-pressed` | Check DropdownMenu, Sheet triggers |
| 7 | Dynamic errors use `role="alert"` | Check Alert component usage |
| 8 | Dynamic status uses `role="status"` / `aria-live` | Check Toast, loading states |
| 9 | Validation hints use `aria-describedby` | Check form components |
| 10 | Animations respect `prefers-reduced-motion` | Global CSS handles this (preserved) |
| 11 | Focus visible on all interactive elements | Global `:focus-visible` CSS (preserved) |
| 12 | No info by colour alone | Verify icons + text alongside colour |

### shadcn-svelte Accessibility Built-ins

- Bits UI primitives handle ARIA roles automatically
- `Dialog`/`Sheet`/`Drawer` trap focus and restore on close
- `Tabs` handle `role="tablist"`, `role="tab"`, `role="tabpanel"`, arrow-key nav
- `Select` handles `listbox` pattern, keyboard nav, type-ahead
- `DropdownMenu` handles arrow-key nav, type-ahead, focus management

### Additional Items

- [x] `prefers-reduced-motion` — preserved in global CSS
- [x] `scroll-padding-top/bottom` — preserved for WCAG 2.4.11
- [x] `.touch-target` class — available for any new components
- [x] `.sr-only` class — available for screen-reader-only content
- [x] Screen reader smoke test (manual)

### Verify

Run axe-core or Lighthouse accessibility audit on each page.

---

## 15. Monorepo Notes

### Where `components.json` Lives

In **`apps/web/`** — the Svelte application root. The CLI operates relative to this file.

### Where shadcn Components Live

In **`apps/web/src/lib/components/ui/`** — owned source code, not in a shared package. This is intentional (open code).

### Impact on `packages/ui`

The `@relayscope/ui` package shrinks to:
- `StatusDot.svelte`

All other components replaced by shadcn equivalents in the web app.

### Import Paths

- shadcn components: `$lib/components/ui/*` (resolves to `apps/web/src/lib/`)
- Custom shared components: `@relayscope/ui` (workspace package)

### Tailwind `@source` Directive

Keep `@source "../../../packages/ui/src"` so Tailwind scans the shared UI package for utility classes.

---

## 16. Component Mapping

### Buttons & Actions

| Need | Component | Variant / Size |
|------|-----------|---------------|
| Primary action | `Button` | `variant="default"` |
| Destructive | `Button` | `variant="destructive"` |
| Outline | `Button` | `variant="outline"` |
| Ghost / tertiary | `Button` | `variant="ghost"` |
| Link | `Button` | `variant="link"` |
| Icon button | `Button` | `variant="ghost" size="icon"` |
| Grouped actions | `Button Group` | Compact Rhea action clusters |

### Data Display

| Need | Component |
|------|-----------|
| Card | `Card` (Root, Header, Title, Description, Content, Footer) |
| Badge | `Badge` (default, secondary, destructive, outline) |
| Table | `Table` (Root, Header, Body, Row, Head, Cell) |
| Avatar | `Avatar` (Root, Image, Fallback) |
| Progress | `Progress` |
| Divider | `Separator` |
| Empty state | `Empty` |
| Inline loading | `Spinner` |
| Loading placeholder | `Skeleton` |

### Forms

| Need | Component |
|------|-----------|
| Text input | `Input` |
| Input with prefix/suffix/action | `Input Group` |
| Long text | `Textarea` |
| Dropdown | `Select` |
| Native dropdown | `Native Select` |
| Checkbox | `Checkbox` |
| Toggle | `Switch` |
| Radio choice | `Radio Group` |
| Slider | `Slider` |
| Label | `Label` |
| Field wrapper | `Field` |

### Overlays

| Need | Component |
|------|-----------|
| Modal | `Dialog` |
| Side panel | `Sheet` |
| Confirm | `AlertDialog` |
| Context menu | `DropdownMenu` |
| Hover info | `Tooltip` |
| Click popover | `Popover` |
| Toast | `Sonner` |

### Navigation

| Need | Component |
|------|-----------|
| Tab panels | `Tabs` |
| Breadcrumbs | `Breadcrumb` |
| Dropdown actions | `DropdownMenu` |

### Feedback

| Need | Component |
|------|-----------|
| Loading placeholder | `Skeleton` |
| Inline loading | `Spinner` |
| Empty state | `Empty` |
| Error alert | `Alert variant="destructive"` |
| Info alert | `Alert variant="default"` |

---

## 17. Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CSS variable conflicts with existing tokens | High | Medium | Keep custom tokens alongside shadcn; test visual regression |
| Monorepo alias resolution issues | Medium | Medium | Verify `$lib` alias works; test `type-check` each phase |
| Bits UI version incompatibility | Medium | Low | CLI pins compatible versions |
| Existing accessibility regressions | High | Low | Preserve all a11y CSS; run audit after each phase |
| Visual regression during migration | Medium | High | Migrate component-by-component; screenshot before/after |
| Breaking changes in feature components | High | Medium | Migrate leaf components first; test after each feature area |
| `packages/ui` consumers break | Medium | Low | Remove exports only after all consumers migrated |

---

## 18. Verification Checklist

### After Every Phase

```bash
bun run type-check
bun run lint
bun run build
```

### Progress Snapshot (2026-07-05)

- [x] `bun run --filter @relayscope/web type-check` — pass
- [x] `bun run --filter @relayscope/web lint` — pass
- [x] `bun run type-check` — pass
- [x] `bun run lint` — pass
- [x] `bun run build` — pass
- [x] Initial migration slice: `KeyConverter.svelte` now uses shadcn components (`Card`, `Input`, `Label`, `Button`, `Badge`)
- [x] Second migration slice: `Nip05Checker.svelte` now uses shadcn components (`Card`, `Input`, `Label`, `Button`, `Badge`)
- [x] Third migration slice: `QRCodeGenerator.svelte` now uses shadcn components (`Card`, `Textarea`, `Label`, `Button`, `Badge`, `Spinner`)
- [x] Removed all direct `@relayscope/ui` imports from `apps/web/src/**`
- [x] Added web-local shared compatibility components under `apps/web/src/components/shared/**` and switched existing consumers
- [x] Removed `@relayscope/ui` dependency from `apps/web/package.json`
- [x] `bun run --filter @relayscope/web type-check` — pass after full import migration
- [x] `bun run --filter @relayscope/web lint` — pass after full import migration
- [x] `bun run type-check && bun run lint && bun run build` — pass after full import migration
- [x] Restyle pass: switched app toast to shadcn Sonner and removed custom `Toast` wrapper
- [x] Restyle pass: migrated additional high-traffic forms to shadcn field stack (`SearchBar`, `FilterBuilder`, `EventComposer`, `EventDeleter`, `AddRelay`, `EventBackup`)
- [x] Restyle pass: updated shared wrappers (`SectionCard`, `AccessibleTabs`, `ErrorMessage`, `EmptyState`) to semantic shadcn token classes
- [x] Restyle pass: migrated directory/nav/event controls to shadcn actions (`FilterBar`, `RelayDirectory`, `RelayCard`, `AddToDirectory`, `EventCard`, `NavBar`, `MobileNav`)
- [x] `bun run --filter @relayscope/web type-check && bun run --filter @relayscope/web lint` — pass after controls migration
- [x] `bun run type-check && bun run lint && bun run build` — pass after controls migration
- [x] Removed `AccessibleTabs` wrapper usage in app surfaces (`InspectorSection`, `ToolsSection`, `PublisherSection`, `EventBackup`) in favour of direct shadcn `Tabs`
- [x] Removed `AccessibleTabs.svelte` compatibility file from web shared components
- [x] Removed `LoadingSpinner` and `ErrorMessage` wrapper usage from web surfaces by replacing with direct shadcn `Spinner`/`Alert` composition where used
- [x] Deleted obsolete shared compatibility files: `AccessibleTabs.svelte`, `LoadingSpinner.svelte`, `ErrorMessage.svelte`
- [x] Removed `SectionCard` wrapper usage from web surfaces by replacing call-sites with direct shadcn `Card.Root` + `Card.Content`
- [x] Deleted `SectionCard.svelte` compatibility file after migration
- [x] **Design system hardening**: regenerated all 56 UI component groups from latest shadcn-svelte registry (`add --all --overwrite`)
- [x] **Design system hardening**: moved `StatusDot` from `@/components/shared/` to `$lib/components/ui/status-dot/` as proper shadcn-style open-code component
- [x] **Design system hardening**: inlined `EmptyState` wrapper content directly into `App.svelte`, eliminating the last shared wrapper
- [x] **Design system hardening**: deleted entire `apps/web/src/components/shared/` directory (no wrappers remain)
- [x] **Design system hardening**: removed `@source "../../../packages/ui/src"` from `index.css` (no longer needed)
- [x] **Design system hardening**: added biome overrides for shadcn registry code (chart, data-table, sidebar, menubar, etc.)
- [x] **Design system hardening**: added 40 new shadcn primitives on-demand (dialog, dropdown-menu, tooltip, select, table, sheet, popover, alert-dialog, scroll-area, calendar, command, sidebar, drawer, etc.)
- [x] `bun run type-check && bun run lint && bun run build` — all pass after full hardening
- [x] **Full design system adoption**: replaced all 15 raw `<button>` elements with shadcn `Button` component (10 files)
- [x] **Full design system adoption**: replaced raw `<input>` and `<textarea>` with shadcn `Input`/`Textarea` (TagEditor, EventInput)
- [x] **Full design system adoption**: replaced 6 raw status badge `<span>` patterns with `Badge` component (5 files)
- [x] **Full design system adoption**: replaced 10 raw alert `<div>` patterns with `Alert` component + added `warning`/`success` variants (7 files)
- [x] **Full design system adoption**: replaced `<details>` with `Collapsible` component (InspectorSection, Nip05Checker)
- [x] **Full design system adoption**: added `Tooltip` wrappers to all icon buttons (8 files, 10+ buttons)
- [x] **Full design system adoption**: added `Skeleton` loading states for RelayDirectory
- [x] **Full design system adoption**: added `ScrollArea` to 4 overflow containers (EventFeed, MonitorDataPanel, EventCard, EventDeleter)
- [x] **Full design system adoption**: added `DropdownMenu` action menus for relay cards
- [x] **Full design system adoption**: replaced `confirm()` with `AlertDialog` for event deletion
- [x] **Full design system adoption**: replaced manual Prev/Next with `Pagination` component
- [x] **Full design system adoption**: replaced kind/size selector buttons with `ToggleGroup`
- [x] **Full design system adoption**: replaced 4 raw empty states with `Empty` component
- [x] `bun run type-check && bun run lint && bun run build` — all pass after full adoption
- [x] **Theme refinement**: refined oklch values in `index.css` for better depth hierarchy (bg 14% → card 21% → muted 19% → border 30%)
- [x] **Full class migration**: replaced all 311+ legacy class instances (`bg-dark-*`, `text-text-*`, `border-dark-*`, `bg-accent-dim`, `accent-border`, `ring-accent`) with shadcn semantic tokens across 35 files
- [x] **Legacy cleanup**: removed dead `.dark` block, legacy `--relay-*` backing tokens, `--color-dark-*` compatibility bridges from `index.css`
- [x] **Status tokens promoted**: `--success`, `--warning`, `--error` (+ dim variants) moved from legacy bridge to proper `:root` vars with `@theme inline` mapping
- [x] `bun run type-check && bun run lint && bun run build` — all pass after full migration

### Full Migration — Final Verification

- [x] `bun run type-check` — all packages pass
- [x] `bun run lint` — Biome clean
- [x] `bun run build` — succeeds
- [x] `bun run dev` — starts without errors
- [x] Inspector — URL input, connect, NIP-11 display
- [x] Verifier — event input, decode, verify
- [x] Publisher — compose, sign, publish
- [x] Tools — key converter, QR generator, NIP-05 checker
- [x] Directory — relay listing (if backend available)
- [x] Mobile responsive — all pages
- [x] Dark mode — renders correctly
- [x] Keyboard navigation — all interactive elements
- [x] Screen reader — all elements announced (manual smoke)
- [x] Toasts — display and dismiss
- [x] Dialogs — open, close, trap focus (where applicable)
- [x] No console errors or warnings
- [x] Custom tokens (`--color-success`, etc.) still work
- [x] Accessibility 12-check audit passes (manual checklist)

---

## 19. Files Changed

Final implementation files:

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/components.json` | **New** | shadcn-svelte CLI configuration with Relay Dog aliases (`style: rhea`) |
| `apps/web/vite.config.ts` | Modified | Add `$lib` alias while preserving `@` |
| `apps/web/tsconfig.json` | Modified | Add `$lib` and `@` path mappings |
| `apps/web/src/index.css` | Modified | Merge/correct shadcn semantic tokens with Relay Dog dark palette + preserved accessibility/keyframes/
`@source` |
| `apps/web/src/lib/shadcn/utils.ts` | **New** | `cn()` helper generated away from the existing `src/lib/utils/` directory |
| `apps/web/src/lib/components/ui/**` | **New** | App-local shadcn-svelte open-code components |
| `apps/web/src/components/tools/KeyConverter.svelte` | Modified | First isolated migration slice proving shadcn component usage pattern |
| `apps/web/src/components/tools/Nip05Checker.svelte` | Modified | Second isolated migration slice using the same shadcn pattern with preserved accessibility behavior |
| `apps/web/src/components/tools/QRCodeGenerator.svelte` | Modified | Third isolated migration slice for QR form/preview/actions with shadcn primitives |
| `apps/web/src/lib/components/ui/textarea/**` | **New** | Added textarea primitive for tool form migration |
| `apps/web/src/components/shared/**` | **New** | Web-local shared compatibility components (`SectionCard`, `AccessibleTabs`, `Toast`, etc.) used to remove direct `@relayscope/ui` coupling |
| `apps/web/src/components/shared/Toast.svelte` | Deleted | Replaced by shadcn Sonner host in app shell |
| `apps/web/src/**/*.svelte` | Modified | Imports switched from `@relayscope/ui` to `@/components/shared/ui` |
| `apps/web/package.json` | Modified | Removed `@relayscope/ui` dependency from web app |
| `apps/web/src/lib/components/ui/progress/**` | **New** | Added progress primitive for restore progress UI |
| `apps/web/src/lib/components/ui/checkbox/**` | **New** | Added checkbox primitive for directory card selection |
| `apps/web/src/lib/components/ui/tabs/**` | **New** | Directly used across feature sections after removing `AccessibleTabs` wrapper usage |
| `apps/web/src/components/shared/{AccessibleTabs,LoadingSpinner,ErrorMessage}.svelte` | Deleted | Compatibility wrappers removed after direct shadcn replacements |
| `apps/web/src/components/shared/SectionCard.svelte` | Deleted | Compatibility wrapper removed after direct `Card` migration |
| `packages/ui/src/index.ts` | Modified | Reduced to minimal shared export surface (`StatusDot`) |
| `apps/web/src/lib/components/ui/status-dot/**` | **New** | StatusDot moved from shared wrapper to proper shadcn-style open-code component |
| `apps/web/src/components/shared/**` | Deleted | Entire shared wrapper directory removed — all consumers now use direct shadcn primitives |
| `apps/web/src/index.css` | Modified | Removed `@source "../../../packages/ui/src"` directive (no longer needed) |
| `apps/web/src/lib/components/ui/{accordion,alert-dialog,avatar,breadcrumb,button-group,calendar,carousel,chart,collapsible,command,context-menu,data-table,dialog,drawer,dropdown-menu,form,hover-card,input-group,input-otp,item,kbd,menubar,native-select,navigation-menu,pagination,popover,radio-group,range-calendar,resizable,scroll-area,select,sheet,sidebar,slider,switch,table,toggle,toggle-group,tooltip}/**` | **New** | Full shadcn-svelte registry — 40 new component groups added |
| `apps/web/src/lib/composables/is-mobile.svelte.ts` | **New** | shadcn sidebar mobile detection hook |
| `bun.lock` | Modified | Lock dependency changes from Bun |

## 20. Effort

| Task | Estimated Time |
|------|---------------|
| Foundation aliases, `components.json`, and CLI init | 0.5 day |
| CSS token merge and visual baseline verification | 1 day |
| Core primitives and first tool-form migration | 1 day |
| Forms, overlays, feedback, and navigation primitives | 1-2 days |
| Feature component migration across web surfaces | 3-5 days |
| `@relayscope/ui` cleanup | 0.5-1 day |
| Accessibility, responsive, type-check, lint, and build verification | 1-2 days |
| **Total** | **8-12 days** |

---

## 21. References

- [shadcn-svelte Docs](https://shadcn-svelte.com)
- [Svelte 5 Migration](https://shadcn-svelte.com/docs/migration/svelte-5)
- [Tailwind v4 Migration](https://shadcn-svelte.com/docs/migration/tailwind-v4)
- [Bits UI](https://www.bits-ui.com)
- [svelte-sonner](https://svelte-sonner.pixelst.eu)
- [Tailwind CSS v4](https://tailwindcss.com/docs/v4)
- [Relay Dog Style Guide](../development/style-guide.md) — keep in sync with migration
