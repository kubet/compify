---
title: Self-hosting
description: Run Compify with Docker Compose, PostgreSQL, MinIO, migrations, and production-safe configuration.
---

This deployment is intended for a reproducible local or single-server Compify installation. It builds the API and web applications from the checked-out source and runs them with PostgreSQL and MinIO. The Compose project also runs a one-shot initializer that creates the four object-storage buckets expected by the API.

## Requirements

- Docker Engine 24+ with the Compose v2 plugin (`docker compose`)
- At least 4 GB of RAM available to Docker (the Next.js build is the largest step)
- Ports 3000, 3009, 5432, 9000, and 9001 available, or alternate ports configured in `.env`

The image versions and Node base image are pinned for repeatable builds. Dependency installation uses each application's committed Bun lockfile.

## Quick start

From the repository root:

```sh
cp deploy/self-host.env.example .env
# Edit .env and replace JWT_SECRET, INTERNAL_API_TOKEN, and storage/database passwords.
docker compose build
docker compose up -d
docker compose ps
```

Open:

- Web UI: [http://localhost:3000](http://localhost:3000)
- API readiness check: [http://localhost:3009/ready](http://localhost:3009/ready)
- MinIO console: [http://localhost:9001](http://localhost:9001)

Follow startup logs with `docker compose logs -f api web`. `minio-init` is expected to exit successfully after creating `components`, `images`, `public`, and `projects`; it is not a long-running service.

## Configuration

Compose reads `.env` in the repository root. The example is safe only as a starting point for local development. Do not deploy its passwords or the Compose fallback values on a public server.

### URLs and browser build arguments

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CDN_URL`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are **build arguments**. Next.js embeds them in the browser bundle, so changing them requires rebuilding the web image:

```sh
docker compose build --no-cache web
docker compose up -d web
```

These public URLs must be reachable by the user's browser; Docker service names such as `http://api:3009` are not valid values. `FRONTEND_URL` is the exact browser origin accepted by API CORS (no trailing slash), while `BACKEND_URL` is the externally reachable API URL used for callbacks. For the default host-port deployment use:

```dotenv
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3009
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3009
NEXT_PUBLIC_CDN_URL=http://localhost:9000/public
```

`INTERNAL_API_TOKEN` is runtime configuration for both containers and must have the same value in each. Compose does this automatically from the single `.env` value.

### Editor asset origin

`NEXT_PUBLIC_CDN_URL` controls the origin used for editor runtime assets such as
`sui-content`, `font-list.json`, `tailwindv4.js`, and `capture.js`; the service
worker receives the same origin. The default remains `https://cdn.compify.app`
for compatibility. A fully independent installation must mirror the assets it
is licensed to redistribute at the same paths and set `NEXT_PUBLIC_CDN_URL` to
that HTTPS origin before building the web image. The repository intentionally
does not copy remote assets of unverified provenance into the open-source
release.

### Database and object storage

The API connects over the private Compose network, so `DB_HOST`, the internal database port, `MINIO_ENDPOINT`, and the internal MinIO port are set in `docker-compose.yml`. Configure credentials through:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`

`POSTGRES_PORT`, `MINIO_PORT`, and `MINIO_CONSOLE_PORT` only change the host-side published ports. Named volumes `postgres-data` and `minio-data` retain data across container recreation.

The API runs the compiled TypeORM migrations before starting and uses `DB_SYNCHRONIZE=false` in this deployment. Migration failure stops the API container instead of starting it against a partially upgraded schema. Back up the database before every upgrade.

### Authentication and optional integrations

Always set long, independently generated `JWT_SECRET` and `INTERNAL_API_TOKEN` values, for example:

```sh
openssl rand -hex 32
```

AI provider keys, email/ZeptoMail, Turnstile, Google OAuth, and Stripe variables are optional integrations listed in `apps/api/.env.example`. Optional integrations are left unset by default. Configure complete credential groups before calling their endpoints (for example, both Google OAuth values or all required ZeptoMail values).

The initial migration seeds the free subscription plan at deterministic ID `00000000-0000-4000-8000-000000000001`, which is also the Compose default for `FREE_PLAN_ID`. Set a different ID only if you deliberately replace that plan.

If Turnstile is enabled, set both server-side `CLOUDFLARE_TURNSTILE_KEY` and the public build argument `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, then rebuild the web image.

Without ZeptoMail, local email/password signups are auto-verified and receive the seeded free plan. Without a Turnstile secret, bot verification is disabled. Configure both before exposing public registration.

## Public-server deployment

For an Internet-facing host:

1. Put a TLS reverse proxy (Caddy, Traefik, or nginx) in front of web and API.
2. Set the four public URL variables and `FRONTEND_URL`/`BACKEND_URL` to their HTTPS origins, then rebuild both images.
3. Replace every default credential and secret. Keep `.env` mode `0600` and out of version control.
4. Remove or firewall the PostgreSQL and MinIO API/console host port mappings if they do not need external access. The application containers communicate over the Compose network.
5. Restrict MinIO console access and use separate least-privilege application credentials for a hardened deployment. The included setup intentionally shares the MinIO root credentials to keep development initialization reproducible.
6. Configure real email, anti-bot, OAuth, billing, and AI credentials only for features you intend to expose.

Compose performs no TLS termination and is not a multi-host/high-availability orchestrator.

## Documentation and API contract

The web service publishes the searchable Fumadocs site at `/docs`. The API
publishes its generated OpenAPI document at `/openapi.json` and a read-only
Swagger reference at `/api/docs`. `BACKEND_URL` is recorded as the server URL in
the generated contract.

## Operations

### Stop, restart, and inspect

```sh
docker compose stop
docker compose start
docker compose logs --tail=200 api
docker compose ps
```

`docker compose down` removes containers and the network but preserves named volumes. `docker compose down -v` permanently deletes the PostgreSQL and MinIO volumes.

### Back up

Create a database dump:

```sh
docker compose exec -T postgres sh -c   'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > compify-postgres.sql
```

Back up MinIO with an `mc mirror` job or a storage-level snapshot of the `minio-data` volume. A complete recovery needs both PostgreSQL and MinIO data. Test restores regularly.

Restore a dump into an empty/configured database:

```sh
docker compose exec -T postgres sh -c   'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < compify-postgres.sql
```

### Upgrade

```sh
git pull --ff-only
docker compose build --pull
docker compose up -d --remove-orphans
docker compose ps
```

Take backups first. Rebuilding is required when public web variables or source dependencies change.

## Troubleshooting

- **Web calls `api.compify.app` instead of the self-hosted API:** `NEXT_PUBLIC_API_URL` was absent at build time or an old web image is running. Set it and rebuild `web`.
- **CORS errors:** `FRONTEND_URL` must exactly match the browser origin, including scheme and port.
- **API waits at startup:** inspect `postgres`, `minio`, and `minio-init` logs. The API intentionally waits for database health and successful bucket initialization.
- **Login/register integration errors:** configure the relevant email, Turnstile, OAuth, or Stripe credentials for the integration being used and confirm migrations completed successfully.
- **Port collision:** change the host-side `*_PORT` value in `.env`; do not change container-internal service ports.
- **Clean local reset:** run `docker compose down -v` only if all local database and object data may be destroyed, then `docker compose up -d --build`.
