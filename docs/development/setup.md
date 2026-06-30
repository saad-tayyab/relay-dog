# 🛠️ Development Setup

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Bun](https://bun.sh) | v1.2+ | Runtime + package manager |
| [PostgreSQL](https://www.postgresql.org) | 18+ | Database |
| [Git](https://git-scm.com) | 2.30+ | Version control |

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd relayscope

# 2. Install dependencies
bun install

# 3. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# 4. Start PostgreSQL and create the database
createdb relayscope

# 5. Push schema to database
bun run db:push

# 6. Start dev servers
bunx turbo dev
```

This starts:
- **Web**: http://localhost:5173 (Vite dev server)
- **API**: http://localhost:3001 (Hono dev server)

## Detailed Setup

### 1. PostgreSQL

**macOS** (Homebrew):
```bash
brew install postgresql@18
brew services start postgresql@18
createdb relayscope
```

**Docker** (alternative):
```bash
docker run -d --name relayscope-pg \
  -e POSTGRES_DB=relayscope \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:18
```

Update `.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/relayscope
```

### 2. Database Schema

```bash
# Generate migration files from schema
bun run db:generate

# Run migrations
bun run db:migrate

# Or push directly (dev only)
bun run db:push

# Visual database browser
bun run db:studio
```

### 3. Dev Servers

```bash
# Start everything
bunx turbo dev

# Start only web
bunx turbo dev --filter=@relayscope/web

# Start only API
bunx turbo dev --filter=@relayscope/api
```

### 4. Git Hooks

Git hooks are configured automatically via `core.hooksPath = .githooks`:

- **pre-commit**: Runs `turbo type-check` across all packages
- **commit-msg**: Enforces [Conventional Commits](https://conventionalcommits.org) format

No manual setup needed — hooks run on `git commit`.

## Project Structure

```
relayscope/
├── apps/
│   ├── web/                    # Vite + Svelte 5 frontend
│   │   ├── src/
│   │   │   ├── App.svelte     # Main app component
│   │   │   ├── index.css       # Tailwind styles
│   │   │   └── main.ts         # Svelte mount
│   │   └── vite.config.ts      # Vite config with API proxy
│   └── api/                    # Hono + Bun backend
│       ├── src/
│       │   ├── index.ts        # Server entry point
│       │   ├── routes/         # API endpoints
│       │   ├── jobs/           # Background tasks
│       │   └── db/             # Database schema + connection
│       └── drizzle.config.ts
├── packages/
│   └── shared/                 # Shared TypeScript types
│       └── src/types.ts
├── docs/                       # Documentation
├── turbo.json                  # Turborepo task config
└── package.json                # Workspace root
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bunx turbo dev` | Start all dev servers |
| `bunx turbo build` | Build all packages |
| `bunx turbo type-check` | Run TypeScript checks |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run migrations |
| `bun run db:push` | Push schema (dev) |
| `bun run db:studio` | Open Drizzle Studio |

## Troubleshooting

### Port already in use

```bash
# Kill processes on port 5173 or 3001
lsof -ti:5173 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database connection refused

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql postgresql://localhost:5432/relayscope
```

### Type errors after pulling

```bash
# Reinstall dependencies
rm -rf node_modules bun.lock
bun install
```

### Turborepo cache issues

```bash
# Clear turbo cache
bunx turbo daemon clean
# Or
rm -rf .turbo
```
