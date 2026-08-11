---
title: Compatibility and verification
description: Exact versions, evidence levels, verified fixtures, and unsupported repository shapes.
---

_Last verified: 2026-08-10. Compatibility is evidence for the exact matrix below,
not a claim about `latest` or every Storybook/shadcn project._

## Status vocabulary

Compify uses narrow terms so static analysis is not confused with runtime proof:

| Status | Meaning |
| --- | --- |
| **analyzed** | The selected CSF boundary and supported source graph were parsed without executing project modules. |
| **schema-valid** | The emitted JSON matches the registry-item structure Compify targets. |
| **shadcn-resolved** | A named, pinned shadcn CLI accepted and resolved the item. |
| **installed** | The pinned CLI wrote the expected source graph into a clean consumer. |
| **built** | That untouched consumer passed its production build. |
| **runtime/visual verified** | A separate runtime, behavioral, accessibility, or visual test passed. Compify does not currently make this claim. |

A story marked `portable` in the retained v1/v2 wire contracts means only that
its supported static args and component graph passed Compify diagnostics. It does
**not** mean decorators, loaders, play functions, preview configuration, globals,
providers, assets, aliases, rendering, behavior, or appearance were reproduced.
The wording will be narrowed in the next schema revision.

## Release-candidate matrix

These version labels identify the tested source checkout, not release status.
The repository's `v0.1.0` GitHub source tag already contains a CLI `0.2.0`
manifest, while npm independently serves an older `@compify/cli@0.1.0` from
different source history. They are distinct historical artifacts. The current
CLI `0.3.0` and addon `0.2.0` manifests below are unpublished AGPL candidates.

| Layer | Verified version/input | Evidence |
| --- | --- | --- |
| Runtime/package manager | Bun 1.3.9 | Frozen installs, package builds and tests in CI. |
| Compify CLI | `@compify/cli@0.3.0` source candidate | Unit tests, deterministic digest cases, packed-tarball install/help smoke. |
| Storybook syntax | Synthetic classic CSF2/CSF3 `.js/.jsx/.ts/.tsx/.mjs/.cjs` cases | Static parser unit tests. This is syntax evidence, not a full Storybook runtime matrix. |
| Storybook addon | `@compify/storybook@0.2.0` source candidate; 8.6.14, 9.1.20, 10.2.10 package selectors | Packed addon resolves its manager/parameter entry points. No browser/framework integration claim. |
| Registry consumer | shadcn CLI **4.16.2** | Golden item resolves and installs through a local registry-item path. |
| Clean consumers | Next.js **15.5.23**, React/React DOM **19.2.8**, TypeScript **5.9.3** | `scripts/shadcn-consumer-smoke.ts` produces `built` handoff receipts after native shadcn installs and production builds for both a relative TSX/CSS graph and exact tsconfig/baseUrl/package-import aliases. |
| Qualified external source | TrussWorks `react-uswds` Button at commit `03fd50acc356f793ad353b8ce93744255ef22ac7`, exact `DefaultButton` story | The vendored, checksummed Apache-2.0 fixture passes static inspection with a one-file graph and no diagnostics; pinned native shadcn preserves the reviewed source and declared dependency ranges; the clean consumer explicitly renders it and builds. Upstream preview CSS is outside the graph, so this is **not** USWDS styling, visual, behavior, accessibility, endorsement, or broad compatibility evidence. |
| Self-host distribution | Current Compose images, PostgreSQL 16.14, MinIO pinned releases | Account/token creation, v2 public/private publish, immutable revision retrieval, native authenticated shadcn install, destination build and revocation run against the real stack. This is operator-run baseline evidence, not managed hosting. |
| Default public API | `https://api.compify.app` public alpha (route checked 2026-08-10) | Its live OpenAPI document contains `POST /cli/publish-story`, and an unauthenticated POST fails with the expected CLI Bearer-token challenge. This is route-presence evidence, not an SLA or GA managed-service claim. |
| Browser auth | Playwright **1.62.1**, Chromium | Anonymous public/docs access, protected redirect, registration, cookie login and poisoned-forward-link rejection run against the real stack. |

