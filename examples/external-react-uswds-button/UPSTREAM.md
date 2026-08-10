# Upstream provenance

This directory is a minimal, unmodified fixture copied from
[`trussworks/react-uswds`](https://github.com/trussworks/react-uswds) at commit
[`03fd50acc356f793ad353b8ce93744255ef22ac7`](https://github.com/trussworks/react-uswds/commit/03fd50acc356f793ad353b8ce93744255ef22ac7).
It is used only by Compify's qualified external compatibility gate.

Upstream archive:

- URL: `https://codeload.github.com/trussworks/react-uswds/tar.gz/03fd50acc356f793ad353b8ce93744255ef22ac7`
- observed SHA-256: `a77eb7eb6d04cf4016f8ae0b8a03ccaca629a01725bc178cc6e569917e215100`

Copied files and SHA-256 digests:

| File | SHA-256 |
| --- | --- |
| `LICENSE` | `a6cba85bc92e0cff7a450b1d873c0eaa2e9fc96bf472df0247a26bec77bf3ff9` |
| `package.json` | `7031107e1ec3c6bae64c41a0b1015af0032f5302bb15999340f41e0fb0348388` |
| `src/components/Button/Button.stories.tsx` | `a829e6ed810f5864222649595523ab1d2d248d0277b940bf0bafe4c58f1d0c93` |
| `src/components/Button/Button.tsx` | `2b7df31389ffd92912115396ec7253fdfa3f5a63493dddef3fd0331358b951bc` |

The copied files are unmodified and remain under the included Apache-2.0
license. Upstream had no `NOTICE` or `NOTICE.md` at the selected commit. The
local `UPSTREAM.md` is Compify documentation, not an upstream file.

## Evidence boundary

The gate selects `DefaultButton`, statically exports its one-file component
graph, installs it with pinned shadcn into the pinned clean Next.js consumer,
imports and renders it from that consumer's page, and requires a production
build. It is install/type/bundle-build evidence only.

The component emits USWDS class names but its stylesheet is loaded by upstream
Storybook preview configuration, outside the selected component graph. The
installed result is therefore not styled as USWDS unless a consumer separately
provides that CSS. This fixture is not visual, runtime-behavior, accessibility,
upstream-endorsement, adoption, or general compatibility evidence.
