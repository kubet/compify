# Governance

Compify is currently maintainer-led. The lead maintainer is `@kubet`, as recorded
in `.github/CODEOWNERS`. This document describes the present process rather than
implying a foundation or committee that does not exist.

## Decisions

Routine changes are proposed through GitHub pull requests. Maintainers weigh
user evidence, security, compatibility, maintenance cost, and the product
boundary in `PRODUCT.md`; popularity alone does not make a change in scope.
Architecture, wire-schema, licensing, supported-version, and security-policy
changes require an approving maintainer review and passing required checks.
Substantial or irreversible changes should begin as an issue or discussion with
alternatives and migration impact documented.

## Roles

- **Contributors** may file issues and submit changes under `CONTRIBUTING.md`.
- **Reviewers** are recurring contributors trusted for specific areas; they may
  review but cannot publish releases unless separately authorized.
- **Maintainers** can merge, triage, manage supported branches, and participate
  in private security work.
- **Release maintainers** additionally hold protected release-environment and
  package-registry authority and follow `RELEASING.md`.

Maintainer access is granted based on sustained, constructive work, review
quality, security judgment, and availability—not a single large contribution.
The existing maintainer documents the change publicly. Access may be removed for
inactivity, compromised credentials, conflicts of interest, or conduct/security
violations, with private details withheld where necessary.

## Security and releases

Vulnerabilities follow `SECURITY.md`, not public issue discussion. No one person
should both introduce and publish a sensitive release when a second qualified
reviewer is available. Release credentials must be individual, least-privilege,
MFA-protected, and never shared. Tags are immutable.

## Project assets and succession

Repository, package, domain, signing, and infrastructure access should be held
in organization-managed accounts where possible. If the lead maintainer becomes
unavailable, active maintainers may appoint a replacement by documented
consensus. Until additional maintainers exist, the single-maintainer bus factor
is an explicit project risk, not hidden by aspirational governance language.
