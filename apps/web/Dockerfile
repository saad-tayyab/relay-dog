# apps/web/Dockerfile

# Stage 1: Build Svelte app
FROM oven/bun:1.3.14-slim AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/env/package.json packages/config/env/
COPY packages/config/tsconfig/package.json packages/config/tsconfig/
RUN bun install --frozen-lockfile

COPY . .
RUN bunx turbo build --filter=@relayscope/web

# Stage 2: Static files only
FROM nginx:alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# SPA fallback — all routes → index.html
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    # Cache static assets\n\
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80
