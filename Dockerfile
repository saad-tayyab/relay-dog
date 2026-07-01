# Dockerfile

# Stage 1: Install and build
FROM oven/bun:1.3.14-slim AS builder
WORKDIR /app

# Install deps first (layer caching)
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/env/package.json packages/config/env/
COPY packages/config/tsconfig/package.json packages/config/tsconfig/
RUN bun install --frozen-lockfile

# Copy source and build with Turbo
COPY . .
RUN bunx turbo build --filter=@relayscope/api

# Stage 2: Production
FROM oven/bun:1.3.14-slim AS production
WORKDIR /app

# Non-root user
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home appuser

# Copy only what's needed — Bun bundles all imports into dist/index.js,
# so no node_modules required at runtime
COPY --from=builder /app/apps/api/dist ./dist

# Health check (for local docker run and Docker Compose health checks)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3001/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

USER appuser
EXPOSE 3001

CMD ["bun", "run", "dist/index.js"]
