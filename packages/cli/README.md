# Compify CLI

Compify's CLI statically packages selected React component source, using a
Storybook CSF file as the explicit selection and context boundary, into a
reviewable shadcn-compatible registry item. It also contains the existing client
commands for self-hosted Compify registries.

> [Full CLI reference](../../docs/cli.md) · [Storybook translation](../../docs/storybook.mdx) · [shadcn interop](../../docs/registry.md)

## Release status

The repository source is the current release candidate. Do not assume that
`@compify/cli` is available from a package registry until a release announcement
says so. The commands do not require a managed Compify service: local
`storybook inspect` and `storybook export` work without an account or server.

## Build from source

```bash
git clone https://github.com/kubet/compify.git
cd compify/packages/cli
bun install --frozen-lockfile
bun run build
bun link
compify --help
```

Bun 1.3.9 is the supported runtime and package manager.

## Review-first Storybook workflow

Run from the React package containing the selected story:

```bash
compify storybook inspect src/components/Button.stories.tsx
compify storybook export src/components/Button.stories.tsx \
  --story Primary \
  --output .compify/button.registry.json
```

Inspection parses source without importing or executing the story module.
Export follows supported local text imports from the component entry, records
runtime dependencies and provenance, and refuses unresolved or unsafe input.
Always review the generated JSON and test it in a separate consumer app.

Use `--component-entry <path>` when `meta.component` cannot be inferred. Use
`--json` with `inspect` for CI. See the reference for supported syntax,
diagnostic behavior, file/size limits, and exact options.

## Self-hosted publishing

Publishing is optional and targets an API you operate:

```bash
compify --api-url https://registry.example.com/api login --token <token>
compify --api-url https://registry.example.com/api storybook publish \
  src/components/Button.stories.tsx --story Primary --visibility private
```

Token creation, private-registry consumption, storage, and production hardening
are operator responsibilities. Start with [self-hosting](../../docs/self-hosting.md)
and [publishing](../../docs/publishing.md). Never publish an artifact you have
not reviewed.

## Existing registry client

The CLI also provides `init`, `list`, `add`, `diff`, `migrate`, `remove`, `info`,
`login`, `logout`, and `mcp` for an existing Compify registry. Run
`compify <command> --help` and consult the full CLI reference. Native shadcn
registry installation remains first-class; the Compify CLI is not required to
consume exported registry-item JSON.

## Development

```bash
bun run test
bun run build
```

The package is MIT licensed. Report security issues through the repository's
private vulnerability reporting flow; do not open a public security issue.
