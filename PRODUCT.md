# Compify — current and next

## Positioning

**Package selected React component source into reviewable shadcn registry artifacts, using Storybook CSF as the explicit selection boundary.**

Storybook remains the upstream place where a team authors, exercises, tests, and
documents components. Compify is a packaging and distribution layer: it statically reads
supported source, lets a maintainer select the intended component surface through
CSF, and produces source-owned artifacts for the shadcn registry ecosystem. It is not a
replacement for Storybook, a component marketplace, or a second source of truth.

The official Storybook MCP server is complementary. It helps agents understand
and work with a running Storybook; Compify's job is to package selected source
for installation through a registry. Its MCP/manifests path is currently
preview/unstable and React-only, so it is not a stable cross-renderer contract.
Teams may use either or both.

## Current product

The repository currently provides:

- an optional legacy browser editor whose interactive preview requires an
  operator-configured Sandpack-compatible bundler;
- public shadcn-compatible registry items and an index;
- a Bun-powered CLI for installing and managing published Compify components;
- source/release-candidate CLI commands that statically inspect a React CSF
  bundle, explain its file/import graph, export a deterministic registry item,
  prove a cross-app native-shadcn install/build with a local evidence receipt,
  and optionally publish it to an authenticated self-hosted API;
- the source/release-candidate `@compify/storybook` manager addon, which displays
  author-provided portability and distribution metadata without inspecting or
  publishing source;
- a Compify MCP server for searching and reading that registry; and
- a Docker Compose baseline for self-hosting.

The older CLI 0.1.0 exists on npm; the Storybook CLI/addon release candidates
are not considered published until explicitly announced. Current-source
self-hosting supports owner-authenticated private items and immutable v2
publication revisions. The public repository does **not** claim a managed hosted
service or SLA for its project-operated public alpha, organization-scoped RBAC,
general framework conversion, runtime or visual fidelity, or byte-serialization
transparency attestations.

## Next: validate and harden the wedge

The smallest trustworthy React CSF pipeline now exists in repository source:
inspect locally, export deterministically, and publish one explicitly selected
story-file bundle to a configured API. The next work is evidence and reliability,
not a broader promise:

1. Test real pilot repositories and expand the explicit compatibility matrix.
   Two synthetic shadcn/Next clean-consumer shapes and one pinned external
   `react-uswds` Button source now pass the build gate. The external replay omits
   upstream preview styling and was operated by this repository's maintainer;
   it is narrow technical compatibility evidence, not a pilot, adoption, visual
   fidelity, or general compatibility.
2. Test the bounded exact in-package alias rewriting and basic static CSF Next
   support on qualified repositories. Cross-file re-export catalogs and
   cross-workspace source remain dominant unresolved blockers; expand only from
   repeated pilot evidence.
3. Use the shipped analyzed/installed/built evidence and digest-signed handoff
   receipts in real pilots. Runtime, visual, accessibility and behavioral claims
   still require separate explicit test phases.
4. Harden v2 immutable revision concurrency and policy/audit presentation before
   promising multi-user governance. Canonical registry semantics are preserved;
   original JSON byte serialization and transparency-log attestations are not.
5. Keep the addon inert and author-declared until a digest-bound report contract
   exists. Prefer official Storybook tools/MCP for upstream context and official
   shadcn tooling for install; do not expand the overlapping Compify MCP.
6. Measure repeat export/install behavior against the 90-day scorecard. Build a
   managed trust plane only after activated teams commit to pay for private
   operations, approvals, policy and audit—not for local export.

The boundary remains intentionally narrow: React Component Story Format (CSF),
static text graphs, bounded exact in-package aliases, and serializable metadata/args. No story module is
executed during discovery. Dynamic configuration, arbitrary render functions,
decorators, loaders, play functions, and framework-specific runtime behavior
are not promises of faithful conversion. A caller may select one exact named story export, but the CSF file remains the
authorization/context boundary and story-only runtime modules are not installed.

## Why this order

Storybook already owns authoring, interaction, documentation, and test context.
Rebuilding those workflows would create migration cost and split ownership.
A reviewable translation step instead connects an established upstream workflow
to shadcn's source-distribution protocol. The wedge is useful only if teams can
adopt it component by component and keep Storybook unchanged.

## Primary users

1. **Design-system maintainer** — selects a supported public surface and reviews
   the generated artifact before distribution.
2. **Application engineer** — installs approved source into an application with
   familiar shadcn or Compify tooling.
3. **Platform/tooling engineer** — runs deterministic inspection/export in CI
   and enforces repository policy.
4. **Coding-agent user** — uses Storybook MCP for upstream context and registry
   tooling for installation, without confusing the two roles.

## Near-term decisions

- Storybook source is upstream; generated registry artifacts are outputs.
- Static analysis and explicit selection take priority over breadth.
- React CSF comes first. Other renderers and opaque runtime stories remain out
  of scope until measured demand and fixtures justify support.
- The official Storybook MCP is an integration neighbor, not a competitor.
- Keep existing editor, registry, CLI, MCP, and self-hosting paths maintained;
  do not describe roadmap items as shipped.
- Validate the wedge with the falsification tests and 90-day measures in
  [docs/product-market-fit.md](docs/product-market-fit.md).
