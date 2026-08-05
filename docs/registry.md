# Using compify as a shadcn registry

Every public component on compify.app is served in
[shadcn registry-item format](https://ui.shadcn.com/docs/registry), so you can
install components with the tooling you already use — no compify CLI required.

## One-off install

```bash
npx shadcn@latest add https://api.compify.app/r/vukasinkubet/prism-pricing-card.json
```

## Configure the namespace (recommended)

Add compify to `components.json` in your project:

```json
{
  "registries": {
    "@compify": "https://api.compify.app/r/{name}.json"
  }
}
```

Then install any component as `@compify/<user>/<name>`:

```bash
npx shadcn@latest add @compify/vukasinkubet/prism-pricing-card
```

## Agents (shadcn MCP)

If you use the official shadcn MCP server with Claude Code, Cursor or
Windsurf, the `@compify` namespace configured above is automatically available
to your agent — it can search, view and install compify components with
natural language ("add the prism pricing card from compify").

## Registry index

`GET https://api.compify.app/r/registry.json` lists all public components
(name, title, description) in shadcn `registry.json` format.

## What's in an item

- `files` — the component source (compify-internal files like `globals.css`
  and `tailwind.config.*` are stripped; your project keeps its own setup)
- `dependencies` — npm packages the component needs (e.g. `framer-motion`)
- `docs` / `meta.source` — link to the live preview on compify.app
