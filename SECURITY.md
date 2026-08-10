# Security Policy

## Supported versions

The repository's only Git tag/GitHub Release is `v0.1.0`; that source
snapshot already contains a CLI manifest numbered `0.2.0`. npm independently
serves an older `@compify/cli@0.1.0` package whose recorded source commit is not
in this repository history. The tag and npm package are therefore distinct
historical artifacts, not two names for one release. Current fixes land on
`main` and, when warranted, in a new reviewed release; immutable historical
artifacts are not silently replaced. A manifest or changelog entry does not
create a release, and there is no released current-source `0.2.x` line yet.

| Version or channel | Security status |
| ------------------ | --------------- |
| `main` (unreleased source candidate) | Receives fixes |
| GitHub source tag `v0.1.0` | Reports accepted; fixes require a new release |
| npm `@compify/cli@0.1.0` (independent older artifact) | Reports accepted; fixes require a new package release |
| Earlier artifacts | Not maintained |

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

- The project-operated public-alpha surfaces at compify.app, api.compify.app,
  and cdn.compify.app. Alpha availability is not a managed-service SLA, but
  security reports for these deployments are in scope.
- This repository (`apps/web`, `apps/api`, `packages/*`, deployment artifacts).
- The Docker Compose self-host baseline. Its operator remains responsible for
  infrastructure, configuration, access control, monitoring, and recovery.

## Notes for contributors and operators

- Never commit secrets; all credentials come from environment variables.
- The CI workflow runs gitleaks on every pull request when GitHub Actions are enabled.
- Use long independent values for JWT, internal API, database, and object-store
  secrets. Do not expose PostgreSQL or MinIO administration ports publicly.
- Backups contain account data and component source. Encrypt them, restrict
  access, and test deletion/restoration procedures.
