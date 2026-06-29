# ADR-002: Drizzle ORM over Prisma

## Status

**Accepted** — 2026-06-30

## Context

We need a TypeScript ORM for PostgreSQL that works well with Bun. The main contenders are:

- **Prisma**: Popular, great DX, but generates a Rust engine binary
- **Drizzle ORM**: Lightweight, SQL-like API, native Bun support
- **TypeORM**: Decorator-based, less TypeScript-native
- **Kysely**: Query builder only, no schema management

## Decision

We use **Drizzle ORM** with **postgres.js** as the PostgreSQL driver.

### Key Reasons

1. **No binary dependency**: Prisma generates a Rust engine that can fail on different platforms; Drizzle is pure JS/TS
2. **SQL-like API**: Drizzle queries look like SQL, making them predictable and easy to debug
3. **Bun-native**: Drizzle works natively with Bun (no Node.js compatibility layer needed)
4. **Type inference**: Schema → TypeScript types are inferred automatically, no code generation step
5. **Lightweight**: ~100KB vs Prisma's ~50MB+ with the engine binary
6. **Migration workflow**: `drizzle-kit` generates SQL migrations from schema changes

## Consequences

### Positive

- **Faster startup**: No Prisma engine to spawn on each query
- **Smaller Docker images**: No binary to bundle
- **SQL literacy**: Developers write SQL-like code, not ORM abstraction
- **JSON support**: Native `jsonb` column type for NIP-11 documents
- **Array columns**: PostgreSQL arrays for `supported_nips` (Prisma has limited array support)

### Negative

- **Less mature ecosystem**: Fewer tutorials and Stack Overflow answers than Prisma
- **Manual relation handling**: No automatic relation loading (write joins manually)
- **Schema in code**: Schema file must be kept in sync with actual database (mitigated by `drizzle-kit push`)

## References

- [Drizzle ORM docs](https://orm.drizzle.team)
- [Drizzle + Bun](https://orm.drizzle.team/docs/get-started/bun-existing)
- [postgres.js](https://github.com/porsager/postgres)
