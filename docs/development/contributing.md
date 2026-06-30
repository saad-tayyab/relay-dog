# 🤝 Contributing Guide

## Workflow

### 1. Branch from `main`

```bash
git checkout -b feat/add-event-viewer main
```

**Branch naming**:
| Prefix | Use for |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring (no behavior change) |
| `test/` | Adding or updating tests |
| `chore/` | Tooling, dependencies, CI |

### 2. Make Changes

Follow the [Style Guide](style-guide.md). Keep commits atomic and well-typed.

### 3. Verify Locally

```bash
# Type check all packages
bunx turbo type-check

# Build everything
bunx turbo build

# Test manually in browser
bunx turbo dev
```

### 4. Commit with Conventional Commits

The `commit-msg` hook enforces the format:

```
<type>(<scope>): <description>
```

**Examples**:
```bash
git commit -m "feat(web): add live event stream viewer"
git commit -m "fix(api): handle WebSocket timeout gracefully"
git commit -m "docs(api): add endpoint examples"
git commit -m "refactor(db): simplify health check query"
```

**Types**: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

**Scopes**: `web` `api` `shared` `db` `monitor` `ui`

### 5. Push and Create PR

```bash
git push -u origin feat/add-event-viewer
```

**PR Title**: Same format as commit messages (Conventional Commits)

**PR Description**: Use this template:

```markdown
## What

Brief description of the change.

## Why

Context on why this change is needed.

## How

Technical approach taken.

## Testing

How to verify the change works.

## Screenshots

(if UI changes)
```

### 6. Review and Merge

- All `turbo type-check` must pass (enforced by pre-commit hook)
- At least 1 review for `main`
- Squash merge to keep history clean

---

## Code Review Checklist

- [ ] TypeScript types are correct (no `any` unless justified)
- [ ] Error handling covers edge cases
- [ ] No hardcoded values (use env vars or constants)
- [ ] Database changes include migration
- [ ] API changes are documented in `docs/api/endpoints.md`
- [ ] New features include a feature spec in `docs/features/`

---

## Adding a New API Endpoint

1. **Add the route** in `apps/api/src/routes/`:

```typescript
relayRoutes.get('/stats', async (c) => {
  const stats = await db.select().from(relays)
  return c.json({ success: true, data: stats })
})
```

2. **Add shared types** in `packages/shared/src/types.ts` if needed

3. **Document it** in `docs/api/endpoints.md`

4. **Add to the endpoints table** in `docs/api/README.md`

---

## Adding a New Database Table

1. **Update the schema** in `apps/api/src/db/schema.ts`

2. **Generate migration**:
```bash
bun run db:generate
```

3. **Update shared types** in `packages/shared/src/types.ts`

4. **Document it** in `docs/architecture/database.md`

---

## Adding a New Frontend Component

1. **Create the component** as a `.svelte` file in `apps/web/src/components/`

2. **Use Tailwind** for styling (Svelte scoped CSS available but prefer Tailwind)

3. **Import shared types** from `@relayscope/shared` and use `$props()` for component props

4. **Document** if it's a significant new feature in `docs/features/`

---

## Performance Guidelines

- **API**: Use database indexes for common queries
- **Web**: Use Svelte's built-in code-splitting with dynamic `import()` for lazy-loaded routes
- **WebSocket**: Implement reconnection with exponential backoff
- **Database**: Use `SELECT` with specific columns, not `SELECT *`

---

## Security Guidelines

- **Never** commit `.env` files (they're gitignored)
- **Validate** all user input at the API boundary
- **Use** `AbortSignal.timeout()` for all external HTTP/WS calls
- **Sanitize** error messages — don't leak internal details to the client
