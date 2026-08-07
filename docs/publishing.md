---
title: Publishing components
description: Review and publish an explicitly selected component artifact.
---

Publishing is a distribution step, not an authoring step. For Storybook-backed
components, keep the implementation, stories, tests, and docs in the upstream
repository. Select and inspect one supported story file deliberately.

## Storybook source

```bash
compify storybook inspect src/components/Button.stories.tsx --json
compify storybook export src/components/Button.stories.tsx \
  --output .compify/button.registry-item.json
```

The CLI infers the installable component entry from the CSF default meta
`component` import. If the story cannot express that local relationship, pass
`--component-entry src/components/Button.tsx` to inspect, export, or publish.
The story file and Storybook-only dependencies are not installed.

Review the exported JSON and component source before publishing. Then authenticate against
the API you operate and publish the same explicit selection:

```bash
COMPIFY_API_URL=https://api.example.com compify login -t <token>
COMPIFY_API_URL=https://api.example.com compify storybook publish \
  src/components/Button.stories.tsx \
  --publishing-name button --visibility public
```

`https://api.example.com` must be a self-hosted deployment of the current source
release candidate, including `POST /cli/publish-story`. The CLI default points
to an API that does not currently expose this endpoint, so a bare `login` /
`storybook publish` sequence will not work. `--api-url` is an equivalent global
option and must appear before `storybook`, for example
`compify --api-url https://api.example.com storybook publish ...`.

Visibility is explicit: `public` is registry-indexed, `unlisted` is available by
direct address but omitted from discovery/index surfaces, and `private` is
restricted to its owner. This does not imply a managed hosted endpoint or a
package-registry release.

See [Storybook translation](./storybook.mdx) for supported input and security
boundaries. Publishing never means that Compify executed the Storybook story or
faithfully captured decorators, loaders, play functions, or runtime state.

## Existing editor path

The repository also includes a browser editor that can publish components to a
configured Compify API. Visibility and publishing-domain behavior depend on the
API deployment. Public items can be exposed as shadcn registry artifacts.

## Publishing checklist

- Inspect the intended story file; do not assume every named export is portable.
- Review generated paths, source, dependencies, publishing name, and visibility.
- Keep credentials out of the repository; use the OS keychain or
  `COMPIFY_TOKEN` in headless environments.
- Treat generated registry items as derived outputs, not the source of truth.
- Re-run inspection when story syntax or component imports change.
