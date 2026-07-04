---
title: "📝 Phase Template"
version: "0.10.0"
status: "current"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 📝 Phase Template

> **v0.10.0** · **Current** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---


> Copy this template for new phase docs. Delete unused optional sections.
> File naming: `phase-{N}-{kebab-case-name}.md`

---

# {Emoji} Phase {N}: {Title}

## Status

**Complete** ✅ ({YYYY-MM-DD})

<!-- Or: **In Progress** 🚧 | **Planned** 📋 -->

## Overview

{2-3 sentence summary of what this phase delivers and why it matters.}

<!-- Optional: Cross-reference to related docs or prior phases -->
> **Note:** {Context about what's already done or what this phase builds on.}
>
> **Reference:** [{Doc Name}]({relative-link}) — {why this reference matters.}

<!-- Optional: Do-not-reimplement table for overlapping phases -->
## Already Shipped in Phase {N-1}

Do **not** re-implement these in Phase {N}:

| Item | Location | Status |
|------|----------|--------|
| {thing} | `path/to/file.ts` | ✅ Done |

## User Stories

<!-- 3-7 stories, using "As a {role}, I want {goal} so that {benefit}" format -->
<!-- Roles: user, developer, operator -->

1. **As a {role}**, I want {goal} so {benefit}.
2. **As a {role}**, I want {goal} so {benefit}.
3. **As a {role}**, I want {goal} so {benefit}.

## Features

### 1. {Feature Name}

{Brief description of what this feature does.}

**New files:**
- `path/to/new-file.ts`

**Modified files:**
- `path/to/existing-file.ts`

```typescript
// Before (current code)
const oldWay = ...

// After (new code)
const newWay = ...
```

### 2. {Feature Name}

{Repeat for each feature.}

<!-- Optional sections based on phase type: -->

<!-- For security/compliance phases: -->
## Compliance Mapping

| Finding | Standard | Severity | Status |
|---------|----------|----------|--------|
| {finding} | {NIST/CIS/CISA} | 🔴 Critical / 🟠 High / 🟡 Medium | ✅ Fixed |

<!-- For protocol/NIP phases: -->
## NIPs

| NIP | Name | Status | Notes |
|-----|------|--------|-------|
| {NIP-XX} | {Name} | ✅ Implemented / 📋 Planned | {details} |

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `path/to/file` | **New** / Modified | {what changed and why} |

## Effort

| Task | Estimated Time |
|------|---------------|
| {task 1} | {time} |
| {task 2} | {time} |
| **Total** | **{total}** |

---

<!-- 
TEMPLATE CHECKLIST — remove this section before publishing:

- [ ] Status set (Complete ✅ / In Progress 🚧 / Planned 📋)
- [ ] Overview is 2-3 sentences, not a wall of text
- [ ] Cross-references to related docs (if applicable)
- [ ] "Already Shipped" table (if overlapping with prior phase)
- [ ] User stories follow "As a {role}" format
- [ ] Features have Before/After code snippets
- [ ] Files Changed table lists every file touched
- [ ] Effort table with individual task estimates
- [ ] No TODO placeholders left in the doc
-->

---
