# compify MCP server

`compify mcp` runs a [Model Context Protocol](https://modelcontextprotocol.io)
server over stdio, giving coding agents direct access to the compify registry —
no shadcn setup required, no authentication needed for public components.

## Register with your agent

**Claude Code:**

```bash
claude mcp add compify -- npx -y @compify/cli mcp
```

**Cursor / Windsurf / other MCP clients** — add to your MCP config:

```json
{
  "mcpServers": {
    "compify": {
      "command": "npx",
      "args": ["-y", "@compify/cli", "mcp"]
    }
  }
}
```

(Until the npm publish lands, point `command` at a local build:
`node <repo>/packages/cli/dist/index.js mcp`.)

## Tools

| Tool | What it does |
| --- | --- |
| `search_components` | Search public components by name/title/description; returns addresses + preview URLs |
| `get_component` | Full source files + npm dependencies for a component (shadcn registry-item format) — the agent writes the files and installs the deps |
| `get_install_commands` | Ready-to-run `npx shadcn add …` / `compify add …` commands |

## Typical agent flow

1. "Find me a pricing card on compify" → `search_components("pricing")`
2. `get_component("vukasinkubet/expert-pricing-card")`
3. Agent writes the file(s) into the project and adds `framer-motion`,
   `lucide-react` to package.json.

## Alternative: shadcn MCP

If the project already uses the official shadcn MCP, you don't need this
server — add the `@compify` namespace to `components.json` instead (see
[registry.md](./registry.md)) and the shadcn MCP picks it up automatically.
