# Phase 13 — shadcn-svelte Latest Practices Migration Plan

> **Date:** 2026-07-05
> **Goal:** Align `apps/web` with the latest shadcn-svelte conventions as of mid-2026 — Tailwind CSS v4, `tailwind-variants` (tv), `data-slot` attributes, `tw-animate-css`, updated `components.json` schema, fresh CLI-generated components, and removal of legacy patterns.

---

## 0. Current State Summary

| Area | Status | Notes |
|------|--------|-------|
| **shadcn-svelte CLI** | `^1.3.0` | Needs `update --all` to pull latest registry |
| **bits-ui** | `^2.16.3` | Latest available — OK |
| **tailwindcss** | `^4.3.2` + `@tailwindcss/vite` | Already on v4 — CSS uses `@import "tailwindcss"` + `@import "tw-animate-css"` |
| **tw-animate-css** | `^1.4.0` | OK |
| **tailwind-variants** | `^3.2.2` | OK — used in `button.svelte`, `badge.svelte` |
| **mode-watcher** | `^1.1.0` | OK |
| **svelte-sonner** | `^1.1.0` | OK |
| **lucide-svelte** | `@lucide/svelte ^1.23.0` | OK |
| **components.json** | Has `style: "rhea"`, `registry` key | Schema matches latest |
| **UI components installed** | alert, badge, button, card, checkbox, empty, field, input, label, progress, separator, skeleton, sonner, spinner, tabs, textarea | Some are project-specific (empty, field, spinner) |
| **`data-slot` attribute** | Present on all UI component root elements | ✅ Follows latest convention |
| **`cn()` util** | `$lib/shadcn/utils.ts` — has `cn`, `WithoutChild`, `WithoutChildren`, `WithoutChildrenOrChild`, `WithElementRef` | ✅ Latest signature |
| **Shared wrapper components** | `@/components/shared/ui` exports `EmptyState`, `SectionCard`, `StatusDot` | Thin wrappers over shadcn primitives |
| **Feature components import** | 20+ `.svelte` files import from `@/components/shared` | Need to verify all wrappers are still needed |
| **CSS variables** | OKLCH-based tokens in `index.css` | ✅ Follows v4 OKLCH convention |
| **`@custom-variant dark`** | `@custom-variant dark (&:is(.dark *))` | ✅ Tailwind v4 dark mode |
| **Svelte version** | `^5.56.4` — runes throughout | ✅ |
| **Missing newer components** | No `dialog`, `dropdown-menu`, `popover`, `tooltip`, `select`, `table`, `toggle`, `scroll-area`, `sheet`, `skeleton` (has one), `collapsible`, `calendar`, `date-picker` | Consider adding as features need them |

---

## 1. Pre-Migration Checklist

- [ ] **Git branch**: Create `feat/shadcn-latest-migration` from `main`
- [ ] **Stash local changes**: `git stash --include-untracked`
- [ ] **Backup current components**: `cp -r src/lib/components/ui src/lib/components/ui.bak`
- [ ] **Verify `bun run build` passes** on current `main` (baseline)

---

## 2. Upgrade shadcn-svelte CLI + Regenerate Components

### 2a. Update CLI

```bash
bun add -D shadcn-svelte@latest
```

### 2b. Regenerate ALL components from latest registry

```bash
cd apps/web
npx shadcn-svelte@latest add --all --overwrite
```

> **Why `--overwrite`:** This ensures every installed component matches the latest registry code (new `data-slot` patterns, updated `tv()` variants, OKLCH tokens, bits-ui v2 bindings). Custom edits in existing components will be lost — diff before running.

### 2c. Diff & re-apply customizations

After overwrite, review each component for any project-specific customizations (e.g., the `empty`, `field`, `spinner` components are not in the default registry). Re-apply only intentional divergences.

### 2d. Verify components.json

Current `components.json` is already valid. After CLI update, re-run init to ensure schema matches:

```bash
npx shadcn-svelte@latest init --overwrite
```

Expected `components.json` shape (should not change much):

```json
{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "tailwind": {
    "css": "src/index.css",
    "baseColor": "zinc"
  },
  "aliases": {
    "components": "$lib/components",
    "utils": "$lib/shadcn/utils",
    "ui": "$lib/components/ui",
    "hooks": "$lib/composables",
    "lib": "$lib"
  },
  "typescript": true,
  "registry": "https://shadcn-svelte.com/registry",
  "style": "rhea",
  "iconLibrary": "lucide"
}
```

---

## 3. CSS Layer Updates

### 3a. Verify `index.css` imports

