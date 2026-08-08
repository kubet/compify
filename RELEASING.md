# Releasing Compify

Compify uses a repository release train plus independently versioned public
packages. Repository tags are `vMAJOR.MINOR.PATCH`; package versions remain in
their own `package.json` and must be named explicitly in release notes. A
repository tag does not imply that every package is published to npm or that a
managed Compify service exists.

## Release authority and prerequisites

Only maintainers with repository release access may create a tag or publish a
package. Use an annotated, signed tag where maintainer signing is available.
Before tagging:

1. Start from a clean checkout of `main` at a commit whose required CI and CodeQL
   checks passed.
2. Confirm `CHANGELOG.md` has the dated repository version and names every public
   package version included.
3. Run frozen installs, audits, lint/type checks, tests, builds, migration checks,
   Compose configuration validation, and the self-host smoke job through manual
   CI (`workflow_dispatch`).
4. Run package boundary checks:
   ```bash
   cd packages/cli && bun install --frozen-lockfile && bun run test:package
   cd ../storybook && bun install --frozen-lockfile && bun run test:package
   ```
5. Inspect each `bun pm pack --dry-run`. Confirm LICENSE, README, provenance and
   expected `dist/` files are present; install the tarball in a clean consumer.
6. Review `THIRD_PARTY_NOTICES.md`, package licenses, the runtime-image license
   bundles, dependency audit output, and any documented license exceptions.
7. Build both runtime images from the exact commit, scan them, generate SBOMs,
   record immutable digests, and complete the self-host black-box smoke test.

## Tag and artifacts

```bash
git tag -s v0.2.0 -m "Compify v0.2.0"
git push origin v0.2.0
```

Create a GitHub release from the matching changelog section. Attach package
archives, source archive, SHA-256 checksums, SBOMs and image digests. Do not
attach locally dirty artifacts. Consumers must be able to verify which commit
and package version produced each file.

## Package publishing

Package publication is a separate explicit decision. Prefer npm trusted
publishing/OIDC with provenance from a protected GitHub environment; do not use
long-lived npm tokens. Publish from a clean, tagged checkout only after the
packed-package validation passes. Record the npm URL and integrity/provenance in
the GitHub release. If trusted publishing is not configured, leave the package
unpublished rather than weakening the release process.

`compify-pack` must not be published until its exact Sandpack upstream revision,
required upstream notices, local modification history and React peer
compatibility have been reconstructed and reviewed. Repository inclusion is not
package-release approval.

## Rollback and security

Never move or overwrite a released tag. For a broken release, mark it affected,
yank/deprecate the package version when appropriate, and ship a new patch. For a
vulnerability, follow `SECURITY.md`, coordinate a private advisory and disclose
only after a fixed release is available.
