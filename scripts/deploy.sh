#!/bin/bash
# scripts/deploy.sh
# Deploy relay-dog to production VM
# Usage: DEPLOY_HOST=x.x.x.x DEPLOY_USER=ubuntu ./scripts/deploy.sh
set -euo pipefail

REMOTE_HOST="${DEPLOY_HOST:?Set DEPLOY_HOST}"
REMOTE_USER="${DEPLOY_USER:-ubuntu}"
REMOTE_DIR="/opt/relay-dog"
BACKUP_DIR="/opt/backups/relay-dog"

# ─── Deploy Lock ───
LOCK_FILE="/tmp/relay-dog-deploy.lock"
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "❌ Another deploy is already running (lock: $LOCK_FILE)"
  exit 1
fi

echo "🚀 Deploying relay-dog to ${REMOTE_HOST}..."

# ─── Step 1: Push local changes ───
echo "📦 Pushing code..."
git push origin production

# ─── Step 2: SSH and deploy ───
echo "🔧 Deploying on VM..."
ssh -o StrictHostKeyChecking=accept-new ${REMOTE_USER}@${REMOTE_HOST} << DEPLOY
set -euo pipefail
cd ${REMOTE_DIR}

# ─── 2a: Backup database (always, before any change) ───
echo "💾 Backing up database..."
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
mkdir -p ${BACKUP_DIR}
docker compose exec -T db pg_dump -U postgres relayscope | gzip > ${BACKUP_DIR}/pre-deploy_\${TIMESTAMP}.sql.gz
echo "   Backup: pre-deploy_\${TIMESTAMP}.sql.gz"

# ─── 2b: Pull latest code ───
echo "📦 Pulling latest code..."
PREVIOUS_COMMIT=\$(git rev-parse HEAD)
git pull origin production
NEW_COMMIT=\$(git rev-parse HEAD)
echo "   Previous: \$PREVIOUS_COMMIT"
echo "   New:      \$NEW_COMMIT"

if [ "\$PREVIOUS_COMMIT" = "\$NEW_COMMIT" ]; then
  echo "⚠️  No new commits — nothing to deploy"
  exit 0
fi

# ─── 2c: Build new images (old containers keep running during build) ───
echo "🔨 Building new images..."
docker compose build

# ─── 2d: Swap containers (minimal downtime) ───
echo "🔄 Swapping containers..."
docker compose up -d --remove-orphans

# ─── 2e: Wait for DB to be healthy ───
echo "⏳ Waiting for database..."
timeout 60 bash -c 'until docker compose exec -T db pg_isready -U postgres -q 2>/dev/null; do sleep 2; done'

# ─── 2f: Run migrations ───
echo "📦 Running database migrations..."
docker compose exec -T api bun run db:migrate

# ─── 2g: Verify health ───
echo "🏥 Checking health..."
for i in \$(seq 1 12); do
  STATUS=\$(curl -sf http://localhost:3001/api/health | jq -r '.status' 2>/dev/null || echo "unreachable")
  if [ "\$STATUS" = "ok" ]; then
    echo "✅ Deployment successful — API healthy"
    break
  fi
  echo "   Waiting for API... (attempt \$i/12)"
  sleep 5
done

if [ "\$STATUS" != "ok" ]; then
  echo "❌ Deployment failed — API status: \$STATUS"
  echo ""
  echo "🔄 Rolling back to \$PREVIOUS_COMMIT..."
  git checkout \$PREVIOUS_COMMIT
  docker compose build
  docker compose up -d --remove-orphans
  echo "⚠️  Code rolled back. If migration ran, database may need manual restore:"
  echo "   gunzip < ${BACKUP_DIR}/pre-deploy_\${TIMESTAMP}.sql.gz | docker compose exec -T db psql -U postgres relayscope"
  exit 1
fi

# ─── 2h: Clean up old images ───
docker image prune -f
DEPLOY

echo "✅ Deploy complete"
