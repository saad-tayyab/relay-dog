# 🤝 Contributing to Relay Scope

Thanks for your interest in contributing! This document provides a quick overview.

For full details, see the [Contributing Guide](docs/development/contributing.md).

## Quick Start

```bash
# 1. Fork and clone
git clone <your-fork-url>
cd relayscope

# 2. Install dependencies
bun install

# 3. Create a branch
git checkout -b feat/my-feature main

# 4. Make changes and verify
npx turbo type-check
npx turbo build

# 5. Commit (Conventional Commits)
git commit -m "feat(web): add my feature"

# 6. Push and create PR
git push -u origin feat/my-feature
```

## Commit Format

```
<type>(<scope>): <description>
```

**Types**: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

**Examples**:
```
feat(web): add live event stream viewer
fix(api): handle WebSocket timeout gracefully
docs: update API endpoint examples
```

## Need Help?

- 📖 Read the [Development Setup](docs/development/setup.md)
- 📏 Follow the [Style Guide](docs/development/style-guide.md)
- 🐛 Report bugs by opening an issue
