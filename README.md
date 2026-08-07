# Compify

Build, preview and share UI components. Live at [compify.app](https://compify.app).

## Repository layout

| Path | What | Stack |
| --- | --- | --- |
| `apps/web` | compify.app frontend | Next.js 16, React 19, Tailwind |
| `apps/api` | REST API (auth, components, AI, billing) | NestJS 10, TypeORM, PostgreSQL, MinIO |
| `packages/cli` | `compify` CLI (`compify add <id | @user/name>`) | Node, tsup |
| `packages/compify-pack` | Vendored Sandpack fork used by the editor | React, rollup |
| `packages/templates` | Project templates | — |

## Docs

- [Product direction](PRODUCT.md) — positioning, personas, roadmap
- [CLI reference](docs/cli.md)
- [shadcn registry interop](docs/registry.md) — `bunx shadcn add @compify/<user>/<name>`
- [Publishing guide](docs/publishing.md)
- [MCP server for agents](docs/mcp.md) — `compify mcp`
- [Open-source/self-host readiness](docs/open-source-readiness.md) — current gaps and release gate
- [Self-hosting with Docker Compose](docs/self-hosting.md) — reproducible single-host setup

## Development

Each app is self-contained for now (no workspace hoisting yet). Bun 1.3.9 is the only supported package manager and JavaScript runtime; each package commits its own `bun.lock`.

```bash
# frontend — http://localhost:3000
cd apps/web && bun install && bun run dev

# api — http://localhost:3009 (needs PostgreSQL + MinIO, see .env.stage.local)
cd apps/api && bun install && bun run start:dev

# cli
cd packages/cli && bun install && bun run build
```

### API environment

`apps/api` reads `.env.stage.<STAGE>` (`local` | `prod`). Required: PostgreSQL
credentials, MinIO keys, JWT secret; optional: AI provider keys, Stripe,
ZeptoMail, Turnstile. Env files are gitignored — never commit them.

### Storage

MinIO buckets: `components` (one JSON object per component id holding its
files), `images` (`<shortId>` preview + `<shortId>-og` social image, webp),
`public` (static assets, served via cdn.compify.app), `projects`.

## Self-hosting status

A Docker Compose deployment now provisions the web app, API, PostgreSQL,
MinIO, buckets, schema migrations, and the default free plan. Follow the
[self-hosting guide](docs/self-hosting.md). It targets local or single-server
installations; remaining hardening and hosted-service coupling are tracked in
the [readiness audit](docs/open-source-readiness.md).

## Production

Single host behind nginx. `compify-front` (Next, port 3000, `apps/web`) and
`compify-back` (Nest, port 3091, `apps/api`) run under pm2 in cluster mode
from the `/root/compify` monorepo checkout; MinIO on 9000 (cdn.compify.app
proxies the `public` bucket); PostgreSQL 15 local.

Deploys are automatic: pushing to `main` triggers the Deploy workflow, which
SSHes to the host, updates the checkout, and runs the path-filtered
`deploy/server/deploy-{web,api}.sh` (build → `pm2 reload` → health check →
rollback on failure).

## License

Original Compify code is MIT-licensed. The vendored `compify-pack` Sandpack derivative retains its upstream Apache-2.0 license; see `packages/compify-pack/PROVENANCE.md`.
