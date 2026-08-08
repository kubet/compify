---
title: CLI reference
description: Inspect Storybook source and manage Compify components with the Bun-powered CLI.
---

The current source/release candidate provides local Storybook translation and
the existing Compify component-management commands. Package-registry or managed
hosted-service availability is not implied.

## Build from source

```bash
cd packages/cli
bun install --frozen-lockfile
bun run build
bun link
```

## Storybook commands

All four commands accept an optional story-file argument. When it is omitted,
the CLI searches under `--cwd` and proceeds only if exactly one matching story
file exists. Common options are `--cwd`, `--name`, `--description`,
`--publishing-name`, `--component-entry <path>`, and `--visibility` (`private`,
`public`, or `unlisted`; default `private`). The CLI normally infers the
installable component entry from the CSF default meta `component` import;
`--component-entry` provides an explicit override when that is not possible.
Use `--story <export-name>` to select one exact named story export; without it,
all named stories in the file must be portable. `public` items are indexed,
`unlisted` items are direct-address only, and `private` items are owner-only.

### `compify storybook inspect [entry]`

Statically parse a React CSF2/CSF3 story and report discovered stories, the
separate installable component graph, declared dependencies, provenance, a deterministic digest, and
portability diagnostics.

```bash
compify storybook inspect src/Button.stories.tsx
compify storybook inspect src/Button.stories.tsx --story Primary
compify storybook inspect src/Button.stories.tsx --json
```

`--json` emits machine-readable output. It also includes a `styleContract`
observation containing literal CSS `var(--name)` uses, fallbacks, bundled
custom-property definitions, and source locations. This scan is deliberately
incomplete: it does not execute CSS, preprocessors, JavaScript, Storybook, or a
browser, and it does not prove cascade, scope, selector, layer, media, import
order, or runtime availability. Inspection exits unsuccessfully when it reports
an error diagnostic.

### `compify storybook export [entry]`

Translate the bundle into a local shadcn registry item.

```bash
compify storybook export src/Button.stories.tsx \
  --story Primary --output .compify/button.registry.json
```

`-o, --output <file>` chooses the path; otherwise the CLI writes
`<component-name>.registry.json`. Existing files are refused unless `--force`
is present.

### `compify storybook handoff [entry]`

Export a selected portable story and install it with native pinned
`shadcn@4.16.2` into an explicitly separate, already initialized consumer.
No publish request is made. On success it writes a deterministic, digest-signed
receipt containing its `installed` or `built` evidence level, exact
installer/build argv, and hashes of consumer changes. Consumer snapshots are
bounded to 10,000 entries, 64 directory levels, and 256 MiB; ignored dependency
and build directories are not traversed, symlinks are never followed, and
special files are not opened. Existing artifact or receipt files are never
overwritten. If installation or build fails, no success receipt is written and
the CLI removes only the unchanged artifact inode it created so a retry is not
blocked. Native tools may already have changed consumer files; review the working
tree before retrying.

```bash
compify storybook handoff src/Button.stories.tsx --story Primary \
  --consumer ../consumer-app \
  --build-command bun --build-arg run --build-arg build
```

The required consumer must be outside the source package tree and contain both
`package.json` and `components.json`. Build arguments are repeatable argv values;
commands are never interpreted by a shell. Defaults are
`.compify/<name>.registry.json` and `.compify/<name>.handoff.json`; override them
with `--output` and `--receipt`.

Handoff also writes `.compify/<name>.style-contract.json` before reporting
success; `--style-contract-output <file>` selects another path. The sidecar adds
bounded, pre-install consumer definition candidates only for variables that are
used by the selected bundle and not defined inside it. Candidates remain
observations, not proof that a value reaches the component. The sidecar binds to
the existing source bundle digest but is intentionally excluded from established
registry, publish, and handoff-receipt digest schemas; treat it as review input,
not signed runtime or visual evidence.

### `compify storybook publish [entry]`

Translate and publish the bundle to the configured Compify API. Authentication
is required.

```bash
COMPIFY_API_URL=https://api.example.com compify storybook publish \
  src/Button.stories.tsx --publishing-name button --visibility public
```

The target must be a self-hosted current-source deployment containing
`POST /cli/publish-story`; the CLI default API does not currently expose that
endpoint. `--json` emits the server response. Export and publish both refuse
bundles with error diagnostics or non-portable selected stories. When `--story`
is omitted, every named story in the file is selected and must be portable.
The story source and Storybook-only dependencies are metadata inputs and are not
included in the installable component files. The API independently verifies the deterministic payload digest.

The parser does not import or execute the story module. See
[Storybook translation](./storybook.mdx) for the supported CSF subset and
limitations.

## Authentication and API selection

```bash
COMPIFY_API_URL=https://api.example.com compify login -t <token>
compify --api-url https://api.example.com login -t <token>
COMPIFY_API_URL=https://api.example.com compify list
```

For Storybook publishing, always select the self-hosted release-candidate API
explicitly; bare commands use the default API where the publish endpoint is not
currently deployed. `login` validates the token before storing it in the OS keychain. For headless
environments, set `COMPIFY_TOKEN`. Global options such as `--api-url` and
`--web-url` must appear before the subcommand.

## Existing component commands

- `compify init` — create `compify.json`; use `-y` for defaults and `-p <path>`
  for the component directory.
- `compify add [components...]` — add by component id or `@owner/name`.
  Supports `--yes`, `--overwrite`, `--path`, `--flat`, `--cwd`, and `--silent`.
- `compify list` — list components for the authenticated account; supports
  `--json` and `--silent`.
- `compify info` — show project and installed state; supports `--json`.
- `compify diff [componentId]` — compare installed source with the registry.
- `compify migrate [componentId]` — update installed source; backups are enabled
  by default.
- `compify remove [components...]` — remove files and manifest entries.
- `compify mcp` — deprecated compatibility registry MCP. Prefer the official
  shadcn MCP configured through `components.json`; no new workflow should depend
  on this command.
- `compify logout` — clear stored credentials.

Public registry items can also be installed through shadcn tooling; see
[Registry](./registry.md).
