# Vendored Sandpack provenance

`compify-pack` is a modified vendored fork of
[CodeSandbox Sandpack](https://github.com/codesandbox/sandpack), principally
its `sandpack-react` package. The upstream work is licensed under the Apache
License 2.0; a copy is included in [`LICENSE`](./LICENSE).

The fork was imported into this repository in commit
`970db1e96dc2c1f5357365d24f2f3bcfa066ef06` on 2026-08-05. The source from
which that import was made did not preserve the exact upstream Git revision.
That missing historical mapping is disclosed rather than inventing a commit.
Future upstream syncs must record the upstream commit and a summary of local
changes here.

## Local changes

The package name and distribution were changed to `compify-pack`; Compify
ships a built copy for the web editor and contains local editor behavior and
compatibility changes. Use `git log -- packages/compify-pack` for the complete
post-import change history.

## Redistribution

Do not remove the upstream Apache-2.0 license when copying or distributing
this directory or its built output. The repository root MIT license applies
to original Compify code and does not replace the license of this derived
work.
