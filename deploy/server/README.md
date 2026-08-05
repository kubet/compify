# Server deployment

Production host runs the apps under pm2 from the `/root/compify` checkout.
Deploys are triggered by the Deploy workflow (push to `main`), which updates
the checkout and runs `deploy-api.sh` / `deploy-web.sh` (path-filtered).

Each script: `yarn install --frozen-lockfile` → build → pm2 reload (or
re-register if the app was running from a different directory) → health check
→ rollback to the previous build on failure.

## Env files (not in git)

- `apps/api/.env.stage.prod`
- `apps/web/.env`

Both must define the same `INTERNAL_API_TOKEN`.

## Backups

`backup.sh` dumps PostgreSQL and tars the MinIO data dir into `/root/backups`
nightly, keeping 14 days. Cron entry:

```
0 4 * * * bash /root/compify/deploy/server/backup.sh >> /root/backups/backup.log 2>&1
```
