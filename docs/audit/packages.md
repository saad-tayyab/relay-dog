# 🔒 Package Audit

Version tracking for all dependencies. Updated each time packages are modified.

## Last Audit: 2026-06-30

### Runtime & Tooling

| Package | Version | Latest | Status | Updated |
|---------|---------|--------|--------|---------|
| bun | 1.3.14 | 1.3.14 | ✅ Current | 2026-06-30 |
| turbo | 2.10.1 | 2.10.1 | ✅ Current | 2026-06-30 |
| typescript | 6.0.3 | 6.0.3 | ✅ Current | 2026-06-30 |

### Frontend (apps/web)

| Package | Version | Latest | Status | Updated |
|---------|---------|--------|--------|---------|
| svelte | 5.56.4 | 5.56.4 | ✅ Current | 2026-06-30 |
| @sveltejs/vite-plugin-svelte | 7.1.2 | 7.1.2 | ✅ Current | 2026-06-30 |
| svelte-check | 4.1.0 | 4.1.0 | ✅ Current | 2026-06-30 |
| vite | 8.1.0 | 8.1.0 | ✅ Current | 2026-06-30 |
| tailwindcss | 4.3.2 | 4.3.2 | ✅ Current | 2026-06-30 |
| @tailwindcss/vite | 4.3.2 | 4.3.2 | ✅ Current | 2026-06-30 |
| nostr-tools | 2.23.8 | 2.23.8 | ✅ Current | 2026-06-30 |

### Backend (apps/api)

| Package | Version | Latest | Status | Updated |
|---------|---------|--------|--------|---------|
| hono | 4.12.27 | 4.12.27 | ✅ Current | 2026-06-30 |
| drizzle-orm | 1.0.0-rc.4 | 1.0.0-rc.4 | ⚠️ RC | 2026-06-30 |
| drizzle-kit | 1.0.0-rc.4 | 1.0.0-rc.4 | ⚠️ RC | 2026-06-30 |
| postgres | 3.4.9 | 3.4.9 | ✅ Current | 2026-06-30 |
| node-cron | 4.5.0 | 4.5.0 | ✅ Current | 2026-06-30 |
| @types/bun | 1.3.14 | 1.3.14 | ✅ Current | 2026-06-30 |
| @types/node | 26.0.1 | 26.0.1 | ✅ Current | 2026-06-30 |
| @types/node-cron | 3.0.11 | 3.0.11 | ✅ Current | 2026-06-30 |

### Code Quality

| Package | Version | Latest | Status | Updated |
|---------|---------|--------|--------|---------|
| @biomejs/biome | 2.5.1 | 2.5.1 | ✅ Current | 2026-06-30 |

### Infrastructure

| Service | Version | Latest | Status | Updated |
|---------|---------|--------|--------|---------|
| PostgreSQL | 18+ | 18.4 | ✅ Current | 2026-06-30 |

---

## Audit History

| Date | Action | Packages Changed |
|------|--------|-----------------|
| 2026-06-30 | Initial setup | All packages at initial versions |
| 2026-06-30 | Updated all to latest | typescript 5.9→6.0, vite 6.4→8.1, react 19.1→19.2, hono 4.7→4.12, tailwind 4.1→4.3, drizzle 0.44→0.45, node-cron 3.0→4.5, @hono/node-server 1.19→removed |
| 2026-06-30 | Added Biome | @biomejs/biome 2.5.1 (replaced oxlint) |
| 2026-06-30 | Removed Node adapter | @hono/node-server removed, use native Bun.serve() |
| 2026-06-30 | React → Svelte 5 migration | Removed: react, react-dom, @types/react, @types/react-dom, @vitejs/plugin-react. Added: svelte 5.35, @sveltejs/vite-plugin-svelte 5.0, svelte-check 4.1 |
| 2026-06-30 | Added nostr-tools | nostr-tools 2.23.8 (Phase 3: Event Verifier) |
| 2026-06-30 | Drizzle ORM v1 RC | drizzle-orm 0.45.2→1.0.0-rc.4, drizzle-kit 0.31.10→1.0.0-rc.4, added defineRelations(), drizzle() object syntax |
| 2026-06-30 | Vite 8 plugin compat | svelte 5.35→5.56, @sveltejs/vite-plugin-svelte 5.0→7.1.2 (Vite 8 support) |

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
bunx biome check .
bunx turbo build --force
bunx turbo type-check --force
```

## Audit Checklist

When updating packages, verify:

- [ ] `bun install` succeeds
- [ ] `bunx biome check .` passes
- [ ] `bunx turbo build --force` succeeds
- [ ] `bunx turbo type-check --force` passes
- [ ] Dev servers start (`turbo dev`)
- [ ] No runtime errors in browser
- [ ] Update this audit doc with new versions
- [ ] Commit with `chore(deps):` prefix
