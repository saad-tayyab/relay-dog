# 📚 Documentation Hub

Welcome to the Relay Scope documentation. This is the single source of truth for architecture, APIs, development workflow, and feature specifications.

> **Version**: `0.9.0` — Updated 2026-07-01. See individual files for per-doc timestamps.

## Structure

```
docs/
├── README.md                          # You are here
├── roadmap.md                         # Full 10-phase project plan
│
├── architecture/
│   ├── overview.md                    # System architecture + Mermaid diagrams
│   ├── database.md                    # Schema reference (7 tables, ERD)
│   └── decisions/
│       ├── 001-monorepo.md            # ADR: Turborepo + Bun
│       └── 002-drizzle-orm.md         # ADR: Drizzle over Prisma
│
├── api/
│   ├── README.md                      # API overview + key files
│   └── endpoints.md                   # Full endpoint reference (17 endpoints)
│
├── audit/
│   └── packages.md                    # Version audit trail
│
├── development/
│   ├── setup.md                       # Local dev setup
│   ├── contributing.md                # Contribution workflow
│   ├── style-guide.md                 # Code style conventions
│   ├── deployment.md                  # Production deployment
│   ├── environment.md                 # Environment variables
│   ├── testing.md                     # Testing strategy
│   └── infrastructure-security.md     # Infra security best practices
│
├── features/
│   ├── _template.md                   # Phase doc template
│   ├── nip-reference.md               # NIP implementations reference
│   ├── phase-1-nip11.md               # MVP spec (implemented ✅)
│   ├── phase-2-events.md              # Live event stream (complete ✅)
│   ├── phase-3-verifier.md            # Event verifier (complete ✅)
│   ├── phase-4-auth.md               # Auth & health (complete ✅)
│   ├── phase-5-directory.md          # Relay directory (complete ✅)
│   ├── phase-6-security-hardening.md # Security hardening (complete ✅)
│   ├── phase-7-nip-compliance.md     # NIP compliance (complete ✅)
│   ├── phase-8-developer-toolkit.md  # Developer toolkit (complete ✅)
│   ├── phase-9-accessibility.md      # WCAG 2.2 AA (complete ✅)
│   └── phase-10-infrastructure-hardening.md # DevSecOps (complete ✅)
│
├── prompts/
│   ├── best-practices.md             # AI prompt engineering practices
│   ├── phase-5-prompts.md            # Phase 5 prompt templates
│   ├── phase-7-prompts.md            # Phase 7 prompt templates
│   └── phase-8-prompts.md            # Phase 8 prompt templates
│
└── changelog.md                       # Release history
```

## Quick Links

| Topic | Start Here |
|-------|-----------|
| **New here** | [Development Setup](development/setup.md) |
| **Project plan** | [Roadmap](roadmap.md) |
| **Adding a feature** | [Contributing](development/contributing.md) + [Feature Spec](features/) |
| **API integration** | [API Endpoints](api/endpoints.md) |
| **Architecture** | [System Overview](architecture/overview.md) |
| **Package versions** | [Audit Trail](audit/packages.md) |
| **Deploying** | [Deployment Guide](development/deployment.md) |
| **NIPs** | [NIP Reference](features/nip-reference.md) |
| **Prompting AI** | [Prompt Best Practices](prompts/best-practices.md) |
| **Infrastructure security** | [Infra Security](development/infrastructure-security.md) |

## Doc Version Tracking

Quick check if a doc is current with the codebase. Updated with every significant change.

| Doc | Version | Last Updated | Notes |
|-----|---------|-------------|-------|
| architecture/overview.md | `v0.9.0` | 2026-07-01 | Updated for 7 tables, 4 packages, security |
| architecture/database.md | `v0.9.0` | 2026-07-01 | Updated for 7 tables, NIP-66/65, data retention |
| api/README.md | `v0.9.0` | 2026-07-01 | Updated for 12 files, middleware, security |
| api/endpoints.md | `v0.9.0` | 2026-07-01 | Updated for 17 endpoints, auth, rate limits |
| development/environment.md | `v0.9.0` | 2026-07-01 | Added API_KEY, CORS_ORIGINS, POSTGRES_PASSWORD |
| development/deployment.md | `v0.9.0` | 2026-07-01 | Added API_KEY, Phase 10 infra, Docker |
| development/style-guide.md | `v0.9.0` | 2026-07-01 | Added accessibility, composable patterns |
| development/setup.md | `v0.9.0` | 2026-07-01 | Updated project structure |
| development/infrastructure-security.md | `v0.9.0` | 2026-07-01 | Phase 10 infra |
| features/phase-3-verifier.md | `v0.9.0` | 2026-07-01 | Fixed component structure |
| features/phase-5-directory.md | `v0.9.0` | 2026-07-01 | Added 13 missing components |
| features/phase-7-nip-compliance.md | `v0.9.0` | 2026-07-01 | Fixed API changes, file references |
| features/phase-9-accessibility.md | `v0.9.0` | 2026-07-01 | WCAG 2.2 AA |
| features/phase-10-infrastructure-hardening.md | `v0.9.0` | 2026-07-01 | DevSecOps |
| prompts/best-practices.md | `v0.9.0` | 2026-07-01 | AI prompt guidelines |
| roadmap.md | `v0.9.0` | 2026-07-01 | Phase 7 API count, Phase 10 |
| changelog.md | `v0.9.0` | 2026-07-01 | Release history |
| features/phase-1-nip11.md | `v0.1.0` | 2026-06-30 | Original — still accurate |
| features/phase-2-events.md | `v0.2.0` | 2026-06-30 | Original — still accurate |
| features/phase-4-auth.md | `v0.4.0` | 2026-06-30 | Original — still accurate |
| features/phase-6-security-hardening.md | `v0.6.0` | 2026-06-30 | Original — still accurate |
| features/phase-8-developer-toolkit.md | `v0.8.0` | 2026-06-30 | Original — still accurate |
| development/contributing.md | `v0.1.0` | 2026-06-30 | Original — still accurate |
| development/testing.md | `v0.1.0` | 2026-06-30 | Original — still accurate |


## Documentation Standards

- **Format**: Markdown (`.md`)
- **Diagrams**: Mermaid (rendered by GitHub, IDE extensions)
- **ADRs**: Numbered, dated, status-tracked (`proposed` → `accepted` → `superseded`)
- **API docs**: Full request/response examples with curl commands
- **Code blocks**: Always tagged (`typescript`, `bash`, `sql`, `json`)
- **Version tracking**: Updated with every dependency change

---

*Last updated: v0.9.0 — 2026-07-01*
