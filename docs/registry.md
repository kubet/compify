---
title: Registry
description: Consume Compify artifacts through a shadcn-compatible registry deployment.
---

A configured Compify API can serve public components in shadcn registry-item
format. This describes the protocol surface; it does not promise a managed
hosted registry. Substitute the origin of the API you operate.

## One-off install

```bash
# self-hosted HTTPS origin
bunx shadcn@latest add https://registry.example.com/r/glass-3d-text.json

# local Compose API
bunx shadcn@latest add http://localhost:3009/r/glass-3d-text.json
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
bunx shadcn@latest add @compify/glass-3d-text
```

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

Generated files are derived outputs. Review them and test installation in a
consumer project rather than assuming Storybook runtime behavior was captured.
