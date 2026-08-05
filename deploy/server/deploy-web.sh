#!/bin/bash
# Build and reload the web app (apps/web) on the production host.
# The caller is responsible for updating the git checkout BEFORE running this
# script (so the script file itself is not rewritten mid-execution).
set -euo pipefail

REPO_DIR="${REPO_DIR:-/root/compify}"
APP_DIR="$REPO_DIR/apps/web"
APP_NAME="compify-front"
HEALTH_URL="http://localhost:3000"
BACKUP_DIR="$APP_DIR/.deploy-backup"
MAX_RETRIES=30
RETRY_INTERVAL=2

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [web] $1"; }

cd "$APP_DIR"

if [ -d .next ]; then
    log "Backing up current build..."
    rm -rf "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -r .next "$BACKUP_DIR/.next"
fi

rollback() {
    log "Rolling back to previous build..."
    if [ -d "$BACKUP_DIR/.next" ]; then
        rm -rf .next
        cp -r "$BACKUP_DIR/.next" .next
        pm2 reload "$APP_NAME"
    fi
    exit 1
}

log "Installing dependencies..."
yarn install --frozen-lockfile

log "Building..."
yarn build || rollback

# pm2 reload keeps the process's original cwd/script path, so if the app was
# registered from a different checkout it must be re-registered, not reloaded.
CURRENT_CWD=$(pm2 jlist 2>/dev/null | node -e "
  const list = JSON.parse(require('fs').readFileSync(0, 'utf8') || '[]');
  const app = list.find((p) => p.name === '$APP_NAME');
  console.log(app ? app.pm2_env.pm_cwd || '' : '');
")

if [ "$CURRENT_CWD" = "$APP_DIR" ]; then
    log "Reloading $APP_NAME..."
    pm2 reload ecosystem.config.js --wait-ready
else
    log "Registering $APP_NAME from $APP_DIR (was: '${CURRENT_CWD:-none}')..."
    pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
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
