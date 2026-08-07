# compify CLI reference

The `compify` CLI pulls components you (or others) published on
[compify.app](https://compify.app) into any project, tracks what's installed
in `compify.json`, and keeps components up to date.

> Agent-friendly by design: every command works non-interactively with
> `-y`/`--silent`, `info --json` emits machine-readable state, and component
> addresses are stable (`@user/name`).

## Install

```bash
bun add --global @compify/cli
# or from the monorepo:
cd packages/cli && bun install --frozen-lockfile && bun run build && bun link
```

## Authenticate

```bash
compify login             # prompts for an API token
compify login -t <token>  # non-interactive
```

Generate a token on compify.app under **Profile → CLI token**. `login` validates
the token before storing it in your OS keychain, never in the project. For
headless CI/SSH sessions, set `COMPIFY_TOKEN` instead of using the keychain.

### Use a self-hosted server

Select another API globally or with environment variables:

```bash
compify --api-url https://api.example.com login -t <token>
COMPIFY_API_URL=https://api.example.com compify list
```

Set `--web-url` / `COMPIFY_WEB_URL` as well when MCP results should link to a
self-hosted web frontend. Options must appear before the subcommand. Tokens are
isolated per API URL in the OS keychain; the hosted compify.app credential
keeps its existing keychain entry. Trailing slashes are accepted.

## Commands

### `compify init`

Create `compify.json` in the current project (`-y` for defaults,
`-p <path>` to set where component files go).

### `compify mcp`

Run a Model Context Protocol server over stdio for coding agents —
see [mcp.md](./mcp.md).

### `compify add [components...]`

Add one or more components to the current project.

```bash
compify add @vukasinkubet/prism-pricing-card   # by publishing domain
compify add uSM5tu8fZCCFKdpVEdtW2n             # by component id
compify add                                     # interactive picker (your library)
```

| Flag | Meaning |
| --- | --- |
| `-y, --yes` | skip confirmation prompts |
| `-o, --overwrite` | overwrite existing files |
| `-p, --path <path>` | target directory for component files |
| `-f, --flat` | flat files instead of a per-component folder |
| `-c, --cwd <cwd>` | run against another directory |
| `-s, --silent` | mute output |

The first `add` creates `compify.json` (component manifest + `componentPath`).

### `compify list`

List components owned by your account. Use `--json` for machine-readable output
or `--silent` to perform the request without human-readable output.

### `compify info`

Show project + installed component state. `--json` for machines:

```bash
compify info --json
```

### `compify diff [componentId]`

Check installed components against the registry; shows what changed upstream.

### `compify migrate [componentId]`

Update installed components to their latest published versions.
Backs up replaced files to `.compify-backup/` (`--backup`, on by default).

### `compify remove [components...]`

Remove installed components and their manifest entries.

### `compify logout`

Clear stored credentials.

## Per-project workflow

```bash
# once per machine
compify login

# per project
compify add @you/button @you/pricing-card
compify diff          # later: anything changed upstream?
compify migrate       # pull updates (with backups)
```

## Prefer shadcn tooling?

Public compify components are also served as shadcn registry items — see
[docs/registry.md](./registry.md). `bunx shadcn add @compify/<user>/<name>`
works without the compify CLI at all.
