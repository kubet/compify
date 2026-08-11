# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
FROM oven/bun:1.3.9-debian@sha256:d48b40bf0106dc1e94462c7086fbf4e8aab97f0870db2c87a05ecf8765f964df AS bun-runtime

# Next.js build workers currently require Node on Linux. Bun remains the only
# package manager; the Node image provides the runtime expected by Next.js.
FROM node:22.23.2-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436 AS source
COPY --from=bun-runtime /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY docs ./docs
COPY LICENSE COPYRIGHT.md LICENSING.md TRADEMARKS.md THIRD_PARTY_NOTICES.md ./
COPY licenses ./licenses
COPY apps/web/package.json apps/web/bun.lock ./apps/web/
COPY apps/web/scripts ./apps/web/scripts
# compify-pack is a local file dependency of the web application.
COPY packages/compify-pack/package.json ./packages/compify-pack/package.json
COPY packages/compify-pack/dist ./packages/compify-pack/dist
COPY packages/compify-pack/LICENSE packages/compify-pack/README.md packages/compify-pack/PROVENANCE.md ./packages/compify-pack/
COPY packages/compify-pack/sandpack-client/package.json packages/compify-pack/sandpack-client/
COPY packages/compify-pack/sandpack-client/dist ./packages/compify-pack/sandpack-client/dist
COPY packages/compify-pack/sandpack-client/LICENSE packages/compify-pack/sandpack-client/README.md packages/compify-pack/sandpack-client/PROVENANCE.md packages/compify-pack/sandpack-client/THIRD_PARTY_NOTICES.md packages/compify-pack/sandpack-client/console-feed-LICENSE ./packages/compify-pack/sandpack-client/

FROM source AS dependencies
WORKDIR /app/apps/web
RUN --mount=type=cache,id=web-bun-build,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile

FROM dependencies AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:3009
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_CDN_URL=http://localhost:9000/public
ARG NEXT_PUBLIC_BUNDLER_URL=
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ARG NEXT_PUBLIC_TURNSTILE_ENABLED=false
ARG NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=false
ARG NEXT_PUBLIC_SOURCE_URL=
ARG NEXT_PUBLIC_SOURCE_REVISION=
ARG NEXT_PUBLIC_SOURCE_REPOSITORY=https://github.com/kubet/compify
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CDN_URL=$NEXT_PUBLIC_CDN_URL \
    NEXT_PUBLIC_BUNDLER_URL=$NEXT_PUBLIC_BUNDLER_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_TURNSTILE_ENABLED=$NEXT_PUBLIC_TURNSTILE_ENABLED \
    NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=$NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED \
    NEXT_TELEMETRY_DISABLED=1
COPY apps/web/ ./
RUN bun run build

FROM source AS production-dependencies
ENV NODE_ENV=production
WORKDIR /app/apps/web
RUN --mount=type=cache,id=web-bun-production,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --production

FROM node:22.23.2-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436 AS runtime
ARG SOURCE_REVISION=unknown
ARG SOURCE_REPOSITORY=https://github.com/kubet/compify
LABEL org.opencontainers.image.source="$SOURCE_REPOSITORY"       org.opencontainers.image.revision="$SOURCE_REVISION"       org.opencontainers.image.licenses="AGPL-3.0-only"
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
# Next starts through its checked-in binary; the npm client is not a runtime
# dependency. Remove the bundled global Node package-manager trees so unused
# client vulnerabilities do not ship in the production image.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx && \
    groupadd --system --gid 1001 bunjs && \
    useradd --system --uid 1001 --gid bunjs --home-dir /app compify
COPY --from=production-dependencies --chown=compify:bunjs /app/apps/web/node_modules ./node_modules
COPY --from=build --chown=compify:bunjs /app/apps/web/.next ./.next
COPY --from=build --chown=compify:bunjs /app/apps/web/public ./public
COPY --from=build --chown=compify:bunjs /app/apps/web/package.json ./package.json
COPY --from=build --chown=compify:bunjs /app/THIRD_PARTY_NOTICES.md ./THIRD_PARTY_NOTICES.md
COPY --from=build --chown=compify:bunjs /app/LICENSE ./LICENSE
COPY --from=build --chown=compify:bunjs /app/COPYRIGHT.md ./COPYRIGHT.md
COPY --from=build --chown=compify:bunjs /app/LICENSING.md ./LICENSING.md
COPY --from=build --chown=compify:bunjs /app/TRADEMARKS.md ./TRADEMARKS.md
COPY --from=build --chown=compify:bunjs /app/licenses ./licenses
USER compify
EXPOSE 3000
CMD ["node", "./node_modules/next/dist/bin/next", "start"]
