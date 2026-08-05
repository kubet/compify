# Contributing

## Setup

1. `git clone git@github.com:kubet/compify.git`
2. Frontend: `cd apps/web && yarn && cp .env.example .env && yarn dev`
3. API: `cd apps/api && yarn && cp .env.example .env.stage.local && yarn start:dev`
   (needs local PostgreSQL and MinIO; see `.env.example` for what to fill in)

## Rules

- Keep PRs focused — one change per PR.
- CI must pass (`yarn build` in the app you touched).
- No secrets in code or config — everything sensitive comes from env vars.
- Match the existing code style of the file you are editing.

## Deploys

Merging to `main` deploys automatically via GitHub Actions (path-filtered:
only the app you changed is redeployed). `workflow_dispatch` on the Deploy
workflow lets you force a full redeploy.
