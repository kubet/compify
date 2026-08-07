# Open-source release readiness

_Last reviewed: 2026-08-07 against `main`._

## Executive summary

Compify is open-source under MIT, with the vendored Sandpack derivative retaining Apache-2.0. The main applications build, and a fresh single-host installation can now provision web, API, PostgreSQL, MinIO, buckets, schema, and seed data through Docker Compose. The public registry, CLI, MCP server, CI, security policy, and operational documentation also exist.

Treat self-hosting as beta until the remaining P0 items are complete—most importantly removal of hosted CDN/bundler dependencies, stronger manifest/removal semantics, broader end-to-end tests, and a clean full-image smoke test in CI.

## Progress since the audit

The first hardening pass is now implemented: Docker Compose and non-root images,
MinIO bucket initialization, an initial reviewed-and-executed TypeORM migration,
a deterministic free-plan seed, startup configuration validation, optional
Stripe/Google/email integrations, self-host URL controls, hashed single-use
password resets, hashed CLI tokens, path traversal defenses, CLI/API tests, and
vendored Sandpack provenance. The remaining unchecked items below are still real
release work rather than claims that those areas are finished.

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

- [x] **Reproducible installation:** pinned non-root Dockerfiles and Compose now provision web, API, PostgreSQL, MinIO, buckets, migrations, and seed data. A full clean-image smoke test still belongs in CI.
- [ ] **Migration rollout:** production synchronization is disabled and the tested initial migration includes extensions/indexes/schema/seed. Docker runs it before startup; the legacy PM2 deployment still needs an explicit baseline and run-once rollout procedure before it can execute migrations safely.
- [ ] **Bootstrap policy hardening:** Compose idempotently creates all buckets and migrations create extensions plus a deterministic free plan. Still replace shared MinIO root credentials with least-privilege application credentials and document bucket CORS/policies.
- [x] **Configuration contract:** core environment variables are validated at startup; Stripe, Google OAuth, and transactional email no longer crash startup when disabled and return explicit 503 responses when invoked unconfigured.
- [ ] **Remove hosted-service coupling:** API/web/CLI/CDN origins and the service worker are configurable, but a fully independent operator must still supply licensed editor CDN assets and any required bundler behavior. Inventory, provenance, and an open redistribution package remain outstanding.
- [ ] **Component install manifest:** API and CLI reject traversal/symlink paths, lifecycle commands share normalized folders, and removal no longer recursively deletes inferred folders. Still persist exact installed files/layout/source/hash in `compify.json` so removal never depends on mutable remote metadata.
- [ ] **Browser auth/CSP:** the identified UtilityInput, TooltipHelp, and Notion HTML sinks are escaped or rendered as text. JWTs still need migration from localStorage to Secure/HttpOnly/SameSite cookies plus a restrictive CSP.
- [ ] **Finish token lifecycle:** password resets are random, hashed, email-bound, expiring and atomically single-use; CLI tokens are hashed and only shown at creation. Add CLI expiry/rotation policy and invalidate existing sessions after password resets.
- [x] **Protect template secrets:** the Notion credential is server-only and Notion-controlled HTML/text/URLs are escaped and scheme-checked.
- [x] **CLI baseline correctness:** lifecycle commands normalize folders consistently, missing files are diffs, failures surface, login validates tokens, and `COMPIFY_TOKEN` supports headless use. Exact-file manifest/version semantics remain a separate gate above.
- [ ] **Contract/e2e tests:** cover auth, component visibility, `/cli`, `/r`, path safety, install/diff/migrate/remove, and a CLI-to-API fixture. Run tests—not only builds—in CI.
- [ ] **License provenance and SBOM:** Sandpack now retains Apache-2.0 plus an honest import/provenance record. Still generate a repository-wide third-party notice/SBOM and review templates, assets, fonts, and dependency licenses.

### P1 — required before a stable 1.0

- [ ] Publish the repository CLI version (local is newer than npm at review time), automate npm provenance/release notes, add `engines`, repository/homepage/bugs metadata, and define supported Node/OS/keychain platforms.
- [ ] Version immutable component publishes and record source URL, version/hash, installed layout, and files in the manifest. Current migrations pull mutable latest content.
- [x] Reconcile the major CLI docs/behavior gaps: bare `add` now selects interactively, `list` lists without installing, and JSON/silent behavior is explicit. Generated reference docs remain desirable.
- [ ] Add OpenAPI with versioned API compatibility and error schemas. Define deprecation and CLI/server compatibility policy.
- [x] Keep `/health` as liveness and use `/ready` for PostgreSQL and required MinIO bucket readiness; deployments now gate on readiness.
- [ ] Use immutable deployment artifacts/releases. Current rollback restores build output only, not dependencies, source, environment, or schema.
- [x] Fix CI/deploy dependency paths: `packages/compify-pack` changes now trigger web validation and deployment.
- [ ] Create a tested upgrade, backup, and disaster-recovery runbook. Add checksums/encryption, consistent object snapshots, retention based on bucket listings, monitoring, and scheduled restore drills.
- [ ] Add dependency auditing, CodeQL/SAST, branch protection, CODEOWNERS, issue/PR templates, changelog, release workflow, and signed/provenance artifacts.

### P2 — project maturity

- [ ] Workspace-level commands for install/build/test/lint/typecheck. Bun 1.3.9 is pinned per package and each package commits its own lockfile.
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

- `apps/api`: `bun run build` passed; `bun run test --runInBand` passed (8 suites, 60 tests).
- `apps/web`: `bun run build` passed.
- `packages/cli`: `bun run build` and 14 configuration/API/path-safety tests passed. `packages/compify-pack`: `bun install --frozen-lockfile` and its prepare build passed.
- Deployment shell scripts passed syntax review in the parallel deployment audit.

A release should repeat these checks from a clean clone in CI and add an actual Compose/self-host smoke test before changing the self-host support claim.
