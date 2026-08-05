# @compify/api

REST API for [compify.app](https://compify.app) — auth, components, AI assistance,
storage and billing. NestJS 10 + TypeORM (PostgreSQL) + MinIO.

## Run

```bash
yarn
cp .env.example .env.stage.local   # fill in DB/MinIO/JWT at minimum
yarn start:dev                     # http://localhost:3091
```

`STAGE` selects the env file (`.env.stage.<STAGE>`); the dev script sets
`STAGE=local`, production runs with `STAGE=prod`.

## Notable routes

- `GET /health` — health check used by deploys
- `GET /c/info/:id`, `/c/image/:id`, `/c/og-image/:id`, `/c/top-components` — public component data (short ids)
- `/user/*` — auth, registration, profile
- `/component/*` — authenticated component CRUD

## Storage layout (MinIO)

- `components/<uuid>` — one JSON object per component: `{"/File.js": {code, main}, ...}`
- `images/<shortId>` and `images/<shortId>-og` — webp previews
- `public/` — static assets served via cdn.compify.app

Short ids are [short-uuid](https://www.npmjs.com/package/short-uuid) (flickrBase58)
encodings of the component uuid.

## Deploy

Handled by the repo's Deploy workflow — see `deploy/server/deploy-api.sh`.
