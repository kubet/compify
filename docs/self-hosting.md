---
title: Self-hosting
description: Run the operator-controlled Compify baseline with Docker Compose, PostgreSQL, MinIO, and explicit migrations.
---

This source/release-candidate deployment is a reproducible local or single-server
Compify baseline. It builds the API and web applications from the checked-out
source and runs them with PostgreSQL and MinIO. It is not a Compify-managed
service, high-availability platform, or production certification: the operator
owns TLS, access, credentials, monitoring, backups, upgrades, incident response,
and recovery. The Compose project also runs one-shot release jobs for database
roles/migrations and object-storage initialization.

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
export SOURCE_REVISION="$(git rev-parse HEAD)"
docker compose build
docker compose up -d
docker compose ps
```

Open:

- Web UI: [http://localhost:3000](http://localhost:3000)
- API readiness check: [http://localhost:3009/ready](http://localhost:3009/ready)
- MinIO console: [http://localhost:9001](http://localhost:9001)

Follow startup logs with `docker compose logs -f api web`. `postgres-role-bootstrap`, `api-migrate`, `postgres-role-grants`, `postgres-role-check`, and `minio-init` are expected to exit successfully; they are release jobs, not long-running services. The API starts only after the database role verifier and object-storage initializer pass.

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

### Editor runtime dependencies

`NEXT_PUBLIC_CDN_URL` controls the browser-reachable origin used for editor
runtime assets such as `sui-content`, `font-list.json`, `tailwindv4.js`, and
`capture.js`; the service worker receives the same origin. The example points to
the loopback MinIO public bucket, but that fresh bucket does not contain these
assets. A fully independent installation must mirror only assets it is licensed
to redistribute at the same paths and rebuild the web image with that origin.
The repository intentionally does not copy remote assets of unverified
provenance into the open-source release.

Compify also does not ship a Sandpack bundler. Set `NEXT_PUBLIC_BUNDLER_URL` to
an absolute, browser-reachable HTTP(S) URL for a compatible service and rebuild
the web image. When it is unset, component editing and interactive preview fail
closed with an operator-facing explanation rather than sending source to an
undeclared third party or a nonexistent local route.

All `NEXT_PUBLIC_*` values are embedded at image build time. After changing any
of them, run `docker compose up -d --build web`; restarting the old container is
not sufficient.

### Optional authentication capabilities

Google OAuth and Turnstile are disabled by default. Enable them only through
the paired operator flags:

```dotenv
GOOGLE_OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

TURNSTILE_ENABLED=true
TURNSTILE_SITE_KEY=...
CLOUDFLARE_TURNSTILE_KEY=...
```

API startup and the web build reject partial enabled configurations. Leaving an
enabled flag false keeps the corresponding UI and server enforcement disabled.

### Database and object storage

The API connects over the private Compose network, so `DB_HOST`, the internal database port, `MINIO_ENDPOINT`, and the internal MinIO port are set in `docker-compose.yml`. Configure credentials through:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (bootstrap/break-glass only)
- `DB_MIGRATOR_PASSWORD` (one-shot migrations only)
- `DB_RUNTIME_PASSWORD` (long-running API only)
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` (administrative initialization only)
- `MINIO_APP_ACCESS_KEY`, `MINIO_APP_SECRET_KEY` (least-privilege API access)

`*_PORT` variables change host-side published ports. `*_BIND_ADDRESS` defaults to `127.0.0.1`; do not widen database or object-storage bindings without a firewall. Named volumes `postgres-data` and `minio-data` retain data across container recreation.

The bootstrap job creates fixed `compify_owner`, `compify_migrator`, and `compify_runtime` roles. The API image contains no migration entrypoint or compiled migration files and connects only as the non-owner, non-superuser runtime role. A separate migration image connects as the migrator and assumes the non-login owner; a versioned allowlist then grants runtime CRUD only on current application tables plus required enum-type usage, excluding migration and quarantine evidence. `DB_SYNCHRONIZE=false` remains mandatory. Migration or role-policy failure prevents API startup. Generate all three database passwords independently, keep `.env` mode `0600`, and back up before every upgrade.

