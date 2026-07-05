<p align="center">
  <img src="https://img.shields.io/badge/version-0.10.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/phase-10%2F12%20complete-brightgreen?style=for-the-badge" alt="Phase">
  <img src="https://img.shields.io/badge/WCAG-2.2%20AA-brightgreen?style=for-the-badge" alt="WCAG">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/typescript-6.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/svelte-5-orange?style=for-the-badge&logo=svelte&logoColor=white" alt="Svelte">
  <img src="https://img.shields.io/badge/bun-1.3-fbf0df?style=for-the-badge&logo=bun&logoColor=black" alt="Bun">
</p>

<h1 align="center">🐕 Relay Dog</h1>

<p align="center">
  <strong>Nostr relay inspector & developer toolkit</strong><br>
  <em>"Postman meets Wireshark, for Nostr relays."</em>
</p>

<p align="center">
  <a href="https://relay-dog-web.vercel.app/"><img src="https://img.shields.io/badge/Live_Demo-relay--dog--web.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
</p>

<p align="center">
  <a href="#-features">Features</a> · <a href="#-architecture">Architecture</a> · <a href="#-getting-started">Quick Start</a> · <a href="#-api-endpoints">API</a> · <a href="#-documentation">Docs</a>
</p>

---

Paste a relay URL and get a complete picture: what it supports, how it behaves, what's flowing through it in real time, and how healthy it is. Then use the built-in toolkit to compose events, convert keys, verify identities, and more — all from one place.

## ✨ Features

<table>
  <tr>
    <td width="50%" valign="top">

### ⚡ Inspector
- **NIP-11 Info** — Fetch and render relay info with NIP badge grid
- **Connection Checks** — HTTP, CORS, WebSocket reachability
- **Latency Metrics** — WebSocket RTT, HTTP latency, EOSE timing
- **Write Test** — Verify relay accepts signed events
- **Fee Display** — Admission, subscription, per-event breakdown
- **Limitations Panel** — Auth requirements, max sizes

    </td>
    <td width="50%" valign="top">

### 🔐 Live Stream
- **WebSocket Connection** — Auto-reconnect with backoff
- **REQ Builder** — Filter by kinds, authors, time range
- **Event Feed** — Live stream with auto-scroll + EOSE
- **NIP-42 Auth** — Challenge-response authentication
- **Event Deduplication** — Kind-based color coding

    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

### 🔍 Event Verifier
- **Signature Verification** — Client-side Schnorr validation
- **Event ID Check** — SHA-256 canonical serialization
- **Tag Decoder** — Parse and display event tags
- **Edit & Re-publish** — Jump to publisher with data

    </td>
    <td width="50%" valign="top">

### ✍️ Event Publisher
- **Event Composer** — Kind selector, content editor, tags
- **NIP-07 Signing** — Sign via browser extension
- **Relay Publishing** — Publish to any relay
- **Event Deleter** — NIP-09 mass deletion

    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

### 🧰 Developer Toolkit

| Tool | Description |
|------|-------------|
| 🔑 Key Converter | npub ↔ nsec ↔ hex (NIP-19) |
| 📧 NIP-05 Checker | DNS identity verification |
| 📱 QR Code Generator | QR for keys, URLs, events |
| 💾 Backup & Restore | Export/import events as JSON |

    </td>
    <td width="50%" valign="top">

### 📂 Relay Directory
- **NIP-66 Discovery** — Find relays via monitors
- **Relay Comparison** — Side-by-side analysis
- **Uptime Sparklines** — Visual uptime history
- **Advanced Filtering** — NIPs, auth, country

    </td>
  </tr>
</table>

### ♿ Accessibility (WCAG 2.2 AA)

> All interfaces meet **WCAG 2.2 Level AA** compliance — 123 issues fixed across 43 components.

