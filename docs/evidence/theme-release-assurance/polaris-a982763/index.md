---
title: Polaris a982763 offline replay result
description: Negative technical result from a preregistered public-source styling-contract replay.
---

# Polaris `a982763` offline replay result

**Result: technical kill gate triggered.** This is a public OSS historical
fixture, not a VTR, pilot, customer, partner, endorsement, production-adoption,
or PMF result.

The preregistration is commit
`b6d5c70063ef409717198488b40a31828d13d992`. It froze ten `Default` story
exports, the real historical token change
[`a982763`](https://github.com/Shopify/polaris-react-archive/commit/a9827635844e9c43093c901966dbe8b623380e96),
its parent, two repeated inspect runs per revision, and a minimum seven-of-ten
inspectability gate before any destination handoff.

All 40 failure results were byte-repeatable, but no run produced inspect JSON, so the preregistered semantic-JSON equality check was not applicable and did not pass. **0/10** head selections inspected:
nine failed closed because the source package extends TypeScript configuration
outside Compify's bounded static alias contract, and the preregistered `Text`
`Default` export does not exist. All ten remain `unknown`; none is classified
not impacted. Because the 70% gate failed, the replay stopped before installs,
builds, style sidecars, receipts, or mutation checks. No replacements or source
repairs were made.

This negative result shows that the current styling-contract CLI is not yet
technically usable on this frozen Polaris source without widening an intentional
static boundary. It does **not** show demand for that widening. Do not implement
inherited-tsconfig support, a token graph, or broader theme tooling until a
qualified team presents the same blocked job and accepts the security/fidelity
tradeoff.

- Repository file `manifest.json` contains the complete denominator, classifications, source and
  tool SHAs, gate result, and explicit unattempted evidence.
- Repository file `inspect-runs.jsonl` retains every normalized command, exact stdout/stderr,
  exit code, and byte digest for both source revisions.
- Repository file `SHA256SUMS` binds the replay files and preregistration snapshot. It is a byte
  integrity check, not a signature or attestation.

Official runs used `NO_COLOR=1` with `FORCE_COLOR` unset. The manifest records the exact executable and lockfile digests, build recipe, and source-diff byte recipe.

Shopify Polaris is MIT-licensed and archived; no source code is copied here.
See the pinned [license](https://github.com/Shopify/polaris-react-archive/blob/a9827635844e9c43093c901966dbe8b623380e96/LICENSE.md).
