# 📚 Documentation Hub

Welcome to the Relay Scope documentation. This is the single source of truth for architecture, APIs, development workflow, and feature specifications.

## Structure

```
docs/
├── README.md                          # You are here
├── roadmap.md                         # Full 7-phase project plan
│
├── architecture/
│   ├── overview.md                    # System architecture + Mermaid diagrams
│   ├── database.md                    # Schema reference (5 tables, ERD)
│   └── decisions/
│       ├── 001-monorepo.md            # ADR: Turborepo + Bun
│       └── 002-drizzle-orm.md         # ADR: Drizzle over Prisma
│
├── api/
│   ├── README.md                      # API overview + key files
│   └── endpoints.md                   # Full endpoint reference
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
│   └── testing.md                     # Testing strategy
│
├── features/
│   ├── nip-reference.md               # NIP implementations reference
│   ├── phase-1-nip11.md               # MVP spec (implemented ✅)
│   ├── phase-2-events.md              # Live event stream (planned)
│   ├── phase-3-verifier.md            # Event verifier (planned)
│   ├── phase-4-auth.md               # Auth & health (planned)
│   ├── phase-5-directory.md          # Relay directory (complete ✅)
│   ├── phase-6-security-hardening.md # Security hardening (complete ✅)
│   └── phase-7-nip-compliance.md     # NIP compliance (planned)
│
├── prompts/
│   └── best-practices.md             # AI prompt engineering practices
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

## Documentation Standards

- **Format**: Markdown (`.md`)
- **Diagrams**: Mermaid (rendered by GitHub, IDE extensions)
- **ADRs**: Numbered, dated, status-tracked (`proposed` → `accepted` → `superseded`)
- **API docs**: Full request/response examples with curl commands
- **Code blocks**: Always tagged (`typescript`, `bash`, `sql`, `json`)
- **Version tracking**: Updated with every dependency change