| Feature | Standard |
|---------|----------|
| WAI-ARIA Tabs | Arrow key navigation, `role="tablist"/"tab"/"tabpanel"` |
| Touch Targets | All interactive elements ≥44×44px (SC 2.5.8) |
| Focus Indicators | Visible `:focus-visible` ring (SC 2.4.7) |
| Reduced Motion | Respects `prefers-reduced-motion` (SC 2.3.3) |
| Screen Reader | `role="alert"`, `aria-live`, `aria-label` everywhere |
| Skip Navigation | Skip-to-content link for keyboard users |

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Browser
        WEB["🌐 Web App<br/>Svelte 5 + Vite + Tailwind"]
    end

    subgraph Server
        API["⚡ API Server<br/>Hono + Bun"]
        NIP66["🔄 NIP-66 Ingestor<br/>Passive Monitor"]
    end

    subgraph Data
        DB[("🐘 PostgreSQL<br/>Drizzle ORM")]
    end

    subgraph External
        RELAY["🔗 Nostr Relays<br/>WSS + NIP-11"]
    end

    WEB -->|"REST API<br/>:3001"| API
    API -->|"SQL"| DB
    NIP66 -->|"Store"| DB
    NIP66 -.->|"Subscribe"| RELAY
    WEB -.->|"WebSocket"| RELAY
```

> **Frontend-only mode**: The web app connects directly to Nostr relays from the browser — no backend required. Set `VITE_API_URL` to enable directory features (browse, register, compare, NIP-66 data). See [Deployment](#-deployment).

### Package Structure

```mermaid
graph LR
    ENV["@relayscope/env"]
    SHARED["@relayscope/shared"]
    DB["@relayscope/database"]
    AUTH["@relayscope/auth"]
    UI["@relayscope/ui"]
    WEB["@relayscope/web"]
    API["@relayscope/api"]

    WEB --> SHARED
    WEB --> UI
    API --> SHARED
    API --> DB
    API --> AUTH
    DB --> SHARED
    AUTH --> ENV
    API --> ENV
    WEB --> ENV
```

<details>
<summary><strong>📁 Full Directory Tree</strong></summary>

```
relayscope/
├── apps/
│   ├── web/                    # Svelte 5 + Vite + Tailwind v4
│   │   └── src/
│   │       ├── components/     # UI components by feature domain
│   │       │   ├── nav/        # NavBar, MobileNav
│   │       │   ├── inspector/  # InspectorSection
│   │       │   ├── publisher/  # EventComposer, EventDeleter, TagEditor
│   │       │   ├── tools/      # KeyConverter, Nip05Checker, QRCode, Backup
│   │       │   ├── shared/     # AccessibleTabs, Toast (WCAG 2.2 AA)
│   │       │   └── verifier/   # EventVerifier, VerificationPanel
│   │       ├── lib/composables/ # Svelte 5 runes composables
│   │       └── utils/          # router, keys, nip05, backup, nostrVerify
│   └── api/                    # Hono + Bun REST API
│       └── src/
│           ├── routes/         # API route modules
│           ├── jobs/           # Background ingestors
│           └── lib/            # SSRF, validation, errors
├── packages/
│   ├── database/               # Drizzle schema, queries, relations, migrations
│   ├── shared/                 # TypeScript types & Zod schemas
│   ├── auth/                   # API key middleware
│   ├── ui/                     # Shared Svelte components
│   └── config/
│       ├── env/                # Environment validation
│       └── tsconfig/           # Shared TypeScript configs
├── docs/                       # Architecture & feature specs
├── turbo.json
└── package.json
```

</details>

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Bun-1.3-fbf0df?style=for-the-badge&logo=bun&logoColor=black" alt="Bun">
  <img src="https://img.shields.io/badge/Turborepo-2.10-cyan?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo">
  <img src="https://img.shields.io/badge/Svelte-5-orange?style=for-the-badge&logo=svelte&logoColor=white" alt="Svelte">
  <img src="https://img.shields.io/badge/Vite-8-purple?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-blue?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Hono-4-black?style=for-the-badge" alt="Hono">
  <img src="https://img.shields.io/badge/PostgreSQL-18-blue?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Drizzle_ORM-v1_RC-blue?style=for-the-badge" alt="Drizzle">
  <img src="https://img.shields.io/badge/Biome-2.5-yellow?style=for-the-badge" alt="Biome">
  <img src="https://img.shields.io/badge/TypeScript-6.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

---

## 🚀 Getting Started

> [!TIP]
> **Prerequisites**: [Bun](https://bun.sh) v1.3+ and [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)

```bash
# 1. Clone and install
git clone https://github.com/SaadTayyab/relayscope.git
cd relayscope
bun install

