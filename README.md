# 🐕 Relay Scope

**Nostr relay inspector** — "Postman meets Wireshark, for Nostr relays."

Paste a relay URL and get a complete picture: what it supports, how it behaves, what's flowing through it in real time, and how healthy it is.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | [Bun](https://bun.sh) |
| **Monorepo** | [Turborepo](https://turbo.build) |
| **Web** | [Svelte 5](https://svelte.dev) + [Vite](https://vite.dev) + [Tailwind CSS v4](https://tailwindcss.com) |
| **API** | [Hono](https://hono.dev) (HTTP framework) |
| **Database** | [PostgreSQL](https://www.postgresql.org) + [Drizzle ORM](https://orm.drizzle.team) |
| **Language** | [TypeScript](https://typescriptlang.org) 6.0 (strict mode) |

## Project Structure

```
relayscope/
├── apps/
│   ├── web/          # Vite + Svelte 5 frontend
│   └── api/          # Hono + Bun REST API
├── packages/
│   └── shared/       # Shared TypeScript types
├── docs/             # Architecture & audit docs
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)

### Setup

```bash
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

### Commands

```bash
bun install              # Install all dependencies
bun run build            # Build all packages
bun run dev              # Start all dev servers
bun run type-check       # Type-check all packages
bun run lint             # Lint all packages
bun run lint:fix         # Auto-fix lint issues
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema directly (dev)
bun run db:studio        # Open Drizzle Studio
```

## API Endpoints

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

**Auth**: `Authorization: Bearer <API_KEY>` header required on mutating endpoints (POST, PUT, DELETE).

## Security (Phase 6)

- **API key auth** on all mutating endpoints
- **SSRF protection** — internal/private URLs blocked
- **Rate limiting** — 20 writes/min, 200 reads/min per IP
- **Zod validation** — strict input schemas on all endpoints
- **Mass assignment prevention** — PUT only allows safe fields
- **Security headers** — CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy
- **Pagination cap** — max limit of 100 regardless of request
- **Docker network isolation** — PostgreSQL binds to `127.0.0.1` only

## Features

### Phase 1 — NIP-11 Viewer ✅
- Fetch and render relay info document
- NIP badge grid with links to specs
- Limitations panel (auth required, max sizes, etc.)
- Connection status checks (HTTP, CORS, WebSocket)

### Phase 2 — Live Event Stream ✅
- WebSocket connection with auto-reconnect (exponential backoff)
- REQ subscription builder (kinds, authors, limit, since/until)
- Live event feed with auto-scroll and EOSE detection
- Event deduplication and kind-based color coding

### Phase 3 — Event Verifier ✅
- Client-side Schnorr signature verification
- Event ID verification
- Tag decoder with context

### Phase 4 — Auth & Health Dashboard ✅
- NIP-42 AUTH handling
- Latency measurement
- Write test capability

### Phase 5 — Relay Directory ✅
- NIP-66 relay discovery
- Side-by-side comparison
- Uptime sparklines

### Phase 6 — Security Hardening ✅
- API key auth middleware (P0)
- SSRF protection (P0)
- Rate limiting per IP
- Zod input validation
- Mass assignment prevention
- Security headers on all responses
- Pagination limits
- CI pipeline (lint, type-check, build)
- Dependency audit

## License

MIT
