#!/bin/bash
# Nightly backup of the compify database and MinIO data.
# Local: /root/backups (14 days). Offsite: Supabase Storage via REST (port 443,
# the only egress that works — the host blocks outbound 5432/6543), enabled
# when /root/.backup-secrets defines SUPABASE_URL and SUPABASE_SERVICE_KEY.
# Cron entry: see deploy/server/README.md.
set -euo pipefail

BACKUP_DIR="/root/backups"
SECRETS_FILE="/root/.backup-secrets"
STAMP=$(date +%Y%m%d-%H%M)
KEEP_DAYS=14

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

mkdir -p "$BACKUP_DIR"

DB_FILE="compify-db-$STAMP.sql.gz"
MINIO_FILE="compify-minio-$STAMP.tar.gz"

sudo -u postgres pg_dump compify | gzip > "$BACKUP_DIR/$DB_FILE"
tar -czf "$BACKUP_DIR/$MINIO_FILE" -C /mnt/data minio
find "$BACKUP_DIR" -name 'compify-*' -mtime +$KEEP_DAYS -delete
log "local backup done: $DB_FILE ($(du -h "$BACKUP_DIR/$DB_FILE" | cut -f1)), $MINIO_FILE ($(du -h "$BACKUP_DIR/$MINIO_FILE" | cut -f1))"

# ---------- offsite mirror (Supabase Storage) ----------
if [ ! -f "$SECRETS_FILE" ]; then
    log "offsite mirror skipped: $SECRETS_FILE not found"
    exit 0
fi
# shellcheck source=/dev/null
source "$SECRETS_FILE"
if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then
    log "offsite mirror skipped: SUPABASE_URL / SUPABASE_SERVICE_KEY not set"
    exit 0
fi

AUTH=(-H "Authorization: Bearer $SUPABASE_SERVICE_KEY" -H "apikey: $SUPABASE_SERVICE_KEY")

# Ensure the bucket exists (409/400 duplicate is fine).
curl -sf -o /dev/null -X POST "$SUPABASE_URL/storage/v1/bucket" \
    "${AUTH[@]}" -H "Content-Type: application/json" \
    -d '{"id":"backups","name":"backups"}' || true

upload() {
    local file="$1"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "$SUPABASE_URL/storage/v1/object/backups/$file" \
        "${AUTH[@]}" -H "Content-Type: application/gzip" -H "x-upsert: true" \
        --data-binary @"$BACKUP_DIR/$file")
    if [ "$code" = "200" ]; then
        log "offsite upload ok: $file"
    else
        log "offsite upload FAILED ($code): $file"
        return 1
    fi
}

upload "$DB_FILE"
upload "$MINIO_FILE"

# Prune remote copies older than the retention window. Cron runs at a fixed
# time, so names are deterministic per day; sweep a few extra days to self-heal.
HHMM=$(date +%H%M)
for age in $(seq $((KEEP_DAYS + 1)) $((KEEP_DAYS + 7))); do
    OLD=$(date -d "-$age days" +%Y%m%d)
    for prefix in compify-db compify-minio; do
        for ext in sql.gz tar.gz; do
            curl -s -o /dev/null -X DELETE \
                "$SUPABASE_URL/storage/v1/object/backups/$prefix-$OLD-$HHMM.$ext" \
                "${AUTH[@]}" || true
        done
    done
done

log "offsite mirror done"
