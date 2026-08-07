# Contributing

## Setup

Install Bun 1.3.9. Do not use npm, Yarn, or pnpm in this repository.

1. `git clone git@github.com:kubet/compify.git`
2. Frontend: `cd apps/web && bun install --frozen-lockfile && cp .env.example .env && bun run dev`
3. API: `cd apps/api && bun install --frozen-lockfile && cp .env.example .env.stage.local && bun run start:dev`
   (needs local PostgreSQL and MinIO; see `.env.example` for what to fill in)

## Rules

- Keep PRs focused — one change per PR.
- CI must pass (`bun run build` in the app you touched).
- No secrets in code or config — everything sensitive comes from env vars.
- Match the existing code style of the file you are editing.

## Deploys

Merging to `main` deploys automatically via GitHub Actions (path-filtered:
only the app you changed is redeployed). `workflow_dispatch` on the Deploy
workflow lets you force a full redeploy.
