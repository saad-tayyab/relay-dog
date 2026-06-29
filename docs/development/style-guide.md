# 📏 Code Style Guide

## TypeScript

### General Rules

```typescript
// ✅ Use explicit types for function signatures
function fetchRelay(url: string): Promise<RelayNip11> { ... }

// ❌ Don't use `any`
const data: any = await fetch(url)

// ✅ Use `unknown` for untyped data
const data: unknown = await fetch(url)

// ✅ Use type inference for variables
const count = 42  // inferred as number

// ✅ Use interfaces for object shapes
interface RelayConfig {
  url: string
  name?: string
}

// ✅ Use type aliases for unions
type CheckStatus = 'pending' | 'success' | 'error' | 'checking'
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase | `relayUrl`, `healthCheck` |
| Functions | camelCase | `fetchRelay()`, `checkHealth()` |
| Types/Interfaces | PascalCase | `RelayInfo`, `HealthCheck` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Files | kebab-case | `relay-monitor.ts`, `health-check.ts` |
| Database columns | snake_case | `relay_id`, `http_reachable` |
| React components | PascalCase | `RelayProfile`, `NipBadge` |

### Imports

```typescript
// 1. External packages first
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'

// 2. Internal packages
import { db } from '../db'
import type { Relay } from '@relayscope/shared'

// 3. Relative imports last
import { checkHealth } from './utils'
```

---

## React (Frontend)

### Component Style

```tsx
// ✅ Functional components only (no class components)
function RelayProfile({ relay }: { relay: Relay }) {
  return (
    <div className="...">
      <h2>{relay.name}</h2>
    </div>
  )
}

// ✅ Use interface for props with multiple properties
interface RelayCardProps {
  relay: Relay
  onSelect: (id: string) => void
  showHealth?: boolean
}

function RelayCard({ relay, onSelect, showHealth = false }: RelayCardProps) { ... }
```

### Tailwind Rules

```tsx
// ✅ Use Tailwind utility classes
<div className="flex items-center gap-4 p-6 rounded-xl bg-dark-card">

// ✅ Use custom theme tokens from index.css
<div className="bg-dark-card border border-dark-border">

// ✅ Use conditional classes
className={`px-4 py-2 ${isActive ? 'bg-accent text-white' : 'bg-dark-surface'}`}

// ❌ Don't use inline styles
<div style={{ padding: '16px', backgroundColor: '#1a1a2a' }}>

// ❌ Don't create CSS files for components (use Tailwind)
```

### Hooks

```tsx
// ✅ Custom hooks prefixed with "use"
function useRelayInfo(url: string) {
  const [relay, setRelay] = useState<Relay | null>(null)
  const [loading, setLoading] = useState(false)
  // ...
  return { relay, loading, error }
}

// ✅ Extract complex logic into custom hooks
function App() {
  const { relay, loading, error } = useRelayInfo(url)
  // ...
}
```

---

## API (Backend)

### Route Style

```typescript
// ✅ Group routes by resource
const relayRoutes = new Hono()

relayRoutes.get('/', async (c) => { ... })
relayRoutes.get('/:id', async (c) => { ... })
relayRoutes.post('/', async (c) => { ... })

// ✅ Use consistent error responses
return c.json({ success: false, error: 'Not found' }, 404)

// ✅ Always validate input
const body = await c.req.json<CreateRelayDto>()
if (!body.url) {
  return c.json({ success: false, error: 'URL is required' }, 400)
}
```

### Database Queries

```typescript
// ✅ Use Drizzle's type-safe query builder
const [relay] = await db
  .select()
  .from(relays)
  .where(eq(relays.id, id))
  .limit(1)

// ✅ Use transactions for multi-step operations
await db.transaction(async (tx) => {
  await tx.insert(relays).values(data)
  await tx.insert(healthChecks).values(healthData)
})

// ❌ Don't use raw SQL unless necessary
await db.execute(sql`SELECT * FROM relays WHERE id = ${id}`)
```

---

## Error Handling

```typescript
// ✅ Always handle errors gracefully
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
} catch (e: unknown) {
  // ✅ Use `unknown` and narrow
  const message = e instanceof Error ? e.message : 'Unknown error'
  console.error(`Failed to fetch ${url}:`, message)
  throw new Error(message)
}
```

---

## File Organization

```
src/
├── index.ts          # Entry point only
├── routes/           # One file per resource
│   ├── relays.ts
│   └── events.ts
├── jobs/             # Background tasks
│   └── relayMonitor.ts
├── db/               # Database layer
│   ├── schema.ts     # Table definitions
│   └── index.ts      # Connection
└── utils/            # Shared utilities
    └── url.ts
```

---

## Git

### Commit Messages

Follow [Conventional Commits](https://conventionalcommits.org):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Good**:
```
feat(web): add NIP-11 relay profile viewer
fix(api): handle CORS errors for unreachable relays
docs: update API endpoint examples
```

**Bad**:
```
update code
fix bug
WIP
```

### PR Titles

Same format as commit messages:
```
feat(web): add live event stream viewer
```
