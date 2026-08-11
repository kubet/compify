# @compify/storybook

A thin, renderer-neutral Storybook manager addon/preset that explains the selected story's Compify portability and distribution metadata. It adds a **Compify** panel and toolbar status; it does not render, test, serialize, or publish stories.

Packed-package selection is tested with Storybook 8.6.14, 9.1.20, and 10.2.10 as described below. It does not depend on `compify-pack`.

## Availability and installation

This package and the matching CLI workflow are present in repository source.
The repository's `v0.1.0` GitHub source tag already contains a CLI `0.2.0`
manifest. npm independently serves an older `@compify/cli@0.1.0` from different
source history; those are distinct historical artifacts. The current CLI
`0.2.0` and this addon's `0.1.0` manifests identify source candidates, not
published packages. The project-operated default API is a public alpha rather
than a generally available managed service or SLA. If an addon package release
is explicitly announced, install it with:

```sh
bun add -D @compify/storybook
```

Otherwise build/link it from this repository:

```sh
cd packages/storybook
bun install --frozen-lockfile
bun run build
bun link
# In the Storybook project: bun link @compify/storybook
```

Add the preset to `.storybook/main.ts`:

```ts
export default {
  addons: ["@compify/storybook"],
};
```

The package is Bun-managed and includes a Bun lockfile. The preset selects Storybook 8's legacy manager API entry or Storybook 9–10's consolidated manager API entry at startup. React is used only in the Storybook manager; this does not constrain your preview renderer.

## Story parameters

```ts
import type { CompifyParameters } from "@compify/storybook/parameters";

const compify = {
  status: "portable",
  component: "@acme/button",
  registry: "https://registry.example.com/r/acme/button.json",
  installCommand: "bunx shadcn@4.16.2 add https://registry.example.com/r/acme/button.json",
  previewUrl: "https://storybook.example.com/?path=/story/button--primary",
  reasons: ["Uses only public package dependencies"],
} satisfies CompifyParameters;

export const Primary = {
  parameters: { compify },
};
```

Supported statuses are `portable`, `partial`, `not-portable`, and `unknown`. Commands are shown as text and are never executed. `cli.setupCommand`, `cli.installCommand`, and a project-specific `cli.publishCommand` may override displayed guidance.

If metadata is missing, the panel shows the static CLI workflow. The CLI must
likewise be built from this repository or installed from an explicitly
announced release that contains the Storybook commands; the published `0.1.0`
does not. The commands do not claim that a managed publish target is available.

Once a CLI release containing the Storybook commands is explicitly announced,
Bun can run it without a global install
(`bunx @compify/cli storybook inspect ...`) or install it with
`bun add -g @compify/cli`. The published `0.1.0` CLI does not contain this
workflow. From repository source, run `bun install && bun run build && bun link`
in `packages/cli`, then invoke the linked `compify` executable.

```sh
# Inspect first; add --json for machine-readable diagnostics.
compify storybook inspect src/components/Button.stories.tsx --json

# Optionally create a reviewable registry item.
compify storybook export src/components/Button.stories.tsx \
  --name button --output .compify/button.registry.json

# After review, target an operator-controlled self-hosted API and publish privately.
COMPIFY_API_URL=https://api.example.com compify login -t <token>
COMPIFY_API_URL=https://api.example.com compify storybook publish \
  src/components/Button.stories.tsx \
  --publishing-name button --visibility private
```

The publish target must implement the current-source
`POST /cli/publish-story` contract. The default `https://api.compify.app`
currently exposes that route as a project-operated public alpha; the explicit
URL above selects a self-hosted API instead. Alpha availability is not a
managed-service SLA, and self-hosted service obligations belong to its operator.
The story path may be omitted only when exactly one supported `*.stories.*` file can be inferred. Other relevant flags include `--cwd`, `--description`, `--visibility public|private|unlisted`, and `--json` on inspect/publish. After publishing, set the registry address, install command, and preview URL in `parameters.compify`; the addon does not synchronize these automatically.

## Compatibility matrix

The package tests the preset selector and packed-package export resolution for these lines:

| Storybook line | Tested version | Manager entry |
| --- | --- | --- |
| 8 | 8.6.14 | `@storybook/manager-api` legacy adapter |
| 9 | 9.1.20 | `storybook/manager-api` adapter |
| 10 | 10.2.10 | `storybook/manager-api` adapter |

These are packaging/selection tests, not full browser integration tests for every framework combination. The addon ships Storybook 8's legacy `@storybook/manager-api` compatibility dependency; the preset checks that the selected adapter is resolvable and fails with a clear error otherwise. The addon makes no compatibility claim outside Storybook `>=8 <11`.

## Privacy and scope

This phase is intentionally manager-only:

- reads only explicit `parameters.compify` metadata for the selected story
- makes no network requests
- never reads credentials, environment variables, component/story source, or files
- never executes displayed CLI commands or uploads content itself
- provides no local bridge or preview-to-host communication
- does not duplicate Storybook rendering or testing

Only HTTP(S) preview URLs become clickable links. Other values remain inert text.

## Development

```sh
bun install
bun test
bun run typecheck
bun run build
bun run test:package
```

## License

Repository states of this package containing the current notice are
`AGPL-3.0-only` and include the preferred source and build configuration in the
package tarball. Earlier MIT-licensed source candidates retain their prior
grant. See the repository `LICENSING.md` for the transition boundary and
commercial licensing contact.
