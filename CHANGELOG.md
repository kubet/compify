# Changelog

All notable changes to Compify will be documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project follows [Semantic Versioning](https://semver.org/) for public packages
and compatibility contracts.

## [Unreleased]

## [0.1.0] - 2026-08-07

### Added

- Searchable Fumadocs documentation generated from the canonical root `docs/` source.
- Generated OpenAPI 3 contract at `/openapi.json` and a read-only Swagger UI.
- Reproducible Docker Compose self-hosting, migrations, readiness checks, and release smoke tests.
- Bun-only development, build, test, audit, and release workflows.

### Security

- Browser sessions moved from localStorage bearer tokens to HttpOnly cookies with origin checks; credential changes invalidate existing sessions.
- Hashed password-reset and CLI tokens, traversal and XSS defenses, fail-closed production secrets, pinned CI actions and container images, dependency audits, secret scanning, and CodeQL analysis.
