---
title: Ecosystem and cloud strategy
description: Where Compify fits beside Storybook AI and shadcn, and the evidence required before a managed cloud.
---

_Last reviewed: 2026-08-08. This is a falsifiable product strategy, not a promise
that cloud, enterprise, or future Storybook integrations are shipped._

## The missing layer

The supported chain has three different authorities:

1. **Storybook understands and exercises the upstream component.** Its docs,
   manifests, MCP/tools, previews and tests provide context. They do not grant
   permission to distribute a source graph.
2. **Compify selects, analyzes and records an approved source boundary.** Its
   local compiler never executes the story and emits reviewable native registry
   material plus provenance.
3. **shadcn resolves and installs source into the consumer.** Its registry CLI,
   namespaces, authentication, target/alias transformations and MCP own downstream
   installation. Compify must not replace that protocol.

The product is therefore a **policy-gated compiler and evidence layer between
component understanding and source installation**. It is not “AI for Storybook,”
a marketplace, a hosted IDE, another docs/test system, or another package manager.

## Storybook AI: integrate by choreography, not duplication

Storybook 10.5 documentation describes React component/docs manifests and an
official MCP server for component documentation, changed-story discovery,
preview and tests. Both MCP/manifests are currently preview and React-only, and
the manifest schema is explicitly unstable:

- [MCP overview](https://storybook.js.org/docs/ai/mcp)
- [MCP toolsets/API](https://storybook.js.org/docs/ai/mcp/api)
- [Component and docs manifests](https://storybook.js.org/docs/ai/manifests)

The upstream [Storybook Skills tracking work](https://github.com/storybookjs/storybook/issues/35526)
goes further: Storybook 10.6 is moving toward shared `docs`, `stories`, `test`
and `review` toolsets consumed by MCP, a `storybook tools` CLI, and agent skills.
MCP remains supported, but upstream is deliberately centralizing the capability.
Compify should not clone or proxy it.

The agent workflow should instead be:

```text
Storybook tools/MCP: understand, preview, test and identify a component
        ↓ explicit maintainer selection
Compify CLI: inspect source graph, show policy/diagnostics, export reviewed bytes
        ↓ approved immutable artifact
shadcn CLI/MCP: view, diff/dry-run and install into the target application
```

Near term, a small versioned agent skill may document this choreography; it must
not turn publishing into an unconfirmed MCP side effect. The existing Compify
registry MCP overlaps the official shadcn MCP and should remain compatibility-only
while usage is measured. Its future value, if any, is Compify-specific evidence
(digest, approval, provenance, verification), not raw registry browsing.

Storybook `/index.json` may later map a local story ID to an import path and tag
for discovery. Manifests may enrich review with props/descriptions. Neither is a
source or authorization contract. Canonical paths must still be rooted and
reparsed locally. Use a dedicated opt-in `compify` tag rather than overloading
Storybook's `manifest` tag. CSF Next static support and a stable upstream extension
API must be proven before any toolset integration. Never scrape Docs Source,
preview bundles or rendered iframes for canonical implementation.

## shadcn: use the native substrate

shadcn already owns decentralized namespaces, Bearer/header authentication,
`registryDependencies`, item types/targets, consumer aliases, monorepo routing,
`view`, `add --dry-run/--diff`, build and MCP:

- [Registry](https://ui.shadcn.com/docs/registry)
- [Namespaces](https://ui.shadcn.com/docs/registry/namespace)
- [Authentication](https://ui.shadcn.com/docs/registry/authentication)
- [Item schema](https://ui.shadcn.com/docs/registry/registry-item-json)
- [MCP](https://ui.shadcn.com/docs/mcp)

Compify adds value only before and around that substrate: determining the source
boundary, explaining every graph edge, refusing unsafe input, recording intent,
serving exactly the reviewed bytes, and proving a pinned clean-consumer result.
Local export and the server must converge on one content-addressed artifact;
reconstructing different JSON from editor storage destroys the digest's meaning.

The target artifact lifecycle is:

- `selection.json`: repo/commit/package/CSF path/exact exports and intended name;
- `graph.json`: file hashes, media kinds, resolved/unresolved edges, dependency
  origin and diagnostics;
- `registry.source.json`: explicit native file types/targets and dependencies;
- `registry.item.json`: exact built/served bytes and content digest;
- `publication.json`: immutable revision, auth/channel/URL and tool versions;
- `verification.json`: pinned view/dry-run/add/typecheck/build evidence;
- `receipt.json`: consumer targets, rewrites, package/file before/after hashes;
- optional signed attestation/SBOM.

Do not call the artifact verified until the declared stages pass. Do not claim
monorepo, alias, asset, runtime or visual fidelity from schema acceptance.

## Open source and managed cloud

The durable model is **open portability engine, paid managed trust plane**.

Must remain MIT and local-first:

- parser/resolver, diagnostics, policy interface and security checks;
- inspect/export, open artifact/evidence schemas and verification fixtures;
- direct native shadcn consumption, basic private self-host registry and backup;
- signatures/provenance verification and the ability to leave;
- Docker Compose community baseline and all security-critical authorization.

A future cloud may sell operations and organization-wide governance:

- managed private namespaces/CDN/backups/upgrades/SLA;
- immutable versions, channels, signing, SBOMs and transparency history;
- approvals, RBAC/service accounts, audit retention, OIDC CI publication and
  GitHub/GitLab checks;
- compatibility workers that run only in isolated, no-egress opt-in sandboxes;
- SAML/SCIM, residency, private networking, customer storage/keys and support.

Never paywall local deterministic export, basic private self-hosting, CLI
automation, wire formats, backups, or artifact exit. Never train on private
source or execute uploaded story/component modules in the publish path.

The closest strategic precedent is Storybook/Chromatic: open authoring substrate,
paid collaboration/verification/operations. Supabase and PostHog show managed
convenience and generous adoption; GitLab shows governance as an enterprise
boundary; Bit is the broader lifecycle alternative. Compify wins only when a
team wants incremental, source-owned adoption without moving off Storybook.

## Pricing hypothesis—not a commitment

If activated teams demand cloud, test a predictable organization metric:
**active managed private component identities** (`org/name`) per month. Do not
meter consumers, installs, agent/MCP calls, versions or every collaborator.
Possible interview cards are free public/limited private, roughly $99/month team,
roughly $399/month business, and enterprise capacity/support bands. Build no SSO,
SCIM, HA or billing complexity before paid design commitments validate it.

## Decision gates

Within 90 days, recruit teams with an existing React Storybook, at least two
consumer apps and a real recent source handoff. The strategy passes only with:

- at least 20 installed artifacts across 8 qualified teams;
- at least 70% inspection success for the explicitly supported cohort and median
  under 20 minutes to an accepted export;
- at least 6 teams independently exporting a second component within 30 days;
- at least 5 retained teams and weekly activated libraries of 5 by day 90;
- zero unintended-source/credential incidents; and
- before cloud build-out, at least 3 paid pilots from 10 activated teams or 2
  signed enterprise design partners with named security buyers and dates.

If direct native registry authoring or versioned packages win most comparisons,
reposition the static engine as a registry policy/provenance tool. If OSS utility
works but cloud willingness-to-pay does not, keep the MIT project honest rather
than manufacturing a paywall.

OSS telemetry remains off by default. Pilot evidence should be consented and
must never include source, paths, args, dependency names or private registry
content. See [the evidence plan](./product-market-fit.md) and
[compatibility matrix](./compatibility.md).
