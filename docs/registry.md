---
title: Registry
description: Consume Compify artifacts through a shadcn-compatible registry deployment.
---

A configured Compify API can serve components in shadcn registry-item format.
The CLI's default `https://api.compify.app` origin is a project-operated public
alpha; it is available but is not a generally available managed registry or
SLA. The examples below deliberately use an operator-controlled origin. A
self-hosted operator owns its access policy, credentials, retention, backups,
upgrades, and availability.

## One-off install

```bash
# self-hosted HTTPS origin
bunx shadcn@4.16.2 add https://registry.example.com/r/glass-3d-text.json

# local Compose API
bunx shadcn@4.16.2 add http://localhost:3009/r/glass-3d-text.json
```

## Configure a namespace

Add a registry deployment to `components.json`:

```json
{
  "registries": {
    "@compify": "https://registry.example.com/r/{name}.json"
  }
}
```

Then install an available component:

```bash
bunx shadcn@4.16.2 add @compify/glass-3d-text
```

## Private namespace authentication

Private published items use the same raw `cli_…` credential accepted by
`storybook publish` and standard shadcn namespace Bearer headers. Keep the token
in the environment, never in `components.json`:

```json
{
  "registries": {
    "@compify": {
      "url": "https://registry.example.com/r/{name}.json",
      "headers": {
        "Authorization": "Bearer ${COMPIFY_TOKEN}"
      }
    }
  }
}
```

```bash
export COMPIFY_TOKEN=cli_<64-hex-characters>
bunx shadcn@4.16.2 view @compify/alice/private-button
bunx shadcn@4.16.2 add @compify/alice/private-button
```

The token owner must own the private publishing domain. Private items never
appear in the anonymous registry index, and missing, malformed, revoked, or
other-user credentials return the same not-found response. The current token is
account-wide and can also publish; it is not yet a scoped, read-only registry
credential. Rotate or revoke it from the profile/API if it is exposed. Pin and
test the shadcn CLI version used by your organization, including authenticated
`registryDependencies`; header propagation must not be assumed across versions.

## Storybook relationship

Storybook remains upstream for authoring, tests, and documentation. The
`compify storybook export` command produces a local registry item for review;
`publish` sends a supported source bundle to the configured API. See
[Storybook translation](./storybook.mdx). The official Storybook MCP provides
upstream context and does not itself turn stories into Compify artifacts.

## Agents

The official shadcn MCP can use namespaces configured in `components.json`.
That is often enough for agents that need to search, view, and install available
registry items. The separate Compify MCP exposes Compify registry metadata; see
[MCP integrations](./mcp.md).

## Registry index and item shape

`GET https://registry.example.com/r/registry.json` lists `public` components in
shadcn `registry.json` format. `unlisted` components are omitted from that index
but remain available by direct address; `private` components are owner-only. An
item can contain:

- `files` — component source selected for distribution;
- `dependencies` — required external packages; and
- `docs` / `meta` — descriptive and provenance metadata.

## Latest and immutable revision addresses

A successful v2 publish returns two install surfaces:

- `registryUrl`, the latest reviewed revision for the publishing domain; and
- `immutableRegistryUrl`, shaped as
  `/r/<owner>/<name>/<sha256>.json`, which resolves only that digest.

Republishing the same owned name with a new digest appends a revision rather than
failing on the occupied domain. Repeating an identical digest is idempotent.
Historical revisions retain their visibility snapshot, so an immutable private
URL still requires its owner's current Bearer token and becomes inaccessible
after token revocation. Immutability covers the canonical registry-item object,
not original request whitespace or a third-party transparency log.

Generated files are derived outputs. Review them and test installation in a
consumer project rather than assuming Storybook runtime behavior was captured.
