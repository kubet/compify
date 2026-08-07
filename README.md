# Compify

Build, preview and share UI components. Live at [compify.app](https://compify.app).

## Repository layout

| Path                    | What                                      | Stack                                 |
| ----------------------- | ----------------------------------------- | ------------------------------------- | --------- |
| `apps/web`              | compify.app frontend                      | Next.js 16, React 19, Tailwind        |
| `apps/api`              | REST API (auth, components, AI, billing)  | NestJS 11, TypeORM, PostgreSQL, MinIO |
| `packages/cli`          | `compify` CLI (`compify add <id           | @user/name>`)                         | Bun, tsup |
| `packages/compify-pack` | Vendored Sandpack fork used by the editor | React, rollup                         |
| `packages/templates`    | Project templates                         | —                                     |

## Docs

- [Documentation site](https://compify.app/docs) — Fumadocs guides with navigation and search
- [OpenAPI JSON](https://api.compify.app/openapi.json) and [read-only API reference](https://api.compify.app/api/docs)
- [Product direction](PRODUCT.md) — positioning, personas, roadmap
- [CLI reference](docs/cli.md)
- [shadcn registry interop](docs/registry.md) — `bunx shadcn add @compify/<user>/<name>`
- [Publishing guide](docs/publishing.md)
- [MCP server for agents](docs/mcp.md) — `compify mcp`
- [Self-hosting with Docker Compose](docs/self-hosting.md) — reproducible single-host setup

## Development

Each app is self-contained for now (no workspace hoisting yet). Bun 1.3.9 is the only supported package manager; each package commits its own `bun.lock`. The CLI runs on Bun. Next.js uses its supported Node runtime in the production web image while dependencies and scripts remain Bun-managed.

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
installations. Review the security notes and production checklist in that guide before exposing an installation publicly.

## Production deployment

The public repository intentionally contains no hosted Compify production
credentials, topology, or private deployment automation. Operators can use the
container images and Compose baseline in the [self-hosting guide](docs/self-hosting.md)
as a starting point, then add their own TLS termination, secret manager,
backups, monitoring, and deployment system.

## License

Original Compify code is MIT-licensed. The vendored `compify-pack` Sandpack derivative retains its upstream Apache-2.0 license; see `packages/compify-pack/PROVENANCE.md`.
