---
title: MCP integrations
description: Use Storybook context and Compify registry context without conflating their roles.
---

There are two complementary MCP surfaces:

1. The **official Storybook MCP server** exposes a project's Storybook context
   to agents. Its MCP/manifests path is currently preview/unstable and React-only.
   Storybook remains upstream for authoring, tests, and docs.
2. **`compify mcp`** searches and reads artifacts available through a Compify
   registry. It does not inspect local Storybook source and is not a replacement
   or proxy for the official Storybook server.

Static `compify storybook inspect` and `export` do not require either server.

## Compify registry MCP

Build and link the current CLI source, then register its linked stdio
executable with your MCP client:

```json
{
  "mcpServers": {
    "compify": {
      "command": "compify",
      "args": ["mcp"]
    }
  }
}
```

The MCP client must inherit the path containing the linked executable. These
docs do not promise package-registry availability.

## Compify tools

| Tool | What it does |
| --- | --- |
| `search_components` | Search public registry metadata and return addresses and preview links |
| `get_component` | Return source files and package dependencies in registry-item form |
| `get_install_commands` | Return Bun-based shadcn and Compify install commands |

## Official Storybook MCP

Follow [Storybook's official MCP documentation](https://storybook.js.org/docs/ai/mcp)
for setup compatible with your Storybook version. As of the evidence review,
the official MCP integration and component manifests are preview/unstable and
React-only; do not treat their current protocol or output as a stable
cross-renderer contract. Use the integration when an agent needs the stories,
docs, or component-development context already maintained there. Use Compify
translation separately when you want a selected, reviewable registry artifact.

If a project configures a Compify namespace in `components.json`, the official
shadcn MCP can also work with registry items through that namespace. That is a
third integration path and does not make Compify a Storybook MCP implementation.
