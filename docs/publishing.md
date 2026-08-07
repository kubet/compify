# Publishing components

## From the editor

1. Build your component at [compify.app/create](https://compify.app/create) —
   live sandpack preview, Tailwind (v3/v4), TypeScript, framer-motion, Three.js
   and shadcn/ui all work out of the box.
2. Hit **Publish**. Pick a visibility:
   - **Public** — listed in the gallery, installable by anyone
   - **Free** — installable by anyone, not featured
   - **Private / Draft** — only you
3. Set a **publishing domain** — your permanent address:
   `@<username>/<component-name>`. Availability is checked live.

## What a published component gets

| Surface | Address |
| --- | --- |
| Live preview page | `compify.app/view/@user/name` |
| Detail page | `compify.app/c/<id>` |
| compify CLI | `compify add @user/name` |
| shadcn CLI / MCP / v0 | `bunx shadcn add @compify/user/name` (see [registry.md](./registry.md)) |

Preview and social (OG) images are generated automatically.

## Good publishing hygiene

- **Self-contained files**: avoid relying on page-level CSS; size the root
  element with inline styles or classes shipped in the component itself.
- **Declare defaults via props** so consumers can drop the component in and
  see something sensible immediately.
- **Name deliberately** — publishing domains are permanent addresses; renames
  break installs (versioned publishes are on the roadmap, see PRODUCT.md).
