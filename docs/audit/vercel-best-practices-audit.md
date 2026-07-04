---
title: "🔍 Vercel + Turbo Repo Best Practices Audit"
version: "1.0.0"
status: "current"
last_updated: "2026-07-05"
author: "Saad Tayyab"
---

# 🔍 Vercel + Turborepo Best Practices Audit

> **v1.0.0** · **Current** · Updated 2026-07-05 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---

## Current Stack Snapshot

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Runtime | Bun | 1.3.14 | ✅ Latest stable |
| Monorepo | Turborepo | 2.10.3 | ✅ Latest |
| Frontend | Svelte 5 (SPA) | 5.56.4 | ✅ Latest |
| Bundler | Vite | 8.1.3 | ✅ Latest |
| CSS | Tailwind CSS v4 | 4.3.2 | ✅ Latest |
| API | Hono | 4.12.27 | ✅ Latest |
| ORM | Drizzle ORM | 1.0.0-rc.4 | ⚠️ RC — check stable |
| Linting | Biome | 2.5.2 | ✅ Latest |
| TypeScript | TypeScript | 6.0.3 | ✅ Latest |
| Database | PostgreSQL | 18-alpine | ✅ Latest |
| CI | GitHub Actions | Pin-by-SHA | ✅ Secure |
| Deployment | Vercel (web) + VPS (API) | — | ⚠️ Needs improvement |

---

## Audit Results

### 🔴 Critical (Must Fix)

#### 1. Missing SPA Routing Fallback in `vercel.json`

**Impact:** Page refreshes on client-side routes (e.g., `/relay/xyz`) return 404.

**Current:**
```json
{
  "framework": "vite",
  "installCommand": "bun install",
  "buildCommand": "turbo build --filter=@relayscope/web",
  "outputDirectory": "apps/web/dist"
}
```

**Fix:** Add rewrites for SPA fallback:
```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

#### 2. Missing Security Headers in `vercel.json`

**Impact:** API-originating traffic lacks security headers at the CDN edge level.

**Current:** Security headers only set in Hono middleware (API responses).

**Fix:** Add Vercel-level security headers:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "X-DNS-Prefetch-Control", "value": "on" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

#### 3. Missing `.vercelignore`

**Impact:** Vercel builds include unnecessary files (docs, API code, tests), increasing build time and potentially leaking secrets.

**Fix:** Create `.vercelignore`:
```
docs/
apps/api/
packages/
infra/
drizzle/
.github/
*.md
docker-compose.yml
biome.json
CONTRIBUTING.md
```

#### 4. No Install Lockfile Enforcement

**Impact:** Non-deterministic builds. Different versions could be installed on Vercel.

**Fix:** Update `vercel.json`:
```json
{
  "installCommand": "bun install --frozen-lockfile"
}
```

---

### 🟡 Important (Should Fix)

#### 5. No Vercel Remote Caching for Turborepo

**Impact:** CI/CD and local builds are slow — no shared cache between environments.

**Current:** No `remote` configuration in `turbo.json`.

**Fix:** Add to `turbo.json` (after running `turbo login` and `turbo link`):
```json
{
  "remote": {
    "apiUrl": "https://vercel.com/api/repos"
  }
}
```

Or configure via Vercel dashboard → Project Settings → Turborepo.

**Steps:**
```bash
npx turbo login        # Authenticate with Vercel
npx turbo link         # Link to your Vercel team/project
```

#### 6. Missing `.node-version` / `.tool-versions`

**Impact:** Vercel and CI may use different Bun/Node versions than local development.

**Fix:** Create `.node-version`:
```
1.3.14
```

**Also:** Vercel supports Bun natively. Add to `vercel.json`:
```json
{
  "installCommand": "bun install --frozen-lockfile",
  "buildCommand": "turbo build --filter=@relayscope/web"
}
```

#### 7. No `builds` Configuration for Monorepo Deployment

**Impact:** Vercel may not correctly detect which package to build.

**Fix (if auto-detection fails):** Explicit builds in `vercel.json`:
```json
{
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/static-build",
      "config": {
        "outputDirectory": "apps/web/dist",
        "buildCommand": "cd ../.. && turbo build --filter=@relayscope/web"
      }
    }
  ]
}
```

> **Note:** Vercel's auto-detection usually works for Turborepo monorepos. Only add explicit builds if auto-detection fails.

#### 8. Missing Code Splitting in Vite Config

**Impact:** Large bundle sizes. All JS loads upfront instead of on-demand.

**Fix:** Add to `vite.config.ts`:
```ts
build: {
  target: 'es2022',
  rollupOptions: {
    output: {
      manualChunks: {
        'svelte-vendor': ['svelte'],
        'nostr-tools': ['nostr-tools'],
      },
    },
  },
},
```

#### 9. No `preview` Configuration in Vite

**Impact:** `vite preview` doesn't match Vercel's static file serving.

**Fix:** Add to `vite.config.ts`:
```ts
preview: {
  port: 4173,
  host: true,
},
```

#### 10. Hono Could Use Built-in Middleware

**Impact:** Manual security headers are error-prone and duplicated.

**Fix:** Replace manual header middleware in `app.ts`:
```ts
import { secureHeaders } from 'hono/secure-headers';