The consumer smoke fixture lives at `examples/consumer-next-ts`; synthetic
sources live at `examples/storybook-button` and CLI test fixtures. The qualified
external source and its exact license/provenance hashes live at
`examples/external-react-uswds-button`. CI copies that fixture outside the
Compify Git checkout before inspection so provenance is not misattributed to the
enclosing repository. CI pins the shadcn version instead of using `latest`.
Adding a version or upstream selection to this table requires a committed,
licensed, checksummed fixture and a passing install/build gate.

## Supported source shape today

The highest-confidence input is a single React package with:

- a classic CSF2/CSF3 file and explicit default `meta.component` bound to a
  dot-relative component import;
- an optional exact named export selected with `--story`;
- component implementation using static dot-relative text imports/re-exports,
  or exact in-package aliases accepted from a non-inherited `tsconfig.json`
  `baseUrl`/`paths` or unconditional string `package.json#imports` entry;
- npm runtime imports declared in the nearest `package.json`; and
- text source/style/JSON/SVG files inside that package, including quoted
  CSS/Sass/Less import/use/forward and CSS Modules composition edges, below
  documented limits.

Use `--component-entry` when component inference is the only missing link. Review
every diagnostic and generated file. The selected story module itself is not
installed; the artifact contains the component graph plus supported static story
metadata.

## Explicitly unsupported or unproven

- CSF Next `.extend`, `Story.input`/`composed`, computed/imported factory
  configuration and MDX stories. The basic imported `preview.meta({ component })`
  plus `meta.story({ static args })` form has synthetic static-parser coverage but
  not yet a Storybook runtime fixture;
- named cross-file story re-export catalogs such as `export { X as Y } from …`;
  local export-list aliases are supported;
- wildcard/fallback/inherited tsconfig aliases, conditional or wildcard
  `package.json#imports`, Vite/Webpack-only aliases, workspace source imports,
  Yarn PnP and conditional package exports; accepted exact aliases are rewritten
  to deterministic consumer-usable relative imports;
- local source outside the nearest package root or `workspace:*` distribution;
- arbitrary `render`, decorators, loaders, play functions, globals, preview
  providers/styles, or story-only imports;
- CSS `url()` asset closure, binary images/fonts/WASM and executable style
  configuration; quoted static stylesheet module edges are supported;
- automatic `registryDependencies`, arbitrary file targets, nonstandard consumer
  aliases, monorepo routing or dependency-range compatibility. Conventional
  component, `lib`, `hook`, and `components/ui` paths receive native shadcn file
  types and are exercised by the clean-consumer gate;
- Vite, Remix, JavaScript-only, Tailwind-version, Windows/case, authenticated
  transitive registry-dependency chains, repeat-add merge behavior, runtime,
  accessibility or visual fidelity until fixtures are added. Same-domain v2
  republishing and immutable digest-addressed revision retrieval are API-tested,
  but are not a claim about consumer-side merge/update semantics.

The pre-alias resolver baseline analysis of Carbon, Chakra, Radix Primitives,
Storybook Design System and Primer found that roughly 29% of 701 live story files
matched the then-default mechanical boundary; selecting a named static story
raised that to roughly 34%. The bounded alias work has not yet been rerun across
that corpus, so those figures are historical baseline evidence, not current
acceptance measurements. These are research estimates, not benchmark guarantees. Modern
re-export/alias/workspace catalogs approached zero without architectural changes,
while conventional colocated single-package stories were materially better.
This is why the unreleased `0.2.0` source candidate is a narrow pilot, not a
released or general Storybook conversion claim.

Representative upstream shapes:

- [Carbon Button story](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Button/Button.stories.js)
- [Chakra re-export story](https://github.com/chakra-ui/chakra-ui/blob/main/packages/react/__stories__/button.stories.tsx)
- [Radix Storybook workspace story](https://github.com/radix-ui/primitives/blob/main/apps/storybook/stories/accordion.stories.tsx)
- [Storybook Design System Button](https://github.com/storybookjs/design-system/blob/master/src/components/Button.stories.tsx)
- [Primer Button story](https://github.com/primer/react/blob/main/packages/react/src/Button/Button.stories.tsx)

## Adding compatibility

A qualified fixture must prove a repeated user pattern, not merely increase a
support count. Add static graph assertions, exact diagnostics, direct registry
JSON review, pinned `shadcn view/add`, expected target mapping, typecheck and
production build. Preserve failures as regression fixtures. Runtime/visual
verification, if required, must be a separate sandboxed phase because executing
Storybook or consumer code is outside the static-inspection security boundary.