# 2. Start PostgreSQL
docker compose up -d

# 3. Configure environment
cp .env.example .env

# 4. Generate & run migrations
bun run db:generate
bun run db:migrate

# 5. Start dev servers
bun run dev
```

| Service | URL |
|---------|-----|
| 🌐 Web App | http://localhost:5173 |
| ⚡ API Server | http://localhost:3001 |

---

## ☁️ Deployment

The web app works in two modes — **frontend-only** (no backend) or **full stack** (with API + database).

### Frontend-only (Vercel)

Deploy just the SPA to Vercel. All relay inspection, WebSocket streaming, event publishing, key conversion, and verification features work out of the box — they connect directly to Nostr relays from the browser.

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `VITE_API_URL` | No | Set to your API URL to enable directory features. Leave empty for frontend-only. |

Features **available without a backend**: relay inspection (NIP-11), connection checks, latency measurement, write tests, WebSocket streaming, event publishing, event verification, NIP-05 checks, key conversion, QR codes, backup/restore.

Features **requiring `VITE_API_URL`**: relay directory browse/search, relay registration, relay comparison, NIP-66 discovery data, popularity metrics.

> All backend API calls go through `apiFetch()` — a middleware wrapper that returns a graceful 503 when no backend is configured. No code changes needed to toggle modes.

### Full stack (self-hosted)

Run the API server + PostgreSQL alongside the web app:

```bash
# Set these in .env
DATABASE_URL=postgresql://user:pass@localhost:5432/relayscope
API_KEY=your-secret-key
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

The API server (Hono + Bun) runs separately from the frontend. Add the API's `CORS_ORIGINS` to include your Vercel deployment URL.

---

