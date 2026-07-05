---
title: "📚 Documentation Hub"
version: "0.10.0"
status: "current"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

<p align="center">
  <img src="https://img.shields.io/badge/version-0.10.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/docs-32_files-purple?style=for-the-badge" alt="Files">
  <img src="https://img.shields.io/badge/last_updated-2026--07--04-orange?style=for-the-badge" alt="Updated">
</p>

<h1 align="center">📚 Documentation Hub</h1>

<p align="center">
  <strong>Single source of truth</strong> for architecture, APIs, development workflow, and feature specifications.
</p>

<p align="center">
  <a href="architecture/overview.md">Architecture</a> · <a href="api/endpoints.md">API</a> · <a href="development/setup.md">Setup</a> · <a href="features/">Features</a> · <a href="changelog.md">Changelog</a>
</p>

---

## 🗺️ Documentation Map

```mermaid
mindmap
  root((Docs Hub))
    Architecture
      System Overview
      Database Schema
      ADR: Monorepo
      ADR: Drizzle ORM
    API
      Overview
      Endpoints
    Development
      Setup
      Contributing
      Style Guide
      Testing
      Deployment
      Environment
      Infrastructure Security
    Features
      Phase 1: NIP-11
      Phase 2: Events
      Phase 3: Verifier
      Phase 4: Auth
      Phase 5: Directory
      Phase 6: Security
      Phase 7: NIP Compliance
      Phase 8: Toolkit
      Phase 9: Accessibility
      Phase 10: Infra Hardening
      Phase 11: Deployment
      Phase 12: NIP-66
    Audit
      Package Versions
      Structure Audit
    Prompts
      Best Practices
```

---

## ⚡ Quick Links

<table>
  <tr>
    <td width="50%" valign="top">

### 🏗️ Architecture
| Doc | Description |
|-----|-------------|
| [System Overview](architecture/overview.md) | High-level design with Mermaid diagrams |
| [Database Schema](architecture/database.md) | 5 managed tables, ERD, queries |
| [ADR: Monorepo](architecture/decisions/001-monorepo.md) | Turborepo + Bun decision |
| [ADR: Drizzle](architecture/decisions/002-drizzle-orm.md) | Drizzle over Prisma |

    </td>
    <td width="50%" valign="top">

### ⚡ API
| Doc | Description |
|-----|-------------|
| [API Overview](api/README.md) | Architecture, middleware, security |
| [API Endpoints](api/endpoints.md) | 15 endpoints with examples |

    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

### 🛠️ Development
| Doc | Description |
|-----|-------------|
| [Setup](development/setup.md) | Local dev environment |
| [Contributing](development/contributing.md) | PR workflow |
| [Style Guide](development/style-guide.md) | Code conventions |
| [Testing](development/testing.md) | Test strategy |
| [Deployment](development/deployment.md) | Production deploy |
| [Environment](development/environment.md) | Env variables |
| [Infra Security](development/infrastructure-security.md) | Security best practices |

    </td>
    <td width="50%" valign="top">

### 📋 Features
| Doc | Status |
|-----|--------|
| [Phase 1: NIP-11](features/phase-1-nip11.md) | ✅ |
| [Phase 2: Events](features/phase-2-events.md) | ✅ |
| [Phase 3: Verifier](features/phase-3-verifier.md) | ✅ |
| [Phase 4: Auth](features/phase-4-auth.md) | ✅ |
| [Phase 5: Directory](features/phase-5-directory.md) | ✅ |
| [Phase 6: Security](features/phase-6-security-hardening.md) | ✅ |
| [Phase 7: NIP Compliance](features/phase-7-nip-compliance.md) | ✅ |
| [Phase 8: Toolkit](features/phase-8-developer-toolkit.md) | ✅ |
| [Phase 9: Accessibility](features/phase-9-accessibility.md) | ✅ |
| [Phase 10: Infra](features/phase-10-infrastructure-hardening.md) | ✅ |
| [Phase 11: Deploy](features/phase-11-production-deployment.md) | 📋 |
| [Phase 12: NIP-66](features/phase-12-nip66-passive-monitoring.md) | 📋 |
| [Phase 13: shadcn-svelte Migration](features/phase-13-shadcn-svelte-migration.md) | 📋 |

    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

### 🔍 Audit
| Doc | Description |
|-----|-------------|
| [Package Audit](audit/packages.md) | Dependency versions |
| [Structure Audit](audit/structure-audit-2026.md) | Codebase analysis |

    </td>
    <td width="50%" valign="top">

### 📝 Other
| Doc | Description |
|-----|-------------|
| [Changelog](changelog.md) | Release history |
| [Roadmap](roadmap.md) | 12-phase project plan |
| [NIP Reference](features/nip-reference.md) | NIP implementations |
| [Prompts](prompts/best-practices.md) | AI prompt guidelines |

    </td>
  </tr>
