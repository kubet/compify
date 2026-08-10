# Support

## Where to ask

- **Bug with a reproducible case:** use the GitHub bug-report template.
- **Feature or compatibility request:** use the feature-request template and
  include the real repository shape, Storybook/React/shadcn versions, current
  handoff workflow, and why native registry or package tooling is insufficient.
- **Usage question or pilot feedback:** use GitHub Discussions when enabled;
  otherwise open a scoped question issue.
- **Security vulnerability:** use private vulnerability reporting or the address
  in `SECURITY.md`. Never disclose it in a public issue.

This is a community open-source project. Responses and fixes are best effort;
there is no contractual SLA. The repository's only Git tag/GitHub Release is
`v0.1.0`, whose snapshot already contains a CLI `0.2.0` manifest. npm separately
serves an older `@compify/cli@0.1.0` artifact from a source commit outside this
repository history. Those are not the same release. The current CLI `0.2.0` and
Storybook addon `0.1.0` manifests in `main` are source candidates, not published
packages. The project-operated default
API is a public-alpha deployment and currently exposes
`POST /cli/publish-story`, but that availability is not a generally available
managed service, commercial support commitment, or compatibility SLA.

## Supported scope

The released and source-candidate boundaries are documented in `PRODUCT.md`,
`SECURITY.md`, and `docs/storybook.mdx`. A schema-valid artifact is not proof of
visual/runtime fidelity. Reports involving aliases, assets, decorators, loaders,
play functions, monorepos, or private registries must include a minimal
reproduction and exact tool versions. Maintainers may close requests outside the
current React CSF wedge while retaining the evidence for later prioritization.

For self-hosting, operators—not the Compify project—own TLS, backups,
credential rotation, monitoring, email, object storage, database operations,
upgrades, incident response, and any optional preview bundler. The Compose
baseline is not managed hosting. See `docs/self-hosting.md` before exposing an
installation.
