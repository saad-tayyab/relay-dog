# 📚 Relay Scope Documentation

Welcome to the Relay Scope documentation. This is the single source of truth for architecture, APIs, development workflow, and feature specifications.

## Structure

```
docs/
├── README.md                  # You are here — documentation hub
├── architecture/
│   ├── overview.md            # System architecture & data flow
│   ├── database.md            # Drizzle schema reference
│   └── decisions/             # Architecture Decision Records (ADRs)
│       └── 001-monorepo.md    # Why Turborepo + Bun
├── api/
│   ├── README.md              # API overview & quick start
│   └── endpoints.md           # Full endpoint reference
├── development/
│   ├── setup.md               # Local dev environment setup
│   ├── contributing.md        # Contribution workflow & PR guidelines
│   └── style-guide.md         # Code style & conventions
├── features/
│   ├── phase-1-nip11.md       # NIP-11 Viewer (MVP)
│   ├── phase-2-events.md      # Live Event Stream (planned)
│   └── phase-3-verifier.md    # Event Verifier (planned)
└── changelog.md               # Release history
```

## Quick Links

- **New here?** Start with [Development Setup](development/setup.md)
- **Adding a feature?** Read [Contributing](development/contributing.md) and the relevant [Feature Spec](features/)
- **API integration?** See [API Endpoints](api/endpoints.md)
- **Architecture context?** Read [System Overview](architecture/overview.md)

## Documentation Standards

All docs follow these conventions:

- **Format**: Markdown (`.md`)
- **Diagrams**: Mermaid (rendered by GitHub, IDE extensions)
- **ADRs**: Numbered, dated, status-tracked (`proposed` → `accepted` → `superseded`)
- **API docs**: OpenAPI-style with request/response examples
- **Code blocks**: Always tagged with language (`typescript`, `bash`, `sql`)
