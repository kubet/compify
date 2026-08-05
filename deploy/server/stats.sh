#!/bin/bash
# Weekly platform stats digest. Cron (Mondays 08:00):
#   0 8 * * 1 bash /root/compify/deploy/server/stats.sh >> /root/compify-stats.log 2>&1
set -euo pipefail

cd /tmp
echo "===== compify stats $(date '+%Y-%m-%d %H:%M') ====="
sudo -u postgres psql -t -A -F': ' compify << 'SQL'
SELECT 'users total', count(*) FROM "user";
SELECT 'users last 7d', count(*) FROM "user" WHERE "createdAt" > now() - interval '7 days';
SELECT 'components total', count(*) FROM component;
SELECT 'components last 7d', count(*) FROM component WHERE "createdAt" > now() - interval '7 days';
SELECT 'published (public+free)', count(*) FROM component WHERE visibility IN ('public','free');
SELECT 'upvotes total', count(*) FROM upvote;
SELECT 'cli tokens', count(*) FROM cli_token;
SELECT 'cli tokens used last 7d', count(*) FROM cli_token WHERE "lastUsedAt" > now() - interval '7 days';
SQL
echo
