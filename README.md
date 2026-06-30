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
| **Scheduler** | [node-cron](https://nodecron.com) / Bun timers |
| **Language** | [TypeScript](https://typescriptlang.org) 6.0 (strict mode) |

## Project Structure

```
relayscope/
├── apps/
│   ├── web/          # Vite + Svelte 5 frontend
│   └── api/          # Hono + Bun REST API
├── packages/
│   └── shared/       # Shared TypeScript types
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.2+
- [PostgreSQL](https://www.postgresql.org) 18+

### Setup

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Generate & run migrations
bun run db:generate
bun run db:migrate

# Start dev servers (web + API)
bunx turbo dev
```

- **Web**: http://localhost:5173
- **API**: http://localhost:3001

### Commands

```bash
bun install              # Install all dependencies
bunx turbo build         # Build all packages
bunx turbo dev           # Start all dev servers
bunx turbo type-check    # Type-check all packages
bunx biome check .       # Lint + format check
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema directly (dev)
bun run db:studio        # Open Drizzle Studio
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/relays` | List relays (search, filter by NIPs, auth, country) |
| `GET` | `/api/relays/:id` | Get relay with latest health check |
| `POST` | `/api/relays` | Add relay (auto-fetches NIP-11) |
| `PUT` | `/api/relays/:id` | Update relay |
| `DELETE` | `/api/relays/:id` | Remove relay |
| `POST` | `/api/relays/:id/check` | Run health check |
| `GET` | `/api/relays/:id/history` | Health check history |
| `GET` | `/api/relays/:id/nip11` | NIP-11 snapshot history |

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

### Phase 3 — Event Verifier (planned)
- Client-side Schnorr signature verification
- Event ID verification
- Tag decoder with context

### Phase 4 — Auth & Health Dashboard (planned)
- NIP-42 AUTH handling
- Latency measurement
- Write test capability

### Phase 5 — Relay Directory (planned)
- NIP-66 relay discovery
- Side-by-side comparison
- Uptime sparklines

## License

MIT
