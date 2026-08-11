# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
FROM oven/bun:1.3.9-debian@sha256:d48b40bf0106dc1e94462c7086fbf4e8aab97f0870db2c87a05ecf8765f964df AS bun-runtime

# Bun manages dependencies; Node executes the Nest/TypeScript build tooling
# because tsc-alias is not reliable under Bun on Linux.
FROM node:22.23.2-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436 AS bun-node
COPY --from=bun-runtime /usr/local/bin/bun /usr/local/bin/bun

FROM bun-node AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,id=api-bun-build,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile

FROM dependencies AS build
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN bun run build

FROM bun-node AS production-dependencies
ENV NODE_ENV=production
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,id=api-bun-production,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --production

# Reuse the patched Node/bookworm base that already runs the pinned Bun binary
# during builds. The older Bun Debian runtime snapshot contains fixed upstream
# OS CVEs. Node package managers are build-only here, so remove their global
# trees and shims from both production targets before copying dependencies.
FROM bun-node AS application-base
ARG SOURCE_REVISION=unknown
ARG SOURCE_REPOSITORY=https://github.com/kubet/compify
LABEL org.opencontainers.image.source="$SOURCE_REPOSITORY"       org.opencontainers.image.revision="$SOURCE_REVISION"       org.opencontainers.image.licenses="AGPL-3.0-only"
ENV NODE_ENV=production \
    STAGE=prod \
    PORT=3009 \
    BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
WORKDIR /app
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx && \
    groupadd --system --gid 1001 bunjs && \
    useradd --system --uid 1001 --gid bunjs --home-dir /app compify
COPY --from=production-dependencies --chown=compify:bunjs /app/node_modules ./node_modules
COPY --from=build --chown=compify:bunjs /app/dist ./dist
COPY --chown=compify:bunjs package.json ./
COPY --chown=compify:bunjs files ./files

FROM application-base AS migration
USER compify
CMD ["sh", "-c", "bun ./node_modules/typeorm/cli.js migration:run -d dist/data-source.js"]

FROM application-base AS runtime
RUN rm -rf dist/migrations dist/migration-tests dist/data-source.*
USER compify
EXPOSE 3009
CMD ["bun", "dist/main.js"]
