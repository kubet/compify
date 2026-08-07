# Security Policy

## Supported versions

Until the first stable release, security fixes are applied to the latest commit
on `main` only. After versioned releases begin, this table will list the
supported release lines.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository when
available, or email **hello@compify.app** with details. Do not open a public
issue for security problems. Include affected versions, reproduction steps,
impact, and any suggested mitigation. We aim to acknowledge reports within
three business days, but this is not a contractual SLA.

We will coordinate validation, a fix, disclosure timing, and a GitHub Security
Advisory/CVE when appropriate. Please avoid accessing data that is not yours or
disrupting production while researching.

## Scope

- compify.app, api.compify.app, cdn.compify.app
- This repository (`apps/web`, `apps/api`, `packages/*`, deployment artifacts)
- The supported Docker Compose self-host configuration

## Notes for contributors and operators

- Never commit secrets; all credentials come from environment variables.
- CI runs gitleaks on every pull request.
- Use long independent values for JWT, internal API, database, and object-store
  secrets. Do not expose PostgreSQL or MinIO administration ports publicly.
- Backups contain account data and component source. Encrypt them, restrict
  access, and test deletion/restoration procedures.
