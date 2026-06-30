# 🐕 Relay Dog

> **Nostr relay inspector & developer toolkit** — "Postman meets Wireshark, for Nostr relays."

Paste a relay URL and get a complete picture: what it supports, how it behaves, what's flowing through it in real time, and how healthy it is. Then use the built-in toolkit to compose events, convert keys, verify identities, and more — all from one place.

![Version](https://img.shields.io/badge/version-0.9.0-blue)
![Phase](https://img.shields.io/badge/phase-9%20complete-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![WCAG](https://img.shields.io/badge/WCAG-2.2%20AA-brightgreen)

---

## ✨ Features

### ⚡ Inspector

- **NIP-11 Info** — Fetch and render relay info documents with NIP badge grid
- **Connection Checks** — HTTP, CORS, and WebSocket reachability testing
- **Latency Metrics** — WebSocket round-trip, HTTP latency, EOSE timing
- **Write Test** — Verify relay accepts signed events
- **Fee Display** — Admission, subscription, and per-event fee breakdown
- **Limitations Panel** — Auth requirements, max sizes, restrictions

### 🔐 Live Stream

- **WebSocket Connection** — Auto-reconnect with exponential backoff
- **REQ Builder** — Filter by kinds, authors, limit, since/until
- **Event Feed** — Live event stream with auto-scroll and EOSE detection
- **NIP-42 Auth** — Challenge-response authentication support
- **Event Deduplication** — Kind-based color coding and duplicate filtering

### 🔐 Event Verifier

- **Signature Verification** — Client-side Schnorr signature validation
- **Event ID Check** — SHA-256 canonical serialization verification
- **Tag Decoder** — Parse and display event tags with context
- **Edit & Re-publish** — Jump to publisher with pre-filled event data

### ✍️ Event Publisher

- **Event Composer** — Create events with kind selector, content editor, and tag builder
- **Tag Editor** — Preset tags (e, p, t, d, expiration, relay) plus custom tags
- **NIP-07 Signing** — Sign events via browser extension (Alby, nos2x, etc.)
- **Relay Publishing** — Publish signed events to any relay
- **Event Deleter** — Mass-delete events via NIP-09 kind 5 deletion requests

### 🧰 Developer Toolkit

| Tool | Description |
|------|-------------|
| **🔑 Key Converter** | Convert between npub, nsec, and hex formats (NIP-19) |
| **📧 NIP-05 Checker** | Verify NIP-05 identifiers against DNS resolution |
| **📱 QR Code Generator** | Generate QR codes for npub keys, relay URLs, events |
| **💾 Backup & Restore** | Export/import events to/from JSON files |

### ♿ Accessibility (WCAG 2.2 AA)

- **WAI-ARIA Tabs** — All tab interfaces use `role="tablist"/"tab"/"tabpanel"` with arrow key navigation
- **Touch Targets** — All interactive elements ≥44×44px (WCAG 2.2 SC 2.5.8)
- **Focus Indicators** — Visible `:focus-visible` ring for keyboard navigation
- **Reduced Motion** — Respects `prefers-reduced-motion` user preference
- **Screen Reader Support** — `role="alert"`, `aria-live`, `aria-label` on all dynamic content
- **Skip Navigation** — Skip-to-content link for keyboard users
- **Semantic HTML** — `<table>`, `<nav>`, `<section>` with proper ARIA landmarks

### 📂 Relay Directory

- **NIP-66 Discovery** — Find relays via monitor announcements
- **Relay Comparison** — Side-by-side NIP support and health comparison
- **Uptime Sparklines** — Visual uptime history over 7/30 day periods
- **Advanced Filtering** — Search by name, NIPs, auth, payment, country

---

## 🏗️ Architecture

```
relayscope/
├── apps/
│   ├── web/              # Svelte 5 + Vite + Tailwind v4
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── nav/          # NavBar, MobileNav
│   │   │   │   ├── inspector/    # InspectorSection
│   │   │   │   ├── publisher/    # EventComposer, EventDeleter, TagEditor
│   │   │   │   ├── tools/        # KeyConverter, Nip05Checker, QRCode, Backup
│   │   │   │   ├── shared/       # AccessibleTabs, Toast (WCAG 2.2 AA)
│   │   │   │   └── verifier/     # EventVerifier, VerificationPanel
│   │   │   ├── composables/      # Svelte 5 runes composables
│   │   │   │   └── + useDebounce, useCopyToClipboard
│   │   │   ├── stores/           # relaySocket.svelte.ts
│   │   │   └── utils/            # router, keys, nip05, backup, relay, nostrVerify
│   │   └── package.json
│   └── api/              # Hono + Bun REST API
│       └── package.json
├── packages/
│   ├── shared/           # Shared TypeScript types
│   └── config/           # Biome, TypeScript configs
├── docs/                 # Architecture & feature specs
├── turbo.json
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | [Bun](https://bun.sh) 1.3 |
| **Monorepo** | [Turborepo](https://turbo.build) |
| **Web** | [Svelte 5](https://svelte.dev) + [Vite](https://vite.dev) + [Tailwind CSS v4](https://tailwindcss.com) |
| **API** | [Hono](https://hono.dev) (HTTP framework) |
| **Database** | [PostgreSQL](https://www.postgresql.org) + [Drizzle ORM](https://orm.drizzle.team) |
| **Linting** | [Biome](https://biomejs.dev) |
| **Language** | [TypeScript](https://typescriptlang.org) 6.0 (strict mode) |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/relayscope.git
cd relayscope

# Install dependencies
bun install

# Start PostgreSQL via Docker
docker compose up -d

# Set up environment
cp .env.example .env

# Generate & run migrations
bun run db:generate
bun run db:migrate

# Start dev servers (web + API)
bun run dev
```

- **Web**: http://localhost:5173
- **API**: http://localhost:3001

---

## 📦 Commands

```bash
# Development
bun run dev              # Start all dev servers
bun install              # Install all dependencies

# Build & Verify
bun run build            # Build all packages
bun run type-check       # Type-check all packages
bun run lint             # Lint all packages
bun run lint:fix         # Auto-fix lint issues

# Database
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema directly (dev)
bun run db:studio        # Open Drizzle Studio
```

---

## 🔌 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/relays` | — | List relays (search, filter by NIPs, auth, country) |
| `GET` | `/api/relays/:id` | — | Get relay with latest health check |
| `POST` | `/api/relays` | ✅ | Add relay (auto-fetches NIP-11) |
| `PUT` | `/api/relays/:id` | ✅ | Update relay (name/description only) |
| `DELETE` | `/api/relays/:id` | ✅ | Remove relay |
| `POST` | `/api/relays/:id/check` | ✅ | Run health check |
| `GET` | `/api/relays/:id/history` | — | Health check history |
| `GET` | `/api/relays/:id/nip11` | — | NIP-11 snapshot history |
| `GET` | `/api/relays/:id/discoveries` | — | NIP-66 monitor observations |
| `GET` | `/api/relays/:id/popularity` | — | NIP-65 read/write relay counts |
| `GET` | `/api/directory` | — | Browse directory with filters |
| `GET` | `/api/directory/countries` | — | List available countries |
| `GET` | `/api/directory/compare/:id1/:id2` | — | Compare two relays side by side |

**Auth**: `Authorization: Bearer <API_KEY>` header required on mutating endpoints.

---

## 📋 Development Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | NIP-11 Viewer | ✅ Complete |
| 2 | Live Event Stream | ✅ Complete |
| 3 | Event Verifier | ✅ Complete |
| 4 | Auth & Health Dashboard | ✅ Complete |
| 5 | Relay Directory | ✅ Complete |
| 6 | Security Hardening | ✅ Complete |
| 7 | NIP Compliance | ✅ Complete |
| 8 | Developer Toolkit Expansion | ✅ Complete |
| 9 | WCAG 2.2 AA Accessibility | ✅ Complete |
| 10 | Infrastructure Hardening | ✅ Complete |

---

## 🔒 Security

- **API key auth** on all mutating endpoints
- **SSRF protection** — internal/private URLs blocked
- **Rate limiting** — 20 writes/min, 200 reads/min per IP
- **Zod validation** — strict input schemas on all endpoints
- **Mass assignment prevention** — PUT only allows safe fields
- **Security headers** — CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy
- **Pagination cap** — max limit of 100 regardless of request
- **Docker network isolation** — PostgreSQL binds to `127.0.0.1` only

---

## 🧪 Testing

All tools are client-side and work directly in the browser:

1. **Key Converter** — Paste any npub, nsec, or hex key → see all formats
2. **NIP-05 Checker** — Enter `user@domain.com` → verify identity resolution
3. **QR Code** — Paste content → generate/download QR code
4. **Event Publisher** — Compose event → sign with NIP-07 → publish to relay
5. **Event Deleter** — Enter event IDs → send NIP-09 deletion request
6. **Backup** — Enter pubkey + relay → download event backup as JSON
7. **Accessibility** — Tab through all elements → verify focus ring, 44px targets, screen reader announcements

---

## 📄 Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [Style Guide](docs/development/style-guide.md)
- [Phase Specs](docs/features/) — Detailed feature specifications for each phase
- [NIP Reference](docs/features/nip-reference.md) — Nostr Implementation Possibilities reference
- [Prompt Guidelines](docs/prompts/best-practices.md)

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
