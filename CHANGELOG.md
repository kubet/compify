# Changelog

All notable changes to Compify will be documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project follows [Semantic Versioning](https://semver.org/) for public packages
and compatibility contracts.

## [Unreleased]

## [0.2.0] - 2026-08-08

### Added

- Release candidates `@compify/cli@0.2.0` and `@compify/storybook@0.1.0`; package publication remains a separate, explicit release action.
- Storybook-first CLI commands to statically inspect React CSF, export a validated shadcn registry item, and publish a reviewed component graph to a configured Compify API.
- A renderer-neutral `@compify/storybook` manager addon for explicit portability, registry, install, and preview metadata.
- Bearer-authenticated `POST /cli/publish-story` with deterministic digests, provenance, strict file/path/content limits, and public, unlisted, or private visibility.
- Storybook product-market-fit research, falsification criteria, adoption measures, documentation, and first-class CI coverage.
- Explicit `--story <export-name>` selection, a zero-account golden fixture, and packed-CLI release validation.
- A pinned shadcn 4.16.2 → clean Next.js 15.5.23 production-build gate, compatibility matrix, ecosystem/cloud strategy, governance, and support policy.
- Owner-authenticated private registry items through standard shadcn namespace Bearer headers.
- Fail-closed static support for the basic CSF Next `preview.meta` / `meta.story` factory form.
- Published Storybook registry responses preserve the reviewed source paths and Compify digest/provenance metadata instead of applying legacy editor remapping.

### Changed

- Direct shadcn registry installation is now the primary publish and component-detail workflow.
- Self-hosted Google OAuth and Turnstile capabilities are explicitly paired and disabled by default; missing Sandpack infrastructure now fails closed instead of pointing to a nonexistent bundled service.
- Unlisted components remain directly installable but are excluded from the registry index.
- The public landing page, navigation, metadata, and package documentation now lead with the review-first Storybook workflow and its limits instead of unsupported marketplace or productivity claims.
- Password-reset validation and editor file-tab keyboard/accessibility behavior were hardened.
- The overlapping Compify registry MCP is now compatibility-only and deprecated in favor of official Storybook and shadcn agent surfaces.
- Unimplemented hard-coded project routes were removed rather than presenting sample state as a working OSS feature.

### Security

- CLI token validation now prevents stored token digests from being replayed as credentials.
- Storybook publication rejects traversal and symlink escapes, secret-like files, private keys, invalid text, oversized artifacts, case-colliding paths, undeclared runtime dependencies, and nonportable dynamic story arguments.
- Failed source-object uploads compensate newly created component rows instead of reserving orphaned publishing domains.
- Sandpack provenance is reconstructed and CI-verified against immutable v2.19.8 source; all 14 modified upstream files carry change notices and the internal package is non-publishable.

## [0.1.0] - 2026-08-07

### Added

- Searchable Fumadocs documentation generated from the canonical root `docs/` source.
- Generated OpenAPI 3 contract at `/openapi.json` and a read-only Swagger UI.
- Reproducible Docker Compose self-hosting, migrations, readiness checks, and release smoke tests.
- Bun-only development, build, test, audit, and release workflows.

### Security

- Browser sessions moved from localStorage bearer tokens to HttpOnly cookies with origin checks; credential changes invalidate existing sessions.
- Hashed password-reset and CLI tokens, traversal and XSS defenses, fail-closed production secrets, pinned CI actions and container images, dependency audits, secret scanning, and CodeQL analysis.
