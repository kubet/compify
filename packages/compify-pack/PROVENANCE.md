# Vendored Sandpack provenance

`compify-pack` is a modified vendored fork of CodeSandbox Sandpack's
`sandpack-react` package. Upstream is licensed under Apache-2.0; the exact
upstream license is preserved in [`LICENSE`](./LICENSE).

## Reconstructed upstream baseline

The source baseline is **CodeSandbox Sandpack v2.19.8**, commit
[`83a494906a61517ea597ae94b26e1972f0c67777`](https://github.com/codesandbox/sandpack/commit/83a494906a61517ea597ae94b26e1972f0c67777),
whose annotated `v2.19.8` tag object is
`326741a498c0cfb49a72106c1ac5cd89d77d1527` (2024-09-12).

This mapping was reconstructed on 2026-08-08 rather than guessed: a recursive
comparison of the complete `sandpack-react/src` tree at that immutable commit
against this fork found identical paths/content except the 14 locally modified
files listed below. The upstream license is byte-identical. CI runs
`scripts/verify-sandpack-provenance.ts`, which downloads the immutable commit,
repeats the complete-tree comparison, rejects any undocumented changed/missing/
extra path, and requires a modification notice in every changed file.

The package was first imported into this repository in Compify commit
`9e09d19393942870722dd089f34e394fb075d03a` on 2026-08-05. Later Compify Git
history remains the authority for each local patch after import.

## Modified upstream source files

Each carries a prominent `Modified by Compify` notice and differs from v2.19.8:

- `src/components/CodeEditor/CodeMirror.tsx`
- `src/components/CodeEditor/__snapshots__/useSyntaxHighlight.test.tsx.snap`
- `src/components/FileTabs/FileTabs.test.tsx`
- `src/components/FileTabs/index.tsx`
- `src/components/Preview/index.tsx`
- `src/components/Tests/FormattedError.tsx`
- `src/components/common/ErrorOverlay.tsx`
- `src/components/common/Loading.tsx`
- `src/components/common/LoadingOverlay.tsx`
- `src/contexts/sandpackContext.tsx`
- `src/contexts/utils/useClient.ts`
- `src/contexts/utils/useFiles.ts`
- `src/presets/Sandpack.tsx`
- `src/utils/useAsyncSandpackId.ts`

The changes cover Compify editor/preview behavior, loading/error presentation,
client/file synchronization, ID handling, CodeMirror compatibility, file-tab
keyboard/accessibility behavior, and corresponding tests/snapshots. Package name,
build/distribution metadata and Compify-specific integration files outside the
upstream `src` tree also differ intentionally.

## Sync procedure

Future upstream syncs must:

1. record the exact upstream commit/tag here;
2. preserve the Apache-2.0 license and any new applicable upstream NOTICE;
3. reapply and review local changes rather than copying an unidentified tree;
4. keep prominent modification notices on every changed upstream file;
5. update the verifier's expected changed-path allowlist; and
6. pass typecheck, build, tests, package-content checks and license review.

The repository root MIT license applies to original Compify code and does not
replace Apache-2.0 for this derivative.