Current imports are correct for v4:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn-svelte/tailwind.css";
```

No changes needed — these match the latest recommended setup.

### 3b. Review `@custom-variant dark`

Already uses the v4 pattern:

```css
@custom-variant dark (&:is(.dark *));
```

✅ No change needed.

### 3c. Verify `@source` directive

Current: `@source "../../../packages/ui/src";`

After removing `@relayscope/ui` dependency (Phase 5 below), this line should be removed or redirected.

---

## 4. Component Pattern Audit

All UI components must follow these conventions:

| Convention | Check |
|------------|-------|
| **`<script lang="ts" module>`** for exported types/variants | ✅ button, badge use `tv()` in module block |
| **`<script lang="ts">`** for instance logic | ✅ |
| **`data-slot="component-name"`** on root element | ✅ Present on all regenerated components |
| **`$props()` with `$bindable()` for refs** | ✅ `ref = $bindable(null)` |
| **`@render children?.()`** instead of `<slot>` | ✅ |
| **`cn()` from `$lib/shadcn/utils.js`** for class merging | ✅ |
| **`tv()` from `tailwind-variants`** for variant definitions | ✅ button, badge |
| **`WithElementRef`** type helper for ref typing | ✅ |
| **OKLCH color tokens** via CSS custom properties | ✅ |

---

## 5. Remove `@relayscope/ui` Dependency (if still present)

The `@relayscope/ui` package has been reduced to a minimal surface (`StatusDot`). Plan:

1. Move `StatusDot` into `apps/web/src/components/shared/` or inline it
2. Remove `@relayscope/ui` from `apps/web/package.json`
3. Remove `packages/ui` from the monorepo if no other consumers
4. Remove the `@source "../../../packages/ui/src"` directive from `index.css`

---

## 6. Shared Wrapper Components Audit

Current wrappers in `@/components/shared/ui`:

| Wrapper | Wraps | Action |
|---------|-------|--------|
| `EmptyState.svelte` | `$lib/components/ui/empty` | **Keep** — adds `animate-fade-in` class and aria-label; useful abstraction |
| `SectionCard.svelte` | `$lib/components/ui/card` | **Keep** — adds section-level defaults (padding, border) |
| `StatusDot.svelte` | Raw HTML | **Keep** — no shadcn equivalent; move to `$lib/components/ui/status-dot/` if reusable |

Files importing `@/components/shared` (20+ files): No changes needed unless wrappers are refactored.

---

## 7. New Components to Add (On Demand)

These shadcn-svelte components are **not yet installed** but may be needed as features grow:

| Component | When to Add |
|-----------|-------------|
| `dialog` | Relay detail modals, settings |
| `dropdown-menu` | Relay actions menu, context menus |
| `popover` | Filter dropdowns, tooltips with content |
| `tooltip` | Icon-only buttons, info hints |
| `select` | Relay type filtering, event kind selection |
| `table` | Relay listing data table |
| `toggle` | Filter toggles, view mode switches |
| `scroll-area` | Event feed, long lists |
| `sheet` | Mobile slide-out panels |
| `collapsible` | Inspector sections |
| `separator` | ✅ Already installed |
| `skeleton` | ✅ Already installed |

**Approach:** Add via `npx shadcn-svelte@latest add <component>` as each feature needs it. Do not bulk-add unused components.

---

## 8. Dependency Version Audit

After running `bun install` post-migration, verify these are at latest:

| Package | Current | Target | Action |
|---------|---------|--------|--------|
| `shadcn-svelte` | `^1.3.0` | `^1.3.0+` | `bun add -D shadcn-svelte@latest` |
| `bits-ui` | `^2.16.3` | `^2.16.3+` | CLI handles this |
| `tailwindcss` | `^4.3.2` | `^4.3.2+` | Check for patch updates |
| `@tailwindcss/vite` | `^4.3.2` | Match `tailwindcss` | Keep in sync |
| `tw-animate-css` | `^1.4.0` | `^1.4.0+` | Check for updates |
| `tailwind-variants` | `^3.2.2` | `^3.2.2+` | Check for updates |
| `mode-watcher` | `^1.1.0` | `^1.1.0+` | Check for updates |
| `svelte-sonner` | `^1.1.0` | `^1.1.0+` | Check for updates |
| `@lucide/svelte` | `^1.23.0` | `^1.23.0+` | Check for updates |
| `svelte` | `^5.56.4` | `^5.56.4+` | Check for updates |
| `vite` | `^8.1.3` | `^8.1.3+` | Check for updates |

```bash
cd apps/web && bun update
```

---

## 9. File-by-File Change Manifest

### 9a. Config / Foundation Files

| File | Change | Reason |
|------|--------|--------|
| `apps/web/components.json` | **Re-generate** via `init --overwrite` | Ensure schema matches latest CLI |
| `apps/web/package.json` | **Update deps** | Pull latest shadcn-svelte + deps |
| `apps/web/index.css` | **Verify only** | Already on v4 patterns; may need minor token tweaks after component update |
| `apps/web/vite.config.ts` | **No change** | Already correct |
| `apps/web/svelte.config.js` | **No change** | Already correct |
| `apps/web/tsconfig.json` | **No change** | Already has `$lib` and `@` aliases |
| `apps/web/src/lib/shadcn/utils.ts` | **Verify after init** | CLI may regenerate; ensure `WithElementRef` etc. preserved |

### 9b. UI Components (`src/lib/components/ui/`)

All files in `src/lib/components/ui/**` will be **overwritten** by CLI:

```bash
npx shadcn-svelte@latest add --all --overwrite
```

**Then manually verify** these project-specific components that may not be in registry:
- `empty/` — project-specific; re-apply customizations after overwrite
- `field/` — project-specific; re-apply customizations
- `spinner/` — project-specific; re-apply customizations

### 9c. Shared Components (`src/components/shared/`)

| File | Change | Reason |
|------|--------|--------|
| `EmptyState.svelte` | **Verify** | Should still wrap `empty` component correctly |
| `SectionCard.svelte` | **Verify** | Should still wrap `card` component correctly |
| `StatusDot.svelte` | **Move** to `src/lib/components/ui/status-dot/` | Make it a proper shadcn-style component |
| `ui.ts` | **Update exports** after StatusDot move |

### 9d. Feature Components (`src/components/*/`)

**No structural changes required.** All 20+ feature components import from `@/components/shared` and `$lib/components/ui`, which remain stable. Verify after migration:

| Component Dir | Files | Import Pattern | Action |
|---------------|-------|----------------|--------|
| `auth/` | 2 | `@/components/shared`, `$lib/components/ui` | ✅ Verify |
| `connection/` | 5 | `@/components/shared` | ✅ Verify |
| `event/` | 3 | `@/components/shared` | ✅ Verify |
| `filter/` | 2 | `@/components/shared` | ✅ Verify |
| `inspector/` | 1 | `@/components/shared` | ✅ Verify |
| `monitoring/` | 1 | `@/components/shared` | ✅ Verify |
| `nav/` | 2 | — | ✅ Verify |
| `nip11/` | 3 | `$lib/components/ui` | ✅ Verify |
| `publisher/` | 4 | `@/components/shared` | ✅ Verify |
| `relay/` | 7 | `@/components/shared` | ✅ Verify |
| `search/` | 1 | `$lib/components/ui` | ✅ Verify |
| `tools/` | 5 | `$lib/components/ui` | ✅ Verify |
| `verifier/` | 6 | `$lib/components/ui` | ✅ Verify |

### 9e. Composables (`src/lib/composables/`)

| File | Change | Reason |
|------|--------|--------|
| `useToast.svelte.ts` | **Verify** | Uses `svelte-sonner`; should be unaffected |
| All others | **No change** | Pure logic, no UI imports |

---

## 10. Verification Checklist

Run after every step and once at the end:

```bash
# 1. Type check
cd apps/web && bun run type-check

