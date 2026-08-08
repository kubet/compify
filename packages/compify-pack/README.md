# compify-pack

Private vendored CodeSandbox Sandpack derivative used by `apps/web` for the
legacy browser editor. It is **not** an independently supported or publishable
npm package. The web app consumes its committed `dist/` output through a local
file dependency.

## Provenance and license

The complete source baseline is CodeSandbox Sandpack v2.19.8 at commit
`83a494906a61517ea597ae94b26e1972f0c67777`. See
[PROVENANCE.md](./PROVENANCE.md) for the immutable baseline, all declared changed
paths and the CI verifier. The derivative retains Apache-2.0; see [LICENSE](./LICENSE).
Every changed upstream source file and generated bundle carries a Compify
modification notice.

## Development

Bun 1.3.9 is required.

```bash
bun install --frozen-lockfile
bun run typecheck
bun run build
bun run test -- --runInBand
```

`dist/` is committed because the web Docker build installs this local dependency
without rebuilding it. Commit source and regenerated distribution changes
together. `scripts/verify-sandpack-provenance.ts` must continue to report exactly
the documented modified-file allowlist.

The current peer contract is React/React DOM 17 and exists for the historical
editor integration. It is not a claim of standalone React 19 compatibility even
though the containing web application build is tested. Do not broaden the peer
range or publish this package without a dedicated compatibility and licensing
review; the package is intentionally marked `private`.
