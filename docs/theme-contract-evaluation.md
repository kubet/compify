---
title: Authored theme contract evaluation
description: Internal evidence, compatibility boundary, and stop gates for Compify's legacy component-scoped themes.
---

# Authored theme contract evaluation

Status: internal evidence and hardening boundary, not a released package or product commitment.

Evidence snapshot: 2026-08-08, verified main and production `82c1fc0084d04ded10d505b7f2fa6c3bdef1e634`.

## Decision

Do not create or publish `@compify/theme` yet. Compify has enough source evidence to
close unsafe nested API inputs, but not enough real authored-theme evidence to freeze a
portable package contract. The verified production database contains one blank theme
(`factors: []`, `groups: {}`, `values: []`), while the earliest retained off-host
production backup inspected for this evaluation contains no themes. Shipped fixtures
and editor code demonstrate implementation compatibility; they are not customer
adoption, portability, willingness-to-pay, or product-market-fit evidence.

The deployed safe step is an internal authored-content boundary shared by HTTP
writes and component forks. It validates the shapes the existing editor actually
uses and stops persisting derived `c` fields. It does not add a token platform, DTCG
import/export, theme CLI, modes, plugins, transformations, signing, or visual/runtime
claims. npm publication, tags, and releases remain paused.

## Evidence in the current implementation

- Persistence only constrains the outer JSON kinds in
  `apps/api/src/entities/project/theme.entity.ts`; nested content was historically
  accepted as `any`.
- `apps/api/src/models/theme/insert-theme.dto.ts` preserves the one supported legacy
  container normalization: exact empty `groups: []` becomes `{}`.
- The editor creates factor types `hue`, `saturation`, `lightness`, `slider`, and
  `value`; group types `palette`, `value`, and `values` all occur in shipped code or
  fixtures.
- Authored token values may be strings (including an unfinished empty draft) or finite
  numbers. Factor `min` and `max` are optional, and zero is meaningful.
- `c` is not authored authority. `ThemeCompiler` derives it from `value`, and the CSS
  and flat-JSON emitter consumes the derived result. Incoming or stored `c` may be
  absent or stale.
- Resolution currently recognizes direct `--token`, meta `${token}` and
  `${--token}`, a legacy numeric suffix, bounded arithmetic, and bounded `calc(...)`.
  Factor tokens precede canonical group-option tokens, which precede value tokens.
  Existing factor/value key overlap is therefore temporarily factor-first.
- Application values export. Public group options export under the canonical
  `group-option` name and, temporarily, the deprecated unprefixed option alias.
  Factors and private groups remain resolution inputs rather than direct exports.

These observations describe legacy behavior; they do not establish a general token
standard or compatibility with arbitrary CSS, Tailwind, DTCG, Tokens Studio, Figma,
Style Dictionary, Theo, or Terrazzo inputs.

## Compatibility-safe authored ingress

The internal write boundary accepts only:

- outer factor and value arrays plus a group object (and exact legacy `groups: []`);
- safe names matching `^[A-Za-z_][A-Za-z0-9_-]{0,63}$`, excluding `__proto__`,
  `prototype`, and `constructor`;
- the shipped factor and group types listed above;
- string or finite-number values, boolean-or-absent `isPublic`, and finite ordered
  factor bounds;
- optional legacy string-or-finite-number `c` only as a migration input, which is discarded before storage;
- the existing factor/value overlap, while rejecting ambiguity within namespaces,
  canonical group-option collisions, and public export-alias collisions.

It rejects malformed nested containers, missing required fields, other unknown nested
properties, unsafe names, non-boolean publication flags, non-finite or reversed
bounds, excessive counts, and sources over the existing one-mebibyte write ceiling.
Validation does not claim that references resolve, CSS is visually correct, the
cascade is understood, or a runtime rendered successfully. Reference-language
replacement requires representative authored fixtures and exact cross-runtime golden
parity before it can move into a package.

Customer CSS, Tailwind configuration, DTCG/token repositories, and application code
remain canonical. Compify's stored theme is component-scoped editor input, not an
authority over those sources.

## Offline styling-contract replay

The first preregistered public-source technical replay used the MIT-licensed,
archived Shopify Polaris token change `a982763` with ten frozen story selections.
All 40 repeated base/head commands were byte-repeatable, but 0/10 head selections
inspected: nine failed closed on inherited TypeScript configuration outside the
bounded static alias contract, and one frozen story export did not exist. The
seven-of-ten inspectability gate therefore stopped the replay before handoff,
build, sidecar, or receipt evidence. All ten outcomes remain `unknown`.

This is a negative technical result, not a VTR or demand result. It does not
justify widening tsconfig evaluation or building a token graph. The exact
preregistration, denominator, logs, manifest, and checksums are retained under
[`evidence/theme-release-assurance/`](evidence/theme-release-assurance/).

## Candidate package gate

A private `packages/theme` experiment may start only when all of the following exist:

1. at least two sanitized, non-demo authored sources from qualified teams, covering
   the same concrete factor/group/value behavior;
2. explicit permission to retain those sources as bounded compatibility fixtures;
3. golden proof that one dependency-free, browser-safe implementation replaces both
   current compiler paths without changing authored input, generated CSS, or flat
   JSON bytes;
4. the same parser used before API persistence so a package would replace duplication
   rather than add a third implementation;
5. deterministic failure on cycles, depth/count/byte exhaustion, collisions, and CSS
   injection, with no partial output;
6. a clean browser bundle and packed-consumer test with no Node built-ins, DOM/React
   dependency, filesystem, network, locale, time, or execution of customer code.

Even then the smallest candidate is parse, compile, and emit for the observed legacy
shape. Rename/edit operations, DTCG import, modes, plugins, a CLI, registry integration,
visual comparison, and signing stay out of v1.

Stop or keep the work as an internal validator if representative sources cannot be
projected after deleting only derived `c`; compiler outputs differ across runtimes or
input order; accepted inputs cannot be bounded; the API continues persisting derived
fields; or qualified pilots do not independently need source portability. Theme
Release Assurance recruitment, pricing, activation, repeat, renewal, and kill gates
remain defined in `docs/product-market-fit.md`; no outreach starts without explicit
owner approval.

## Evidence categories remain separate

A valid authored source is schema evidence only. A deterministic CSS/JSON emission is
static build evidence only. Neither is cascade, scope, runtime, visual, accessibility,
deployment, adoption, retention, willingness-to-pay, or PMF evidence. Digest matching
would prove byte equality only, not signature or third-party attestation.