# 2. Lint
bun run lint

# 3. Build
bun run build

# 4. Visual check
bun run dev
# → Navigate all sections: Inspector, Verifier, Publisher, Relay Directory, Tools
# → Check all interactive elements: buttons, inputs, tabs, badges, cards
# → Verify dark mode toggle (if implemented)
# → Test mobile responsive view

# 5. Full monorepo check
cd ../.. && bun run type-check && bun run lint && bun run build
```

---

## 11. Execution Order

| Step | Description | Estimated Time |
|------|-------------|----------------|
| **1** | Create branch, backup, baseline build | 10 min |
| **2** | `bun add -D shadcn-svelte@latest` + `bun update` | 5 min |
| **3** | `npx shadcn-svelte@latest add --all --overwrite` | 2 min |
| **4** | Diff component changes, re-apply project-specific customizations (`empty`, `field`, `spinner`) | 1–2 hrs |
| **5** | Move `StatusDot` to `$lib/components/ui/status-dot/`, update exports | 15 min |
| **6** | Remove `@relayscope/ui` dep, remove `@source` directive if no longer needed | 15 min |
| **7** | `bun run type-check` — fix any type errors | 30 min |
| **8** | `bun run build` — fix any build errors | 30 min |
| **9** | `bun run lint` — fix any lint issues | 15 min |
| **10** | Visual QA across all sections | 30 min |
| **11** | Commit, PR | 15 min |
| **Total** | | **~4–6 hours** |

---

## 12. Rollback Plan

If migration causes widespread breakage:

1. `git checkout main`
2. Delete `bun.lock` and `node_modules/`
3. `bun install`
4. `bun run build` — verify baseline restored

---

## 13. References

- [shadcn-svelte Docs](https://shadcn-svelte.com)
- [Svelte 5 Migration Guide](https://shadcn-svelte.com/docs/migration/svelte-5)
- [Tailwind v4 Migration Guide](https://shadcn-svelte.com/docs/migration/tailwind-v4)
- [shadcn-svelte CLI Reference](https://shadcn-svelte.com/docs/cli)
- [bits-ui](https://www.bits-ui.com)
- [tailwind-variants](https://www.tailwind-variants.com)
- [tw-animate-css](https://github.com/huntabyte/tw-animate-css)
- [Relay Dog Style Guide](../development/style-guide.md)
