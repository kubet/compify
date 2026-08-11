# Contributing

## Setup

Install Bun 1.3.9. Do not use npm, Yarn, or pnpm in this repository.

1. `git clone https://github.com/kubet/compify.git` (or use the SSH URL if your GitHub SSH key is configured)
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

The repository retains workflows for frozen Bun installs, builds, tests,
dependency and secret audits, CodeQL, migration checks, and a real Docker
Compose product smoke test. Hosted GitHub Actions execution is currently
disabled for cost control, so contributors must run the relevant workflow
commands locally and include the results in their PR. Maintainers must
explicitly re-enable Actions before relying on a hosted check or trusted npm
publication. Hosted Compify production deployment is intentionally maintained
outside this public repository.

## Inbound licensing

By submitting a contribution, you confirm that you have the right to submit it.
Original contributions are submitted under the license identified by the
nearest applicable notice: normally `AGPL-3.0-only`, while contributions to the
vendored Sandpack derivative in `packages/compify-pack` remain Apache-2.0 and
must preserve upstream notices and document material modifications. The
Apache-2.0 `examples/external-react-uswds-button` fixture accepts only verified,
byte-identical upstream refreshes or non-copyrightable metadata corrections;
ordinary original feature work does not belong in that fixture.

Compify may also be offered under separately signed commercial terms. To avoid
promising commercial relicensing rights the project does not own, maintainers
must not merge an external copyrightable contribution until the contributor has
completed a separately reviewed contributor agreement granting the necessary
rights. No such additional rights arise merely by opening a pull request. Ask
**hello@compify.app** before investing in a substantial contribution. Automated
dependency metadata and non-copyrightable corrections are reviewed case by
case.

See `LICENSING.md` for scope, third-party exceptions, and the prospective
MIT-to-AGPL transition boundary. Authorship remains recorded in Git history.
