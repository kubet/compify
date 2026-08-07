# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3.9-debian AS bun-runtime

# Next.js build workers currently require Node on Linux. Bun remains the only
# package manager; the Node image provides the runtime expected by Next.js.
FROM node:22.15.0-bookworm-slim AS source
COPY --from=bun-runtime /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY docs ./docs
COPY apps/web/package.json apps/web/bun.lock ./apps/web/
COPY apps/web/scripts ./apps/web/scripts
# compify-pack is a local file dependency of the web application.
COPY packages/compify-pack/package.json ./packages/compify-pack/package.json
COPY packages/compify-pack/dist ./packages/compify-pack/dist
COPY packages/compify-pack/LICENSE packages/compify-pack/README.md packages/compify-pack/PROVENANCE.md ./packages/compify-pack/

FROM source AS dependencies
WORKDIR /app/apps/web
RUN --mount=type=cache,id=web-bun-build,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile

FROM dependencies AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:3009
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_CDN_URL=http://localhost:9000/public
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CDN_URL=$NEXT_PUBLIC_CDN_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_TELEMETRY_DISABLED=1
COPY apps/web/ ./
RUN bun run build

FROM source AS production-dependencies
ENV NODE_ENV=production
WORKDIR /app/apps/web
RUN --mount=type=cache,id=web-bun-production,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --production

FROM node:22.15.0-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 bunjs && \
    useradd --system --uid 1001 --gid bunjs --home-dir /app compify
COPY --from=production-dependencies --chown=compify:bunjs /app/apps/web/node_modules ./node_modules
COPY --from=build --chown=compify:bunjs /app/apps/web/.next ./.next
COPY --from=build --chown=compify:bunjs /app/apps/web/public ./public
COPY --from=build --chown=compify:bunjs /app/apps/web/package.json ./package.json
USER compify
EXPOSE 3000
CMD ["node", "./node_modules/next/dist/bin/next", "start"]
