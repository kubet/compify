# Open-source release readiness

_Last reviewed: 2026-08-07 against `main`._

## Executive summary

Compify is source-available under MIT today and its three main applications build. The public shadcn registry, CLI, MCP server, contributor/security files, secret scanning, dependency updates, and production deployment scripts already exist. It is **not yet a turnkey self-hosted product**: the checked-in deployment describes compify.app's existing server, while a fresh operator still needs undocumented infrastructure, seed data, external assets, and manual database/storage setup.

Treat the repository as an open beta for contributors, not a supported self-host distribution, until the P0 gate below is complete.

## What is already here

- MIT root license plus `license: MIT` package metadata.
- Next.js web app, NestJS API, PostgreSQL entities, MinIO object storage, and editor package.
- Public shadcn endpoints (`/r/registry.json`, `/r/{user}/{name}.json`).
- `@compify/cli`, including add/diff/migrate/remove and a stdio MCP server.
- CI builds web/API/CLI, tests API/CLI, runs gitleaks, and Dependabot covers the main applications.
- Focused API usage-reset and registry-path tests (45 passing at review time).
- PM2 deployment with health checks and build rollback, plus local/offsite backup scripts.
- `README`, `CONTRIBUTING`, `SECURITY`, product, CLI, registry, publishing, and MCP documentation.
- Basic self-host URL selection: web uses `NEXT_PUBLIC_API_URL`; CLI uses `--api-url`, `--web-url`, `COMPIFY_API_URL`, and `COMPIFY_WEB_URL`; API registry links use `FRONTEND_URL`.

## Release gate

### P0 — required before calling it self-hostable

- [ ] **Reproducible installation:** add pinned Dockerfiles and Compose (or an equally complete install path) for web, API, PostgreSQL, MinIO, bucket initialization, and any required bundler/static assets. Include a one-command smoke test.
- [ ] **Real migrations:** replace production `synchronize: true` in `apps/api/src/app.module.ts` with versioned TypeORM migrations. Run migrations once before workers start; document forward/rollback compatibility. Convert `src/migrations/extention.md` into an actual migration.
- [ ] **Bootstrap data and storage:** idempotently create the four MinIO buckets and required policies/CORS, PostgreSQL database/extensions, and the free subscription plan. Do not require operators to invent `FREE_PLAN_ID`.
- [ ] **Configuration contract:** validate environment variables at startup with required/optional/default semantics. Optional AI, OAuth, email, Turnstile, and billing integrations must be conditionally enabled. Stripe currently constructs at startup even when documented as optional.
- [ ] **Remove hosted-service coupling:** replace remaining hard-coded `compify.app`, `api.compify.app`, and `cdn.compify.app` runtime references. Document or ship the editor's CDN files and capture/bundler service. Static `public/service-worker.js` needs generated runtime configuration.
- [ ] **Secure component paths:** reject absolute and traversal paths from stored component files before CLI writes/removes them or registry items expose them. Persist the actual installed file list/layout in `compify.json`; never recursively delete an inferred folder containing user files.
- [ ] **Close web/template XSS sinks:** replace raw `dangerouslySetInnerHTML` flows in `UtilityInput`, `TooltipHelp`, and the Notion template with escaped React rendering or reviewed sanitization. Move browser auth away from localStorage to Secure/HttpOnly/SameSite cookies and add a CSP.
- [ ] **Harden reset and bearer tokens:** the reset lookup is now bound to normalized email, but tokens still need hashed, atomic single-use storage and regression tests. Hash CLI tokens at rest, add expiry/rotation, and invalidate sessions after password resets.
- [ ] **Protect template secrets:** rename `NEXT_PUBLIC_NOTION_SECRET` to a server-only variable and ensure the Notion client cannot enter browser bundles.
- [ ] **CLI correctness:** use the same normalized directory name in add/diff/migrate/remove; make missing files count as diffs; surface fetch/auth failures; validate login tokens. Add headless auth (environment/file) in addition to keytar.
- [ ] **Contract/e2e tests:** cover auth, component visibility, `/cli`, `/r`, path safety, install/diff/migrate/remove, and a CLI-to-API fixture. Run tests—not only builds—in CI.
- [ ] **License provenance:** document the origin/commit and retained notices for the vendored Sandpack fork and templates/assets/fonts; generate a third-party notice/SBOM and review dependency licenses.

### P1 — required before a stable 1.0

- [ ] Publish the repository CLI version (local is newer than npm at review time), automate npm provenance/release notes, add `engines`, repository/homepage/bugs metadata, and define supported Node/OS/keychain platforms.
- [ ] Version immutable component publishes and record source URL, version/hash, installed layout, and files in the manifest. Current migrations pull mutable latest content.
- [ ] Reconcile CLI docs with behavior: bare `add`, `list`, universal non-interactive claims, and advertised flags currently diverge. Generate reference docs from Commander where possible.
- [ ] Add OpenAPI with versioned API compatibility and error schemas. Define deprecation and CLI/server compatibility policy.
- [ ] Replace superficial `/health` with separate liveness/readiness checks for DB, MinIO, config, and migrations.
- [ ] Use immutable deployment artifacts/releases. Current rollback restores build output only, not dependencies, source, environment, or schema.
- [ ] Fix CI/deploy dependency paths: web consumes `packages/compify-pack`, but changes there do not trigger the web job/deploy.
- [ ] Create a tested upgrade, backup, and disaster-recovery runbook. Add checksums/encryption, consistent object snapshots, retention based on bucket listings, monitoring, and scheduled restore drills.
- [ ] Add dependency auditing, CodeQL/SAST, branch protection, CODEOWNERS, issue/PR templates, changelog, release workflow, and signed/provenance artifacts.

### P2 — project maturity

- [ ] Workspace-level commands for install/build/test/lint/typecheck; lock the package manager and runtime versions.
- [ ] Lint/typecheck/coverage gates for all packages; remove build-time network calls (the web sitemap currently contacts the API during build and logs an error offline).
- [ ] Structured request/audit logs, error tracking, metrics/traces, log rotation, uptime/dependency/disk alerts, and an operator dashboard.
- [ ] Multi-architecture images, Kubernetes/Helm examples if demanded, external S3-compatible storage support, documented reverse proxy/TLS, and horizontal scaling guidance.
- [ ] Governance: maintainer model, support policy, roadmap/issues, code of conduct, contribution test fixtures, and a public release/security response cadence.

## Known contradictions found during review

- Development API is port **3009** (`main.ts` and web config); older top-level docs said 3091, which is the PM2 production port.
- `.env.example` formerly documented `JWT_SECRET`, while JWT signing consumed `NEST_JWT_SECRET`; code now consistently uses `JWT_SECRET`.
- CLI docs say every command is non-interactive and bare `compify add` opens a picker; current implementation does not satisfy both claims.
- Product docs describe MCP as “next,” but the command is already implemented; npm still needs a coordinated publish.
- Production docs call several integrations optional, but modules are registered unconditionally.

## Verification performed

On the review machine:

- `apps/api`: `yarn build` passed; `yarn test --runInBand` passed (3 suites, 45 tests).
- `apps/web`: `yarn build` passed, but its sitemap attempted a production API request and logged an error before completing.
- `packages/cli`: `yarn build` and 10 new configuration/path-safety tests passed.
- Deployment shell scripts passed syntax review in the parallel deployment audit.

A release should repeat these checks from a clean clone in CI and add an actual Compose/self-host smoke test before changing the self-host support claim.
