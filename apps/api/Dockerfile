# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3.9-debian AS bun-runtime

# Bun manages dependencies; Node executes the Nest/TypeScript build tooling
# because tsc-alias is not reliable under Bun on Linux.
FROM node:22.15.0-bookworm-slim AS bun-node
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

FROM bun-runtime AS runtime
ENV NODE_ENV=production \
    STAGE=prod \
    PORT=3009
WORKDIR /app
RUN groupadd --system --gid 1001 bunjs && \
    useradd --system --uid 1001 --gid bunjs --home-dir /app compify
COPY --from=production-dependencies --chown=compify:bunjs /app/node_modules ./node_modules
COPY --from=build --chown=compify:bunjs /app/dist ./dist
COPY --chown=compify:bunjs package.json ./
COPY --chown=compify:bunjs files ./files
USER compify
EXPOSE 3009
CMD ["sh", "-c", "bun ./node_modules/typeorm/cli.js migration:run -d dist/data-source.js && exec bun dist/main.js"]
