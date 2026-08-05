#!/bin/bash
# Nightly backup of the compify database and MinIO data.
# Installed as a cron job (see deploy/server/README.md). Keeps 14 days.
set -euo pipefail

BACKUP_DIR="/root/backups"
STAMP=$(date +%Y%m%d-%H%M)
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

sudo -u postgres pg_dump compify | gzip > "$BACKUP_DIR/compify-db-$STAMP.sql.gz"
tar -czf "$BACKUP_DIR/compify-minio-$STAMP.tar.gz" -C /mnt/data minio

find "$BACKUP_DIR" -name 'compify-*' -mtime +$KEEP_DAYS -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] backup done: $(ls -lh $BACKUP_DIR | tail -2 | awk '{print $9, $5}' | tr '\n' ' ')"
