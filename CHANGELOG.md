# Changelog

All notable changes to Compify will be documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project follows [Semantic Versioning](https://semver.org/) for public packages
and compatibility contracts.

## [Unreleased]

The `0.3.0` CLI and `0.2.0` Storybook addon manifests below are AGPL
source candidates. This section does not represent a tag or package publication.

### Changed

- Original Compify code in repository states containing the new notice is now offered under `AGPL-3.0-only`, with a truthful prospective boundary for earlier MIT-licensed copies, preserved third-party exceptions, an explicit exact-revision network-source-offer mechanism, and separately negotiated commercial licensing availability.
- Replaced the bundled Sustainable Use License server emulator with a verified
  Apache-2.0 browser-runtime/static Sandpack client subset; server-backed
  templates now fail closed and artifact gates prove the former implementation
  is absent.

### Added

- Release candidates `@compify/cli@0.3.0` and `@compify/storybook@0.2.0`; package publication remains a separate, explicit release action.
- Storybook-first CLI commands to statically inspect React CSF, export a validated shadcn registry item, and publish a reviewed component graph to a configured Compify API.
- A renderer-neutral `@compify/storybook` manager addon for explicit portability, registry, install, and preview metadata.
- Bearer-authenticated `POST /cli/publish-story` with deterministic digests, provenance, strict file/path/content limits, and public, unlisted, or private visibility.
- Storybook product-market-fit research, falsification criteria, adoption measures, documentation, and first-class CI coverage.
- Explicit `--story <export-name>` selection, a zero-account golden fixture, and packed-CLI release validation.
- A pinned shadcn 4.16.2 → clean Next.js 15.5.23 production-build gate, compatibility matrix, ecosystem/cloud strategy, governance, and support policy.
- A licensed, checksummed `react-uswds` Button fixture provides qualified external static-inspect, native-install, exact-source, dependency-range, and destination-build evidence while explicitly excluding upstream preview styling and visual fidelity.
- Owner-authenticated private registry items through standard shadcn namespace Bearer headers.
- Fail-closed static support for the basic CSF Next `preview.meta` / `meta.story` factory form.
- Published Storybook registry responses preserve the reviewed source paths and Compify digest/provenance metadata instead of applying legacy editor remapping.
- `storybook handoff` performs a pinned native shadcn install and optional destination build in a separate app, then emits a digest-signed local `installed`/`built` evidence receipt.
- Deterministic explainable source-graph evidence records normalized file hashes, import edges, resolution reasons, unresolved edges, and inclusion chains without changing artifact digests.
- Bounded exact in-package tsconfig/baseUrl/path and package-import alias support rewrites accepted specifiers to consumer-usable relative imports; quoted stylesheet module edges are followed.
- Publish schema v2 preserves the complete text registry-item semantic object and supports repeatable numbered, digest-addressed immutable revisions while retaining the v1 reader path.
- Real-stack browser, registry lifecycle, private native-shadcn install/build, migration-restart and token-revocation E2E gates.

### Changed

- Direct shadcn registry installation is now the primary publish and component-detail workflow.
- Self-hosted Google OAuth and Turnstile capabilities are explicitly paired and disabled by default; missing Sandpack infrastructure now fails closed instead of pointing to a nonexistent bundled service.
- Unlisted components remain directly installable but are excluded from the registry index.
- The public landing page, navigation, metadata, and package documentation now lead with the review-first Storybook workflow and its limits instead of unsupported marketplace or productivity claims.
- Password-reset validation and editor file-tab keyboard/accessibility behavior were hardened.
- The overlapping Compify registry MCP is now compatibility-only and deprecated in favor of official Storybook and shadcn agent surfaces.
- Unimplemented hard-coded project routes were removed rather than presenting sample state as a working OSS feature.
- The optional legacy browser-editor recording is labeled separately from the evidence-backed Storybook distribution workflow.
- Registry items preserve reviewed npm dependency specifiers instead of silently resolving every dependency from an unqualified package name; workspace, local, and remote-source specs fail portability checks.

### Security

- CLI token validation now prevents stored token digests from being replayed as credentials.
- Storybook publication rejects traversal and symlink escapes, secret-like files, private keys, invalid text, oversized artifacts, case-colliding paths, undeclared runtime dependencies, and nonportable dynamic story arguments.
- Failed source-object uploads compensate newly created component rows instead of reserving orphaned publishing domains.
- Private component image/vote IDOR paths, pre-authorization OG mutation, malformed short-ID 500s, password-reset account enumeration, email-change token replay/expiry, poisoned login forwards, and auth-network error handling were hardened.
- Release CI enforces digest-pinned container images, SHA-pinned Actions, private-package allowlisting, reproducible npm tarballs, protected OIDC provenance and no token fallback.
- Per-domain advisory serialization and bounded immutable-revision storage prevent concurrent revision corruption and authenticated storage exhaustion.
- Publishing-name availability is confined to the authenticated user's namespace, and handoff consumer snapshots are bounded, no-follow, and retry-safe after native command failure.
- Sandpack provenance is reconstructed and CI-verified against immutable v2.19.8 source; all 14 modified upstream files carry change notices and the internal package is non-publishable.
- Docker Compose separates bootstrap, SET-only migrator/owner, and runtime PostgreSQL credentials and images; fail-closed policy replay verifies exact role membership, database/schema/relation/column/type/default ACLs, classified ownership, password rotation, and negative runtime privileges.

## GitHub source snapshot `v0.1.0` - 2026-08-07

This immutable repository tag already contains a CLI manifest numbered `0.2.0`.
It is not the source of npm's independently published `@compify/cli@0.1.0`,
whose recorded source commit is outside this repository history.

### Added

- Searchable Fumadocs documentation generated from the canonical root `docs/` source.
- Generated OpenAPI 3 contract at `/openapi.json` and a read-only Swagger UI.
- Reproducible Docker Compose self-hosting, migrations, readiness checks, and release smoke tests.
- Bun-only development, build, test, audit, and release workflows.

### Security

- Browser sessions moved from localStorage bearer tokens to HttpOnly cookies with origin checks; credential changes invalidate existing sessions.
- Hashed password-reset and CLI tokens, traversal and XSS defenses, fail-closed production secrets, pinned CI actions and container images, dependency audits, secret scanning, and CodeQL analysis.