## 📦 Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all dev servers |
| `bun run build` | Build all packages |
| `bun run type-check` | Type-check all packages |
| `bun run lint` | Lint all packages |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run test` | Run all tests |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run pending migrations |
| `bun run db:push` | Push schema directly (dev) |
| `bun run db:studio` | Open Drizzle Studio |

---

## 🔌 API Endpoints

<details>
<summary><strong>Click to expand full API reference</strong></summary>

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | — | Server health check |
| `GET` | `/api/relays` | — | List relays (search, filter, paginate) |
| `GET` | `/api/relays/lookup` | — | Lookup relay by URL |
| `GET` | `/api/relays/:id` | — | Get relay with latest info |
| `POST` | `/api/relays` | ✅ | Add relay (auto-fetches NIP-11) |
| `PUT` | `/api/relays/:id` | ✅ | Update relay |
| `DELETE` | `/api/relays/:id` | ✅ | Remove relay |
| `GET` | `/api/relays/:id/nip11` | — | NIP-11 snapshot history |
| `GET` | `/api/relays/:id/discoveries` | — | NIP-66 monitor observations |
| `POST` | `/api/relays/:id/discoveries` | ✅ | Upsert discovery |
| `GET` | `/api/relays/:id/popularity` | — | NIP-65 read/write counts |
| `POST` | `/api/relays/:id/popularity` | ✅ | Upsert relay list entry |
| `GET` | `/api/directory` | — | Browse directory with filters |
| `GET` | `/api/directory/countries` | — | List available countries |
| `GET` | `/api/directory/compare/:id1/:id2` | — | Compare two relays |

**Auth**: `Authorization: Bearer <API_KEY>` header required on mutating endpoints.

</details>

---

## 📋 Development Phases

<table>
  <tr>
    <td align="center" width="8%">✅</td>
    <td><strong>Phase 1</strong> — NIP-11 Viewer (MVP)</td>
    <td align="center" width="8%">✅</td>
    <td><strong>Phase 7</strong> — NIP Compliance</td>
  </tr>
  <tr>
    <td align="center">✅</td>
    <td><strong>Phase 2</strong> — Live Event Stream</td>
    <td align="center">✅</td>
    <td><strong>Phase 8</strong> — Developer Toolkit</td>
  </tr>
  <tr>
    <td align="center">✅</td>
    <td><strong>Phase 3</strong> — Event Verifier</td>
    <td align="center">✅</td>
    <td><strong>Phase 9</strong> — WCAG 2.2 AA Accessibility</td>
  </tr>
  <tr>
    <td align="center">✅</td>
    <td><strong>Phase 4</strong> — Auth & Health</td>
    <td align="center">✅</td>
    <td><strong>Phase 10</strong> — Infrastructure Hardening</td>
  </tr>
  <tr>
    <td align="center">✅</td>
    <td><strong>Phase 5</strong> — Relay Directory</td>
    <td align="center">📋</td>
    <td><strong>Phase 11</strong> — Production Deployment</td>
  </tr>
  <tr>
    <td align="center">✅</td>
    <td><strong>Phase 6</strong> — Security Hardening</td>
    <td align="center">📋</td>
    <td><strong>Phase 12</strong> — NIP-66 Passive Monitoring</td>
  </tr>
</table>

---

## 🔒 Security

| Layer | Protection |
|-------|-----------|
| 🔑 Authentication | API key auth on all mutating endpoints |
| 🛡️ SSRF | Internal/private/cloud metadata URLs blocked |
| ⏱️ Rate Limiting | 20 writes/min, 200 reads/min per IP |
| ✅ Validation | Zod schemas on all inputs |
| 🔒 Headers | CSP, Referrer-Policy, HSTS, Permissions-Policy |
| 🐳 Docker | PostgreSQL binds to `127.0.0.1` only |

---

## 📄 Documentation

| Doc | Description |
|-----|-------------|
| [Architecture Overview](docs/architecture/overview.md) | System design with Mermaid diagrams |
| [Database Schema](docs/architecture/database.md) | Schema reference with ER diagrams |
| [API Endpoints](docs/api/endpoints.md) | Full endpoint reference with examples |
| [Style Guide](docs/development/style-guide.md) | Code style conventions |
| [NIP Reference](docs/features/nip-reference.md) | Nostr Implementation Possibilities |
| [Feature Specs](docs/features/) | Detailed specs for each phase |
| [Changelog](docs/changelog.md) | Release history |

---

## 🙏 Credits

<table>
  <tr>
    <td align="center" width="50%">
      <a href="https://goose-docs.ai/">
        <img src="https://aaif.io/wp-content/uploads/2026/04/goose_icon.svg" alt="Goose" width="64" height="64">
      </a>
      <br>
      <a href="https://goose-docs.ai/"><b>Goose</b></a> · <a href="https://github.com/aaif-goose/goose">GitHub</a>
      <br>
      <sub>Primary AI agent</sub>
    </td>
    <td align="center" width="50%">
      <a href="https://mimo.xiaomi.com/mimo-v2-5">
        <img src="https://mimo.xiaomi.com/mimo-v2-5/assets/logo.svg" alt="MiMo" width="64" height="64">
      </a>
      <br>
      <a href="https://mimo.xiaomi.com/mimo-v2-5"><b>MiMo v2.5</b></a> · <a href="https://huggingface.co/XiaomiMiMo/MiMo-V2.5">Model</a>
      <br>
      <sub>Coding intelligence</sub>
    </td>
  </tr>
</table>

> *Cursor was also present, contributing approximately 0.1%.*

---

## 📜 License

MIT

<p align="center">
  Made with ❤️ by <a href="https://github.com/SaadTayyab">Saad Tayyab</a>
</p>
