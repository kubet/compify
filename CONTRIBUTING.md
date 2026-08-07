# Contributing

## Setup

Install Bun 1.3.9. Do not use npm, Yarn, or pnpm in this repository.

1. `git clone git@github.com:kubet/compify.git`
2. Frontend: `cd apps/web && bun install --frozen-lockfile && cp .env.example .env && bun run dev`
3. API: `cd apps/api && bun install --frozen-lockfile && cp .env.example .env.stage.local && bun run start:dev`
   (needs local PostgreSQL and MinIO; see `.env.example` for what to fill in)

## Rules

- Keep PRs focused — one change per PR.
- CI must pass for every package you touch; run its build, tests, and `bun audit` locally.
- No secrets or hosted-production infrastructure details in code, issues, logs, or config.
- Add regression coverage for behavior and security changes.
- Match the existing code style of the file you are editing.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Dependency updates

Use `bun add`, `bun update`, or `bun remove` from the affected package directory
and commit both `package.json` and `bun.lock`. Package-only dependency changes
that do not regenerate the Bun lockfile cannot be merged. GitHub Dependabot is
therefore limited to GitHub Actions; vulnerability alerts and CI audits identify
application dependency work that maintainers apply with Bun.

## Validation

CI runs frozen Bun installs, builds, tests, dependency and secret audits,
CodeQL, migration checks, and a real Docker Compose product smoke test. Hosted
Compify production deployment is intentionally maintained outside this public
repository.
