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
there is no contractual SLA. A hosted service, commercial support, package
release, or compatibility claim exists only when explicitly announced.

## Supported scope

The supported release boundary is documented in `PRODUCT.md`, `SECURITY.md`, and
`docs/storybook.mdx`. A schema-valid artifact is not proof of visual/runtime
fidelity. Reports involving aliases, assets, decorators, loaders, play functions,
monorepos, or private registries must include a minimal reproduction and exact
tool versions. Maintainers may close requests outside the current React CSF
wedge while retaining the evidence for later prioritization.

For self-hosting, operators own TLS, backups, credential rotation, monitoring,
email, object storage, database operations, upgrades, and any optional preview
bundler. See `docs/self-hosting.md` before exposing an installation.
