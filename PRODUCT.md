# Compify — product direction (2026)

## The one-liner

**Your components, everywhere your agents work.** Build a component in a live
browser editor, publish it as `@you/name`, and it is instantly installable in
any project — by you, your team, or a coding agent — through the industry-
standard shadcn registry protocol, the compify CLI, and (next) MCP.

## Why this, why now

The market shifted under the original app:

1. **The shadcn registry protocol became the USB-C of UI components.**
   `registry-item.json` is how components move in 2026. v0, the shadcn CLI and
   the official shadcn MCP all consume it. Anything that serves this format is
   installable everywhere; anything that doesn't is an island.
2. **Agents are the new package consumers.** Claude Code, Cursor and Windsurf
   install UI through CLIs and MCP servers, not copy-paste. Distribution =
   being addressable by an agent in one tool call.
3. **21st.dev owns "browse 10,000 community components + AI generation".**
   Competing head-on with a catalog is a losing move at our size.

## Positioning

Compify is **the personal/team registry with a live editor**:

- **21st.dev** = discover other people's components.
- **shadcn/ui** = the protocol + a canonical library.
- **Compify** = *make and serve your own*: edit with live preview in the
  browser (the "storybook" part), publish as `@user/name`, and it's served in
  registry-item format from day one. Your design system as a service.

The editor is the moat: no other registry has publish-from-a-live-sandbox.
The registry protocol is the distribution: we adopt it rather than invent one.

## How people use it (personas)

1. **Solo dev**: curates their own library across client projects.
   `npx shadcn add @compify/me/pricing-card` in every new repo.
2. **Agent-driven dev**: adds the compify registry to `components.json` once;
   from then on their agent installs house components by name.
3. **Team (later)**: shared org namespace `@acme/*`, private registry with
   token auth (shadcn registries support auth headers natively — our paid tier).

## What ships when

**Phase 1 — speak the standard (now)**
- `GET /r/{user}/{name}.json` — shadcn registry-item endpoint ✅
- `GET /r/registry.json` — public index ✅
- Docs: registry interop, CLI reference, publishing guide ✅
- `llms.txt` for agent discovery ✅

**Phase 2 — agent-native (in progress)**
- `compify mcp` — stdio MCP server in the CLI (search / view / install tools)
  so agents without shadcn set up can still use compify directly. ✅
- Per-component agent docs (`docs` field in registry items, richer metadata). ✅
- Publish the current CLI release to npm as `@compify/cli` and automate releases.

**Phase 3 — teams & revenue**
- Org namespaces (`@org/name`) — usernames and org handles share one
  namespace pool (already unique-constrained, org table joins it later).
- Private registries with bearer-token auth → the paid tier. This maps 1:1
  onto shadcn's registries auth config, so private components work in every
  tool on day one.
- Versioned publishes (`@user/name@1.2.0`) so `compify update`/agent installs
  are reproducible.

## Decisions made

- **Orgs: not yet.** Single-user namespaces until teams actually show up.
  Schema is org-ready (unique handles, publishingDomain is `handle/name`).
- **Don't build a marketplace.** The gallery is a showcase, not the product.
- **Registry format is canonical.** The CLI's own format stays for the
  editor round-trip; everything public is also served as registry items.