</table>

---

## 📊 Doc Version Tracking

> [!NOTE]
> Updated with every significant change. Check this table to verify docs are current with the codebase.

<table>
  <thead>
    <tr>
      <th>Doc</th>
      <th>Version</th>
      <th>Last Updated</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr><td colspan="4"><strong>Architecture</strong></td></tr>
    <tr><td>overview.md</td><td><code>v0.10.0</code></td><td>2026-07-04</td><td>8 packages, security, NIP-66, relations</td></tr>
    <tr><td>database.md</td><td><code>v0.10.0</code></td><td>2026-07-04</td><td>5 tables, relations, bun-sql driver</td></tr>
    <tr><td>decisions/001-monorepo.md</td><td><code>v0.1.0</code></td><td>2026-06-30</td><td>Accepted</td></tr>
    <tr><td>decisions/002-drizzle-orm.md</td><td><code>v0.1.0</code></td><td>2026-06-30</td><td>Accepted</td></tr>
    <tr><td colspan="4"><strong>API</strong></td></tr>
    <tr><td>README.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>12 files, middleware, security</td></tr>
    <tr><td>endpoints.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>15 endpoints, auth, rate limits</td></tr>
    <tr><td colspan="4"><strong>Development</strong></td></tr>
    <tr><td>setup.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>Project structure</td></tr>
    <tr><td>contributing.md</td><td><code>v0.1.0</code></td><td>2026-06-30</td><td>PR workflow</td></tr>
    <tr><td>style-guide.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>Accessibility, composables</td></tr>
    <tr><td>testing.md</td><td><code>v0.10.0</code></td><td>2026-07-04</td><td>Bun test, smoke tests</td></tr>
    <tr><td>deployment.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>Phase 10, Docker</td></tr>
    <tr><td>environment.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>API_KEY, CORS_ORIGINS</td></tr>
    <tr><td>infrastructure-security.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>Phase 10</td></tr>
    <tr><td colspan="4"><strong>Features</strong></td></tr>
    <tr><td>phase-1-nip11.md</td><td><code>v0.1.0</code></td><td>2026-06-30</td><td>Still accurate</td></tr>
    <tr><td>phase-2-events.md</td><td><code>v0.2.0</code></td><td>2026-06-30</td><td>Still accurate</td></tr>
    <tr><td>phase-3-verifier.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>Fixed structure</td></tr>
    <tr><td>phase-4-auth.md</td><td><code>v0.4.0</code></td><td>2026-06-30</td><td>Still accurate</td></tr>
    <tr><td>phase-5-directory.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>Added 13 components</td></tr>
    <tr><td>phase-6-security.md</td><td><code>v0.6.0</code></td><td>2026-06-30</td><td>Still accurate</td></tr>
    <tr><td>phase-7-nip-compliance.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>Fixed API changes</td></tr>
    <tr><td>phase-8-developer-toolkit.md</td><td><code>v0.8.0</code></td><td>2026-06-30</td><td>Still accurate</td></tr>
    <tr><td>phase-9-accessibility.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>WCAG 2.2 AA</td></tr>
    <tr><td>phase-10-infra.md</td><td><code>v0.9.0</code></td><td>2026-07-01</td><td>DevSecOps</td></tr>
    <tr><td>phase-11-deploy.md</td><td><code>v0.10.0</code></td><td>2026-07-04</td><td>Fly.io deployment</td></tr>
    <tr><td>phase-13-shadcn-svelte-migration.md</td><td><code>v0.1.0</code></td><td>2026-07-05</td><td>Planned</td></tr>
    <tr><td colspan="4"><strong>Meta</strong></td></tr>
    <tr><td>changelog.md</td><td><code>v0.10.0</code></td><td>2026-07-04</td><td>v0.10.0 release</td></tr>
    <tr><td>roadmap.md</td><td><code>v0.10.0</code></td><td>2026-07-04</td><td>Fixed statuses</td></tr>
    <tr><td>AGENTS.md</td><td><code>v0.10.0</code></td><td>2026-07-04</td><td>Relations, test cmd</td></tr>
  </tbody>
</table>

---

## 📐 Documentation Standards

| Standard | Description |
|----------|-------------|
| 📝 Format | Markdown (`.md`) with YAML frontmatter |
| 📊 Diagrams | Mermaid (rendered by GitHub, IDE extensions) |
| 📋 ADRs | Numbered, dated, status-tracked (`proposed` → `accepted`) |
| 🔌 API Docs | Full request/response examples with curl commands |
| 💻 Code Blocks | Always tagged (`typescript`, `bash`, `sql`, `json`) |
| 🔢 Versioning | Semantic version tracking in frontmatter + header |
| 👤 Audit Trail | Author + timestamp on every doc |

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/SaadTayyab">Saad Tayyab</a>
</p>