The PostgreSQL database must be dedicated to Compify. On an existing Compose volume, `POSTGRES_USER` remains the legacy object owner and bootstrap login; changing it does not rotate an initialized cluster. The bootstrap and post-migration policy jobs refuse unclassified public-schema relations, enum/domain types, application functions, `SECURITY DEFINER` functions, or unexpected owners instead of taking them over. Only invoker-security functions belonging to the allowlisted `uuid-ossp`, `pg_trgm`, and `btree_gin` extensions may remain in `public`. The policy revokes database connection from `PUBLIC`, revokes public schema/table/sequence privileges, and grants only the named roles. Runtime and migrator password changes are applied idempotently by the bootstrap job; rotate the bootstrap credential through an authenticated PostgreSQL administrator procedure.

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
4. Keep the default loopback bind addresses for PostgreSQL, MinIO, the API, and the web service behind your TLS reverse proxy. Do not set database or object-storage bind addresses to a public interface. The application containers communicate over the private Compose network.
5. Keep the MinIO console on its default loopback binding. Compose creates a separate least-privilege application user; never reuse its root credential outside initialization and recovery.
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

Back up MinIO with an `mc mirror` job or a storage-level snapshot of the `minio-data` volume. A complete recovery needs both PostgreSQL and MinIO data. Encrypt backup artifacts before copying them off-host, store encryption keys separately, restrict access, and test restores regularly.

Restore a dump into an empty/configured database:

```sh
docker compose exec -T postgres sh -c   'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < compify-postgres.sql
```

### Upgrade

```sh
git pull --ff-only
# Put the proxy in maintenance mode, drain in-flight writes, and stop all writers.
docker compose stop web api
docker compose build --pull
docker compose up -d --wait postgres minio
# Release jobs must run in order on every upgrade. --no-deps prevents implicit replay.
docker compose run --rm --no-deps postgres-role-bootstrap
docker compose run --rm --no-deps api-migrate
docker compose run --rm --no-deps postgres-role-grants
docker compose run --rm --no-deps postgres-role-check
docker compose up -d --remove-orphans minio-init api web
docker compose ps
```

Take and test backups before starting. Keep the reverse proxy in maintenance mode until `/ready` and the black-box checks pass. The first role conversion acquires catalog/object locks and must never overlap an old API writer. Never run an older API against a newer incompatible schema or restore the former API-as-superuser migration command. Prefer backup restore for destructive/schema-incompatible rollback. Rebuilding is required when public web variables or source dependencies change.

## Corresponding source offer

Compify's current original code is `AGPL-3.0-only`. Before a production build,
set `SOURCE_REVISION` to the exact 40-character commit being deployed. If the
checkout contains operator modifications that are not available at the upstream
repository, publish the complete modified Corresponding Source—including build
and installation material—at a no-charge immutable location, set `SOURCE_URL`
to that location, and set `SOURCE_REPOSITORY` to the HTTPS repository that owns
the deployed commit. These values also control legal-document links and OCI
source labels. Do not point a modified deployment only at upstream Compify.

Verify both offers after deployment:

```bash
curl -fsS "$BACKEND_URL/source"
curl -fsS "$FRONTEND_URL/source"
```

The API response must identify `AGPL-3.0-only`, the exact revision, and the
source location. The web page must show the same pinned revision or configured
source URL. Published container images must also carry exact OCI source,
revision, and license labels. A blank/`unknown` revision is acceptable only for
an explicitly unpinned development build, never a release or production image.

## Troubleshooting

- **Web calls a localhost API/CDN or the editor bundler is unavailable:** required public build URLs were absent or an old web image is running. Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CDN_URL`, `NEXT_PUBLIC_BUNDLER_URL`, and `NEXT_PUBLIC_SITE_URL`, then rebuild `web`.
- **CORS errors:** `FRONTEND_URL` must exactly match the browser origin, including scheme and port.
- **API waits at startup:** inspect `postgres-role-bootstrap`, `api-migrate`, `postgres-role-grants`, `postgres-role-check`, `postgres`, `minio`, and `minio-init` logs. The API intentionally waits for verified database policy, database health, and successful bucket initialization.
- **Login/register integration errors:** configure the relevant email, Turnstile, OAuth, or Stripe credentials for the integration being used and confirm migrations completed successfully.
- **Port collision:** change the host-side `*_PORT` value in `.env`; do not change container-internal service ports.
- **Clean local reset:** run `docker compose down -v` only if all local database and object data may be destroyed, then `docker compose up -d --build`.
