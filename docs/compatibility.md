---
title: Compatibility and verification
description: Exact versions, evidence levels, verified fixtures, and unsupported repository shapes.
---

_Last verified: 2026-08-08. Compatibility is evidence for the exact matrix below,
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

A story marked `portable` in the current v1 wire schema means only that its
supported static args and component graph passed Compify diagnostics. It does
**not** mean decorators, loaders, play functions, preview configuration, globals,
providers, assets, aliases, rendering, behavior, or appearance were reproduced.
The wording will be narrowed in the next schema revision.

## Release-candidate matrix

| Layer | Verified version/input | Evidence |
| --- | --- | --- |
| Runtime/package manager | Bun 1.3.9 | Frozen installs, package builds and tests in CI. |
| Compify CLI | `@compify/cli@0.2.0` source candidate | Unit tests, deterministic digest cases, packed-tarball install/help smoke. |
| Storybook syntax | Synthetic classic CSF2/CSF3 `.js/.jsx/.ts/.tsx/.mjs/.cjs` cases | Static parser unit tests. This is syntax evidence, not a full Storybook runtime matrix. |
| Storybook addon | 8.6.14, 9.1.20, 10.2.10 package selectors | Packed addon resolves its manager/parameter entry points. No browser/framework integration claim. |
| Registry consumer | shadcn CLI **4.16.2** | Golden item resolves and installs through a local registry-item path. |
| Clean consumer | Next.js **15.5.23**, React/React DOM **19.2.8**, TypeScript **5.9.3** | `scripts/shadcn-consumer-smoke.ts` installs both component files and completes a clean production build. |

The consumer smoke fixture lives at `examples/consumer-next-ts`; the selected
source lives at `examples/storybook-button`. CI pins the shadcn version instead
of using `latest`. Adding a version to this table requires a committed fixture
and a passing install/build gate.

## Supported source shape today

The highest-confidence input is a single React package with:

- a classic CSF2/CSF3 file and explicit default `meta.component` bound to a
  dot-relative component import;
- an optional exact named export selected with `--story`;
- component implementation using static dot-relative text imports/re-exports;
- npm runtime imports declared in the nearest `package.json`; and
- text source/style/JSON/SVG files inside that package, below documented limits.

Use `--component-entry` when component inference is the only missing link. Review
every diagnostic and generated file. The selected story module itself is not
installed; the artifact contains the component graph plus supported static story
metadata.

## Explicitly unsupported or unproven

- CSF Next `.extend`, `Story.input`/`composed`, computed/imported factory
  configuration and MDX stories. The basic imported `preview.meta({ component })`
  plus `meta.story({ static args })` form has synthetic static-parser coverage but
  not yet a Storybook runtime fixture;
- named story re-export catalogs such as `export { X as Y } from …`;
- tsconfig `paths`/`baseUrl`, `package.json#imports`, Vite/Webpack aliases,
  workspace source imports, Yarn PnP and conditional package exports;
- local source outside the nearest package root or `workspace:*` distribution;
- arbitrary `render`, decorators, loaders, play functions, globals, preview
  providers/styles, or story-only imports;
- Sass dependency discovery, CSS `url()` closure, binary images/fonts/WASM;
- automatic `registryDependencies`, per-file shadcn type/target classification,
  consumer alias policy, monorepo routing or dependency-range compatibility;
- Vite, Remix, JavaScript-only, Tailwind-version, Windows/case, authenticated
  dependency-chain, repeat-add/update, runtime, accessibility or visual fidelity
  until fixtures are added.

Directional analysis of Carbon, Chakra, Radix Primitives, Storybook Design
System and Primer found that only roughly 29% of 701 live story files matched the
current default mechanical boundary; selecting a named static story raised that
to roughly 34%. These are research estimates, not benchmark guarantees. Modern
re-export/alias/workspace catalogs approached zero without architectural changes,
while conventional colocated single-package stories were materially better.
This is why v0.2 is a narrow pilot candidate, not general Storybook conversion.

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
