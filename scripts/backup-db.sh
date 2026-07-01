#!/bin/bash
# scripts/backup-db.sh
# Daily Postgres backup with 7-day rotation
set -euo pipefail

BACKUP_DIR="/opt/backups/relay-dog"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/relayscope_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Dump and compress
docker compose exec -T db pg_dump -U postgres relayscope | gzip > "$BACKUP_FILE"

# Validate backup: must be non-empty and valid gzip
if [ ! -s "$BACKUP_FILE" ]; then
  echo "$(date -Iseconds) ERROR: Backup file is empty: $BACKUP_FILE" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "$(date -Iseconds) ERROR: Backup file is corrupt (invalid gzip): $BACKUP_FILE" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Keep only last 7 daily backups
ls -t "$BACKUP_DIR"/relayscope_*.sql.gz | tail -n +8 | xargs -r rm

echo "$(date -Iseconds) Backup completed: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# ─── Off-site backup (optional) ───
# To protect against VM loss, add an rclone/scp step here:
#   rclone copy "$BACKUP_FILE" remote:relay-dog-backups/ --progress
# or:
#   scp "$BACKUP_FILE" backup-server:/backups/relay-dog/
