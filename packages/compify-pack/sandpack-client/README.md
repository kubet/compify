# `@compify/sandpack-client`

This private package is Compify's browser-only fork of CodeSandbox Sandpack
client v2.19.8. It contains the browser runtime and static preview clients used
by `compify-pack`. Server-emulator templates are intentionally unsupported and
are rejected with an explicit error rather than silently loading an optional
implementation.

The fork remains under Apache License 2.0. See [PROVENANCE.md](./PROVENANCE.md)
for the immutable upstream revision, exact subset, and verification procedure.

## Development

From `packages/compify-pack`, `bun run build` installs this package with its
frozen lock, rebuilds the client, and then rebuilds both editor distributions.
The build is intentionally orchestrated by the parent package so the embedded
client and editor distributions use one reviewed toolchain.