// Replace manual header middleware with:
app.use('*', secureHeaders({
  contentSecurityPolicy: false, // Handle separately
  xFrameOptions: false,
}));

// Then add CSP separately
app.use('*', async (c, next) => {
  await next();
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
});
```

---

### 🟢 Nice to Have (Consider)

#### 11. Vercel Analytics & Speed Insights

**Impact:** Production performance monitoring.

**Fix:** Add to `apps/web/package.json`:
```json
{
  "dependencies": {
    "@vercel/analytics": "^1.5.0",
    "@vercel/speed-insights": "^1.2.0"
  }
}
```

Add to `main.ts`:
```ts
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

if (import.meta.env.PROD) {
  inject();
  injectSpeedInsights();
}
```

#### 12. Consider Edge Runtime for API

**Impact:** Lower latency for API responses on Vercel.

**Current:** API runs on VPS with Bun.serve.

**If deploying API to Vercel:**
```json
{
  "builds": [
    {
      "src": "apps/api/src/index.ts",
      "use": "@vercel/node",
      "config": {
        "runtime": "edge"
      }
    }
  ]
}
```

> **Note:** Edge runtime has limitations. Not all Hono middleware works on Edge. Test thoroughly.

#### 13. Automated Dependency Updates

**Impact:** Security vulnerabilities accumulate over time.

**Fix:** Add `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      all:
        patterns: ["*"]
    open-pull-requests-limit: 10

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

#### 14. Vercel ISR for Dynamic Pages

**Impact:** If you add SSR pages later, ISR provides excellent performance.

**Current:** Pure SPA — not applicable now.

**Future consideration:** If migrating to SvelteKit:
```ts
// src/routes/relay/[url]/+page.server.ts
export const config = {
  isr: {
    expirationSeconds: 300, // Revalidate every 5 minutes
  },
};
```

#### 15. Turborepo Task Configuration Improvements

**Current turbo.json is good.** Consider adding:
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**", "package.json", "tsconfig.json"],
      "env": ["VITE_API_URL"],
      "outputMode": "new-only"
    },
    "type-check": {
      "dependsOn": ["^type-check"],
      "inputs": ["src/**", "tsconfig.json"],
      "outputMode": "errors-only"
    }
  }
}
```

#### 16. Consider `@vercel/toolbar` for Development

**Impact:** Better local development experience with Vercel features.

```bash
bun add -D @vercel/toolbar
```

---

## Recommended `vercel.json` (Complete)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "installCommand": "bun install --frozen-lockfile",
  "buildCommand": "turbo build --filter=@relayscope/web",
  "outputDirectory": "apps/web/dist",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

---

## Recommended `turbo.json` Updates

```json
{
  "$schema": "https://turbo.build/schema.json",
  "futureFlags": {
    "globalConfiguration": true,
    "errorsOnlyShowHash": true
  },
  "global": {
    "inputs": ["tsconfig.json", ".env"],
    "env": ["NODE_ENV"],
    "passThroughEnv": ["DATABASE_URL", "API_KEY", "CI", "GITHUB_TOKEN"],
    "envMode": "strict"
  },
  "remote": {
    "apiUrl": "https://vercel.com/api/repos"
  },
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**", "package.json", "tsconfig.json"],
      "env": ["VITE_API_URL"],
      "outputMode": "new-only"
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": [],
      "inputs": ["src/**", "biome.json"]
    },
    "type-check": {
      "dependsOn": ["^type-check"],
      "inputs": ["src/**", "tsconfig.json"],
      "outputMode": "errors-only"
    },
    "test": {
      "dependsOn": ["^build"],
      "env": ["NODE_ENV", "DATABASE_URL", "API_KEY"],
      "outputMode": "errors-only"
    },
    "preview": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

