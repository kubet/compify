# Browser-only Sandpack client provenance

This package is a source-level subset of CodeSandbox Sandpack client v2.19.8 at
commit [`83a494906a61517ea597ae94b26e1972f0c67777`](https://github.com/codesandbox/sandpack/commit/83a494906a61517ea597ae94b26e1972f0c67777).
The upstream code and this derivative are licensed under Apache License 2.0;
the byte-identical upstream license is preserved as [`LICENSE`](./LICENSE).
Upstream publishes no `NOTICE` file at that revision.

The `src/clients/node` server-emulator adapter is deliberately omitted. The
remaining browser runtime and static clients are copied from the immutable
revision. Three retained paths differ: `src/clients/index.ts` rejects the
omitted server runtime, `src/clients/static/index.ts` no longer imports
server-adapter types or utilities, and `src/types.ts` defines the retained
static and compatibility message shapes without an emulator dependency. The
unneeded ambient type shim is omitted. The static console-hook build retains its
bundled `console-feed` MIT notice in [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md). The local-only
`src/clients/static/client-utils.ts` contains only the two small Apache-licensed
file-conversion/ID helpers needed by the static client, and
`src/clients/index.test.ts` proves the fail-closed loader behavior.

Repository CI runs `scripts/verify-sandpack-provenance.ts`, which downloads the
pinned archive by checksum and verifies every retained, changed, omitted, and
local-only source path plus the exact license. Builds must also pass the
remediation artifact check, which rejects the former package identifier,
license phrase, or implementation name in locks, installed production
dependencies, and browser bundles.
