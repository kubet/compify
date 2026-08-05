#!/bin/bash
# Build and reload the api app (apps/api) on the production host.
# The caller is responsible for updating the git checkout BEFORE running this
# script (so the script file itself is not rewritten mid-execution).
set -euo pipefail

REPO_DIR="${REPO_DIR:-/root/compify}"
APP_DIR="$REPO_DIR/apps/api"
APP_NAME="compify-back"
HEALTH_URL="http://localhost:3091/health"
BACKUP_DIR="$APP_DIR/.deploy-backup"
MAX_RETRIES=30
RETRY_INTERVAL=2

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [api] $1"; }

cd "$APP_DIR"

if [ -d dist ]; then
    log "Backing up current build..."
    rm -rf "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -r dist "$BACKUP_DIR/dist"
fi

rollback() {
    log "Rolling back to previous build..."
    if [ -d "$BACKUP_DIR/dist" ]; then
        rm -rf dist
        cp -r "$BACKUP_DIR/dist" dist
        pm2 reload "$APP_NAME"
    fi
    exit 1
}

log "Installing dependencies..."
yarn install --frozen-lockfile

log "Building..."
yarn build || rollback

if pm2 list | grep -q "$APP_NAME"; then
    log "Reloading $APP_NAME..."
    pm2 reload ecosystem.config.js --wait-ready
else
    log "Starting $APP_NAME..."
    pm2 start ecosystem.config.js
fi

log "Health check..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf "$HEALTH_URL" > /dev/null; then
        log "Healthy."
        pm2 save
        exit 0
    fi
    sleep $RETRY_INTERVAL
done

log "Health check failed."
rollback