---

## Recommended Vite Config Updates

```ts
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'svelte-vendor': ['svelte'],
          'nostr-tools': ['nostr-tools'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

---

## Implementation Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 🔴 P0 | SPA routing rewrites | 5 min | Critical — broken routes |
| 🔴 P0 | Security headers in vercel.json | 10 min | Security compliance |
| 🔴 P0 | `.vercelignore` | 2 min | Build size/security |
| 🔴 P0 | `--frozen-lockfile` in install | 2 min | Build reliability |
| 🟡 P1 | Turborepo remote caching | 15 min | Build speed 2-10x |
| 🟡 P1 | `.node-version` file | 2 min | Version consistency |
| 🟡 P1 | Code splitting in Vite | 15 min | Bundle size |
| 🟡 P1 | Hono secureHeaders middleware | 10 min | Maintainability |
| 🟢 P2 | Vercel Analytics | 15 min | Observability |
| 🟢 P2 | Dependabot config | 5 min | Security automation |
| 🟢 P2 | `preview` config in Vite | 2 min | Dev experience |
| 🟢 P2 | `outputMode` in turbo tasks | 5 min | Build output clarity |

---

## What's Already Excellent ✅

1. **Bun 1.3.14** — Latest stable, native package manager
2. **Turborepo 2.10.3** — Latest with `futureFlags` enabled
3. **`envMode: "strict"`** — Prevents accidental env leakage
4. **Biome 2.5.2** — Latest with comprehensive rules, a11y, CSS support
5. **TypeScript 6.0.3** — Latest with strict mode
6. **Pin-by-SHA in GitHub Actions** — Supply chain security
7. **Zod validation at boundaries** — Runtime type safety
8. **Drizzle ORM with bun-sql** — Native Bun performance
9. **PostgreSQL 18** — Latest version
10. **Granular package exports** — Clean dependency boundaries
11. **`noUncheckedIndexedAccess: true`** — Defensive TypeScript
12. **Security headers in API** — X-Frame-Options, CSP, etc.
13. **Rate limiting** — Write (20/min) and read (200/min) limits
14. **Graceful shutdown** — SIGTERM/SIGINT handling
15. **Body size limits** — 100KB max on API routes

---

## Migration Checklist

```bash
# 1. Update vercel.json with security headers + SPA rewrites
# 2. Create .vercelignore
# 3. Create .node-version
# 4. Update installCommand to use --frozen-lockfile
# 5. Set up Turborepo remote caching
npx turbo login
npx turbo link
# 6. Update vite.config.ts with code splitting
# 7. Test locally
bun run build
bun run type-check
bun run lint
# 8. Deploy to Vercel
vercel --prod
# 9. Verify
curl -I https://your-domain.vercel.app/
# Check for security headers
# Check SPA routing works on page refresh
```

---

## References

- [Vercel Turborepo Docs](https://vercel.com/docs/monorepos/turborepo)
- [Turborepo Remote Caching](https://turbo.build/repo/docs/crafting-your-repository/caching)
- [Vercel vercel.json Config](https://vercel.com/docs/projects/project-configuration)
- [Hono secureHeaders](https://hono.dev/docs/middleware/builtin/secure-headers)
- [Vite Build Optimization](https://vite.dev/guide/build.html)
- [Bun on Vercel](https://vercel.com/docs/functions/runtimes/default-runtime)
