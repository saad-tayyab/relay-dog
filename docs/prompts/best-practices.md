# 🤖 Prompt Engineering Best Practices (2026)

How to use AI agents effectively for building, reviewing, and maintaining Relay Scope.

## The Golden Rules

### 1. Context Is Everything

AI is only as good as the context you give it. The more specific, the better.

```
❌ Bad:  "Fix the API"
✅ Good: "In apps/api/src/routes/relays.ts, the GET /api/relays endpoint
         returns 500 when the database is empty. Add a null check and
         return an empty array instead."
```

### 2. One Task Per Prompt

Break complex work into atomic prompts. Each prompt should produce one verifiable change.

```
❌ Bad:  "Build the entire Phase 2 feature"
✅ Good: 
  1. "Create a WebSocket connection hook in apps/web/src/hooks/useRelaySocket.ts"
  2. "Add a connection status indicator component"
  3. "Build the REQ subscription builder UI"
```

### 3. Specify the File

Always name the file you want changed. AI will create or overwrite files if left ambiguous.

```
❌ Bad:  "Add a type for relay events"
✅ Good: "Add a NostrEvent interface to packages/shared/src/types.ts"
```

### 4. Show, Don't Tell

Include example input/output, not just descriptions.

```
❌ Bad:  "Format the error nicely"
✅ Good: "Wrap the error in this format:
         { success: false, error: message, code: 'RELAY_UNREACHABLE' }"
```

### 5. Verify After Every Change

Always ask AI to run checks after making changes.

```
"After making this change, run:
 1. bunx biome check .
 2. npx turbo type-check
 3. npx turbo build"
```

---

## Prompt Templates

### New Feature

```
Add [FEATURE] to [FILE].

Requirements:
- [Requirement 1]
- [Requirement 2]

Constraints:
- Use existing [PATTERN] from [EXISTING_FILE]
- Follow conventions in docs/development/style-guide.md
- No new dependencies unless absolutely necessary

After making changes, run type-check and build.
```

### Bug Fix

```
In [FILE], [DESCRIPTION_OF_BUG].

Expected: [WHAT SHOULD HAPPEN]
Actual: [WHAT ACTUALLY HAPPENS]

Fix it and verify with type-check + build.
```

### Refactor

```
Refactor [FILE] to [GOAL].

Current code:
```[language]
[PASTE CURRENT CODE]
```

Requirements:
- Preserve all existing behavior
- Use [PATTERN] instead of [OLD_PATTERN]
- Run biome check + type-check after
```

### Code Review

```
Review [FILE] for:
1. TypeScript best practices
2. Error handling completeness
3. Security issues
4. Performance concerns

Reference: docs/development/style-guide.md
```

### Documentation

```
Update [DOC_FILE] to reflect [CHANGE].

Current content: [PASTE RELEVANT SECTION]
New content should include: [WHAT_TO_ADD]
```

---

## Project-Specific Prompts

### Working on Relay Scope

Always reference the project context:

```
I'm working on Relay Scope, a Nostr relay inspector.

Tech stack:
- Bun 1.3 + Turborepo monorepo
- Apps: Vite+React (web), Hono+Bun (api)
- Drizzle ORM + PostgreSQL
- Biome for linting, TypeScript 6.0

Project docs are in docs/. Always check:
- docs/development/style-guide.md for code conventions
- docs/architecture/database.md for schema
- docs/api/endpoints.md for API patterns
- docs/features/ for feature specs
```

### Phase-Specific

```
I'm working on Phase [N]: [PHASE_NAME].

Feature spec: docs/features/phase-[N]-[name].md

What to build:
1. [Task 1]
2. [Task 2]

NIPs involved: [NIP-XX, NIP-YY]

After implementation, verify:
- bunx biome check .
- npx turbo type-check
- npx turbo build
- Manual test: [HOW_TO_TEST]
```

---

## Anti-Patterns to Avoid

### 1. Vague Prompts
```
❌ "Make it better"
✅ "Replace the inline styles in RelayCard with Tailwind classes"
```

### 2. Multiple Unrelated Changes
```
❌ "Fix the API and update the README and add tests"
✅ "Fix the null pointer in GET /api/relays" (one thing)
```

### 3. Skipping Verification
```
❌ [Make change, move on]
✅ "After making this change, run biome check and type-check"
```

### 4. Not Providing Error Messages
```
❌ "It doesn't work"
✅ "Getting this error: TS2345: Argument of type 'string' is not assignable to parameter of type 'number'"
```

### 5. Ignoring Existing Patterns
```
❌ "Create a new way to handle errors"
✅ "Use the same error pattern from apps/api/src/routes/relays.ts"
```

---

## Effective Workflow

### Feature Development

```
1. Read the feature spec
   → "Read docs/features/phase-2-events.md and summarize what needs to be built"

2. Plan the implementation
   → "Based on the spec, list the files I need to create/modify"

3. Implement one piece at a time
   → "Create the WebSocket hook in apps/web/src/hooks/useRelaySocket.ts"
   → "Add the connection status component"
   → "Build the event feed UI"

4. Verify after each step
   → "Run biome check, type-check, and build"

5. Test manually
   → "Start the dev server and test the WebSocket connection"

6. Update docs
   → "Update docs/features/phase-2-events.md to mark completed items"
```

### Debugging

```
1. Describe the problem precisely
   → "In apps/web/src/App.tsx line 245, clicking the retry button
      throws 'Cannot read property of undefined'"

2. Share the error
   → "Error: TypeError: Cannot read properties of undefined (reading 'url')
      at App.tsx:245:23"

3. Ask for the fix
   → "Fix this null check. The relay state might be null when the
      component mounts before the fetch completes."

4. Verify
   → "Run type-check and build to confirm the fix"
```

---

## Version-Specific Notes

### TypeScript 6.0
- Stricter CSS import handling → needs `vite-env.d.ts`
- Use `satisfies` operator for type narrowing
- `--noEmit` in Vite apps (Vite handles bundling)

### Biome 2.5
- Run `biome check --write .` for auto-fix
- Tailwind CSS support via `tailwindDirectives: true`
- Some rules are `warn` not `error` — fix them but don't block

### React 19.2
- Prefer `use()` over `useEffect` for data fetching
- Server Components not applicable in Vite SPA (future-proof only)
- Automatic JSX transform (no manual import)

### Hono 4.12
- Use `Bun.serve()` directly (not `@hono/node-server`)
- `app.fetch` for Bun integration
- Built-in middleware: `cors`, `logger`, `prettyJSON`

### Drizzle ORM 0.45
- Use `$inferSelect` for type inference
- Use `returning()` to avoid extra queries
- Use transactions for multi-step writes
- `drizzle-kit generate` for migrations (not `push` in prod)
