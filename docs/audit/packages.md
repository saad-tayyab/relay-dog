# 🔒 Package Audit

Version tracking for declared dependencies. Updated each time package manifests are modified.

## Last Audit: 2026-07-04

### Runtime & Tooling

| Package | Declared Version | Source | Notes |
|---------|------------------|--------|-------|
| bun | 1.3.14 | `packageManager` | Runtime + package manager |
| turbo | ^2.10.3 | root `devDependencies` | Monorepo task runner |
| typescript | ^6.0.3 | root/package `devDependencies` | Strict TypeScript |

### Frontend (apps/web)

| Package | Declared Version | Source | Notes |
|---------|------------------|--------|-------|
| svelte | ^5.56.4 | `apps/web/package.json` | Svelte 5 runes UI |
| @sveltejs/vite-plugin-svelte | ^7.1.2 | `apps/web/package.json` | Vite integration |
| svelte-check | ^4.7.1 | `apps/web/package.json` | Svelte type checking |
| vite | ^8.1.3 | `apps/web/package.json` | Dev server/build |
| tailwindcss | ^4.3.2 | `apps/web/package.json` | Styling |
| @tailwindcss/vite | ^4.3.2 | `apps/web/package.json` | Tailwind Vite plugin |
| nostr-tools | ^2.23.9 | `apps/web/package.json` | Nostr event/key helpers |
| @scure/base | ^2.2.0 | `apps/web/package.json` | Encoding helpers |
| qrcode | ^1.5.4 | `apps/web/package.json` | QR code generation |
| @types/qrcode | ^1.5.6 | `apps/web/package.json` | QR code types |

### Backend (apps/api)

| Package | Declared Version | Source | Notes |
|---------|------------------|--------|-------|
| hono | ^4.12.27 | `apps/api/package.json` | HTTP framework |
| @hono/zod-validator | ^0.8.0 | `apps/api/package.json` | Request validation |
| hono-rate-limiter | ^0.5.3 | `apps/api/package.json` | Per-IP rate limits |
| zod | ^4.4.3 | `apps/api/package.json` | Runtime schemas |
| drizzle-orm | 1.0.0-rc.4 | `apps/api/package.json` | ORM, currently RC |
| drizzle-kit | 1.0.0-rc.4 | `apps/api/package.json` | Migration tooling, currently RC |
| postgres | ^3.4.9 | `apps/api/package.json` | PostgreSQL client |
| @types/bun | ^1.3.14 | `apps/api/package.json` | Bun runtime types |

### Code Quality

| Package | Declared Version | Source | Notes |
|---------|------------------|--------|-------|
| @biomejs/biome | ^2.5.2 | root `devDependencies` | Formatter and linter |

### Internal Packages

| Package | Version | Source | Notes |
|---------|---------|--------|-------|
| @relayscope/web | 0.8.0 | `apps/web/package.json` | Web app package |
| @relayscope/api | 0.8.0 | `apps/api/package.json` | API package |
| @relayscope/shared | 0.8.0 | `packages/shared/package.json` | Shared types and schemas |
| @relayscope/env | 0.0.0 | `packages/config/env/package.json` | Environment validation |
| @relayscope/tsconfig | 0.0.0 | `packages/config/tsconfig/package.json` | Shared TypeScript configs |

### Infrastructure

| Service | Version | Latest | Status | Updated |
|---------|---------|--------|--------|---------|
| PostgreSQL | 18+ | 18.4 | ✅ Current | 2026-06-30 |

---

## Audit History

| Date | Action | Packages Changed |
|------|--------|-----------------|
| 2026-07-04 | Synced audit with manifests | turbo 2.10.3, biome 2.5.2, vite 8.1.3, svelte-check 4.7.1, nostr-tools 2.23.9; removed stale dotenv/@types/node entries |
| 2026-06-30 | Initial setup | All packages at initial versions |
| 2026-06-30 | Updated all to latest | typescript 5.9→6.0, vite 6.4→8.1, react 19.1→19.2, hono 4.7→4.12, tailwind 4.1→4.3, drizzle 0.44→0.45, node-cron 3.0→4.5, @hono/node-server 1.19→removed |
| 2026-06-30 | Added Biome | @biomejs/biome 2.5.1 (replaced oxlint) |
| 2026-06-30 | Removed Node adapter | @hono/node-server removed, use native Bun.serve() |
| 2026-06-30 | React → Svelte 5 migration | Removed: react, react-dom, @types/react, @types/react-dom, @vitejs/plugin-react. Added: svelte 5.35, @sveltejs/vite-plugin-svelte 5.0, svelte-check 4.1 |
| 2026-06-30 | Added nostr-tools | nostr-tools 2.23.8 (Phase 3: Event Verifier) |
| 2026-06-30 | Drizzle ORM v1 RC | drizzle-orm 0.45.2→1.0.0-rc.4, drizzle-kit 0.31.10→1.0.0-rc.4, added defineRelations(), drizzle() object syntax |
| 2026-06-30 | Vite 8 plugin compat | svelte 5.35→5.56, @sveltejs/vite-plugin-svelte 5.0→7.1.2 (Vite 8 support) |
| 2026-06-30 | Phase 6 security hardening | Added zod 4.4.3, @hono/zod-validator 0.8.0, hono-rate-limiter 0.5.3. Removed node-cron, @types/node-cron. Moved dotenv to apps/api devDependencies |
| 2026-06-30 | Turbo/repo hygiene | turbo 2.10.1→2.10.2, packageManager bun 1.2.17→1.3.14, lint wired through turbo, dotenv moved to apps/api |

---

## How to Update

```bash
# Check for outdated packages
bun outdated

# Update within semver range
bun update

# Update to latest (may include breaking changes)
bun add package@latest

# After updating, verify
bun run lint
bun run type-check
bun run build
```

## Audit Checklist

When updating packages, verify:

- [ ] `bun install` succeeds
- [ ] `bun run lint` passes
- [ ] `bun run type-check` passes
- [ ] `bun run build` succeeds
- [ ] Dev servers start (`bun run dev`)
- [ ] No runtime errors in browser
- [ ] Update this audit doc with new versions
- [ ] Commit with `chore(deps):` prefix
