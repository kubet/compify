# @compify/web

Next.js frontend for Compify.

```bash
bun install --frozen-lockfile
cp .env.example .env
bun run dev
```

Open <http://localhost:3000>. The browser API, site, and editor asset origins
are configured with the `NEXT_PUBLIC_*` values documented in `.env.example`.
Use Bun 1.3.9; other package managers are not supported for this repository.


## Docker public URL configuration

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CDN_URL`, and
`NEXT_PUBLIC_BUNDLER_URL` are compiled into the browser bundle during
`bun run build`. For Docker builds, pass them as build arguments; changing only
the runtime container environment does not update an existing bundle, so rebuild
the web image after changing any `NEXT_PUBLIC_*` value.

These URLs are requested by users' browsers, not from the web container. They
must therefore be absolute HTTP(S) URLs reachable from the browser (container-only
names such as `api:3009` are not suitable for public deployments). If
`NEXT_PUBLIC_BUNDLER_URL` is unset, component editing and interactive previews
are unavailable because the editor's Sandpack provider is disabled. Configure a
browser-reachable, Sandpack-compatible bundler and rebuild to enable the editor.
