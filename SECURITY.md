# Security Policy

## Reporting a vulnerability

Please email **hello@compify.app** with details. Do not open a public issue
for security problems. You should get a response within a few days.

## Scope

- compify.app, api.compify.app, cdn.compify.app
- This repository (apps/web, apps/api, packages/*)

## Notes for contributors

- Never commit secrets — all credentials come from env vars (`.env*` files are
  gitignored; see the `.env.example` files).
- CI runs a gitleaks scan on every PR; a failing scan blocks merge.
