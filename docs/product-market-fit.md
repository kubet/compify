---
title: Product-market-fit evidence plan
description: Market signals, target users, alternatives, falsification tests, and 90-day measures for the Storybook wedge.
---

_Last evidence review: 2026-08-07. This is a research plan, not proof of demand or product-market fit._

## Hypothesis and narrow wedge

Teams that already treat **React Storybook** as the source for component examples,
tests, and documentation may have a narrower unsolved job: select a component
they own and distribute reviewable source through a shadcn-compatible registry.
Compify can reduce that work without asking the team to migrate its authoring
workflow or trust runtime execution of story files.

The proposed sequence is deliberately small:

1. start with an existing, intentionally selected React CSF file;
2. statically inspect the supported source boundary and show failures;
3. export a deterministic registry artifact for human review; and
4. install that source into a different application with the existing shadcn
   workflow.

This is a **wedge hypothesis**, not a claim that every Storybook is a component
marketplace, that a story is automatically distributable, or that Compify has
solved dynamic Storybook behavior. Current behavior and limitations are documented
in [Storybook translation](./storybook.mdx); proposed research and metrics below
are not shipped telemetry or managed-service promises.

## Directional ecosystem signals

These are reach and activity proxies. Downloads are package downloads (including
CI, caches, repeated installs, mirrors, and transitive use), stars/forks are GitHub
actions, sitemap entries are catalog pages, and issues are individual reports.
**None is a count of users, teams, willingness to pay, or demand for Compify.**

| Dated snapshot | Directional reading | Required caveat |
| --- | --- | --- |
| The [Storybook GitHub repository](https://github.com/storybookjs/storybook) displayed approximately **90,785 stars** and **10,375 forks** on 2026-08-07. | Storybook has a large visible open-source audience and contributor/fork surface. | Stars can be old or aspirational; forks can be inactive. Neither measures current production use. |
| The npm downloads API reported **20,196,696** downloads for [`storybook`](https://api.npmjs.org/downloads/point/last-week/storybook) and **18,193,392** for [`@storybook/react`](https://api.npmjs.org/downloads/point/last-week/%40storybook%2Freact), for 2026-07-31 through 2026-08-06. | There is substantial current package-distribution activity around Storybook and its React renderer. | The packages overlap and must not be summed. Automated/repeated/transitive downloads are not unique users or React teams. |
| The same API reported **1,760,273** downloads for [`@storybook/addon-mcp`](https://api.npmjs.org/downloads/point/last-week/%40storybook%2Faddon-mcp), for 2026-07-31 through 2026-08-06. | Agent-oriented Storybook integration is receiving package activity. | A download is not configuration, successful use, retention, or demand for registry export; the addon is first-party and may be installed by automation or presets. |
| The official [Storybook addon sitemap](https://storybook.js.org/addons/sitemap.xml) contained approximately **1,038 addon detail URLs** on 2026-08-07 (1,039 `<loc>` entries including the addon index). | Storybook exposes a broad integration surface, making an addon-assisted discovery wedge plausible. | Catalog pages can be stale, duplicated, experimental, or unused; the count is not active addons or installations. |
| Storybook recommends portable [Component Story Format](https://storybook.js.org/docs/api/csf) and supports tests in the same ecosystem through [Storybook testing](https://storybook.js.org/docs/writing-tests) (reviewed 2026-08-07). | Story source is adjacent to work teams already author and review. | It does not mean arbitrary CSF is statically convertible or that all Storybook teams test this way. |
| Storybook documents an official [MCP server](https://storybook.js.org/docs/ai/mcp), described as preview/unstable and React-only at review time (2026-08-07). | Upstream component context for agents is an active ecosystem direction. | It can change by version and does not prove that Compify should duplicate MCP or that MCP solves source distribution. |
| shadcn documents [custom registries](https://ui.shadcn.com/docs/registry) and an [MCP server](https://ui.shadcn.com/docs/mcp) that consumes configured registries (reviewed 2026-08-07). | A known source-distribution format can reach developers and some agent clients. | Compatibility depends on pinned CLI/client behavior. This is not evidence that teams want another registry producer. |

The appropriate conclusion is “there is a sufficiently large adjacent ecosystem
to recruit a focused sample,” not “the market is 20 million users.” Refresh all
dynamic snapshots before external publication.

## Concrete pain evidence to investigate

Public questions and issue reports show recurring classes of friction. They are
useful prompts for interviews, not prevalence estimates, endorsements, roadmap
commitments, or proof that the reporter would adopt Compify.

### Storybook authoring, discovery, and scale

- [storybookjs/storybook#7711](https://github.com/storybookjs/storybook/issues/7711)
  asks to filter and search components by tag: discovery becomes harder as a
  catalog grows.
- [#22922](https://github.com/storybookjs/storybook/issues/22922) reports the
  Story Source addon not showing the whole story in Storybook 7.x: displayed
  examples are not always equivalent to reviewable canonical source.
- [#9828](https://github.com/storybookjs/storybook/issues/9828) asks whether CSF
  stories can be generated dynamically: real repositories exceed a purely static
  model, directly testing Compify's intentional non-execution boundary.
- [#4784](https://github.com/storybookjs/storybook/issues/4784) requests versioned
  component documentation: consumers need provenance and change/version context,
  not merely a current preview.
- [#6408](https://github.com/storybookjs/storybook/issues/6408) reports a
  `build-storybook` heap-out-of-memory failure: large-catalog build cost can make
  “just publish another Storybook” an incomplete distribution answer.

These reports span years and versions; an old or closed issue may no longer
reproduce. Interviews must ask about the current repository and current version.
Compify does not claim to solve Storybook search, docs versioning, or build memory;
the issues only motivate testing a smaller explicit-export job.

### Registry consumption, monorepos, metadata, and trust

Recent shadcn issue reports expose seams that any registry-producing workflow
must respect:

- [shadcn-ui/ui#10055](https://github.com/shadcn-ui/ui/issues/10055) reports MCP
  failing to discover `components.json` in monorepo subdirectories.
- [#10496](https://github.com/shadcn-ui/ui/issues/10496) reports the CLI overriding
  the configured style for third-party registries.
- [#10689](https://github.com/shadcn-ui/ui/issues/10689) reports a registry build
  pipeline ignoring dependency and development-dependency metadata.
- [#11002](https://github.com/shadcn-ui/ui/issues/11002) reports `add --diff` /
  `--dry-run` previewing incorrect aliases for cross-workspace monorepo files.
- [#7775](https://github.com/shadcn-ui/ui/issues/7775),
  [#7891](https://github.com/shadcn-ui/ui/issues/7891), and
  [#8323](https://github.com/shadcn-ui/ui/issues/8323) ask about or report private
  registry authentication, authenticated registry dependencies, and private
  registry URLs through MCP.

These issues argue for testing actual destinations, aliases, dependency metadata,
dry-run/review behavior, and private authentication. They do **not** establish
that Compify's current output works around upstream defects. Record the shadcn
CLI version and client in every pilot rather than claiming universal compatibility.

### Cross-project component sharing

Two Stack Overflow questions capture the job in users' own broad terms:
[“How to share react component across multiple projects?”](https://stackoverflow.com/questions/71356016/how-to-share-react-component-across-multiple-projects)
and [“What is the simplest way to share React components between projects?”](https://stackoverflow.com/questions/52956271/what-is-the-simplest-way-to-share-react-components-between-projects).
The Stack Exchange API reported **25,424** and **14,407** views respectively on
2026-08-07 ([API snapshot 71356016](https://api.stackexchange.com/2.3/questions/71356016?site=stackoverflow),
[API snapshot 52956271](https://api.stackexchange.com/2.3/questions/52956271?site=stackoverflow)).
Views are cumulative, dated, affected by search traffic, and not evidence that
readers use Storybook, prefer source copying, or want Compify.

## Target profiles and jobs to be done

### Primary: React design-system maintainer

**Qualifying shape:** owns a Storybook-backed React library; supports two or more
applications or workspaces; reviews component source; has repeated requests for
one-off adoption; and is willing to name an approved distribution boundary.
Likely environments include a monorepo design-system package or an internal
component repository consumed by several product teams.

**Job:** “When an application team asks for one supported component, let me turn
the source already represented in Storybook into an inspectable, approved
artifact, so they can adopt and own the source without my team creating a second
manual distribution workflow.”

**Success evidence:** can identify the last real handoff, select the source without
consulting Compify staff, review every included file/dependency, and approve a
second component later. Curiosity about MCP or an addon alone does not qualify.

### Primary user: consuming application engineer

**Qualifying shape:** works in a React application already using or willing to use
the shadcn CLI; needs to customize source rather than consume an opaque compiled
package; and can test the installed result in a destination different from the
source library.

**Job:** “When I need a house component, give me the reviewed implementation and
its declared dependencies through a familiar source-install workflow, so I do
not copy from rendered docs, reconstruct imports, or wait for a library release.”

**Success evidence:** understands that copied source transfers maintenance to the
consumer, reviews the diff, and gets the component running without undocumented
maintainer intervention.

### Gatekeeper: platform, security, or developer-experience engineer

**Qualifying shape:** controls CI, credentials, source publication, monorepo
conventions, or third-party tooling approval.

**Job:** “When maintainers distribute internal component source, give me a local,
deterministic, non-executing inspection and an auditable artifact boundary, so I
can evaluate exposure and automate policy without executing arbitrary stories.”

**Success evidence:** can explain included files, credential scope, failure modes,
and provenance; approves a bounded pilot rather than merely tolerating a demo.

### Secondary: agent-heavy application team

**Qualifying shape:** already uses Storybook or shadcn agent tooling for a concrete
workflow, not just experimentation.

**Job:** “When an agent needs upstream context and an approved implementation,
let Storybook MCP explain the component and registry tooling install the reviewed
artifact, without confusing context retrieval with source authorization.”

This is secondary until human-driven inspect/export/install retention is shown.
Teams without Storybook, non-React renderer teams, teams needing arbitrary dynamic
story execution, and teams satisfied by a compiled package are not the first cohort.

## Competitive and complementary boundaries

| Alternative | Its natural job | Boundary for Compify's hypothesis |
| --- | --- | --- |
| **Storybook + Chromatic** | Author, exercise, document, visually test, review, and host component stories. | Complement, do not replace. Compify must connect an explicitly approved source boundary to distribution; it should not claim visual-testing, hosting, or Storybook runtime parity. See [Storybook](https://storybook.js.org/) and [Chromatic](https://www.chromatic.com/). |
| **Bit** | A broader component platform for independently composable components, packaging, versioning, sharing, and workspaces. | Choose Compify only if a team wants a lower-migration Storybook-to-registry step. If it needs a full component lifecycle and accepts Bit's model, Bit may be the better fit. See [Bit](https://bit.dev/). |
| **Bare shadcn registry** | Native registry schema, authoring, CLI installation, and configured-registry/MCP consumption. | This is both the output substrate and the strongest “build it directly” substitute. Compify must remove repeated translation work while leaving the native artifact visible; it must not fork or obscure the standard. |
| **v0 / 21st.dev** | Discover or generate UI and move quickly from prompts/examples to application code. | Useful for creation and inspiration. The wedge instead begins with a team's already-owned, reviewed Storybook source and its provenance. Do not position Compify as a general UI generator or public component marketplace. See [v0](https://v0.app/docs) and [21st.dev](https://21st.dev/). |
| **zeroheight / Supernova** | Design-system documentation, governance, design/code coordination, and portals. | Complement or alternative for organizational documentation. Compify must not claim to replace design governance, token management, or a documentation portal. See [zeroheight](https://zeroheight.com/) and [Supernova](https://www.supernova.io/). |
| **Manual copy, snippets, or a versioned package** | Zero new tooling, or mature dependency/release semantics. | Compify must beat manual work on repeatability and review. A package remains better when consumers should not own source or need upgrades through dependency versions. |
| **Backlight** | Historically offered an all-in-one code-side design-system workspace. | Its [site states that Backlight shut down on 2025-06-01](https://backlight.dev/). Treat this as a trust warning about service longevity and exportability, not as demand transferring to Compify or permission to claim feature parity. |

## Adoption and trust blockers

1. **Source exposure:** static text can still include proprietary code, unnoticed
   credentials, customer data, or unintended transitive files. A parser's
   non-execution property reduces one risk; it does not make publication safe.
2. **Fidelity:** decorators, loaders, globals, CSS/build aliases, assets, dynamic
   imports, and generated stories may be necessary for the real component.
   A successful static inspection is not visual or behavioral equivalence.
3. **Dependency and path correctness:** monorepo aliases, peer dependencies,
   styles, registry dependencies, and consumer-specific configuration can make a
   schema-valid artifact fail after installation.
4. **Private-registry authentication:** token transport, MCP client behavior,
   transitive private dependencies, revocation, and logs must survive a real
   security review; upstream issues show this cannot be assumed.
5. **Ownership after copying:** consumers may expect package-like upgrades or
   support while maintainers intend a fork. Provenance, change policy, and the
   point where ownership transfers must be explicit.
6. **Artifact review burden:** if maintainers cannot easily see why every file and
   dependency is included, deterministic output alone will not create trust.
7. **Workflow authority:** teams may not accept a Storybook story as the right
   selection surface, or may require design, accessibility, and legal approval
   elsewhere.
8. **MCP category confusion:** context retrieval is not authorization to publish
   or install. Compify should coexist with, not impersonate, Storybook MCP.
9. **Operational confidence:** current-source build/setup, version compatibility,
   lack of a proven hosted service, and concern about vendor longevity may block
   pilots before product value is tested.

## Anti-goals for this wedge

- Replacing Storybook, Chromatic, design tools, visual regression, or component tests.
- Executing stories or promising conversion of arbitrary dynamic CSF/runtime state.
- Becoming a general-purpose package manager, design-system portal, UI generator,
  public marketplace, or source-code crawler.
- Supporting every Storybook renderer or every asset/build system before React
  demand and retention are demonstrated.
- Treating addon metadata, stars, downloads, page views, issue counts, exports,
  or generated artifacts as activated teams.
- Publishing source automatically or hiding included files, dependency metadata,
  provenance, diagnostics, or the native registry artifact.
- Claiming current shadcn, MCP, private-auth, or monorepo compatibility without a
  pinned end-to-end test in the target environment.

## Validation interviews

Recruit against the qualifying shapes above. Ask for a screen share of the last
real event before showing Compify. Separate the maintainer, consumer, and security
answers when they are different people.

1. “Tell me about the last component moved from this library into another
   application. What triggered it, and when was it?”
2. “Show me the exact source, story, docs page, ticket, or message where the
   handoff began. Which one is canonical?”
3. “What did each person do from request to working component? How long did each
   step take, and what had to be corrected?”
4. “Why was it copied rather than consumed as a package? Who owns fixes and
   upstream changes afterward?”
5. “How often did this happen in the last six months, across how many destination
   applications and distinct components?”
6. “What do Storybook, Chromatic, your package pipeline, or a registry already
   solve? Where exactly do they stop?”
7. “Which decorators, globals, styles, assets, aliases, generated stories, or
   runtime data does this example depend on?”
8. “Before source may leave this repository, who approves it and what evidence
   do they require? Which files must never be included?”
9. “Show me a recent install or copy diff. How were dependencies, paths, tokens,
   and private registry access handled?”
10. “If static inspection rejects this example rather than executing it, what
    would you change, and at what point would the restriction make the tool
    unusable?”
11. “Which alternative would you use tomorrow if this did not exist? What would
    make that alternative clearly better?”
12. “After installing the first component, what event would cause you to return
    for a second one within 30 days?”
13. “What would make you uninstall this, fail security review, or tell another
    team not to use it?”
14. “Would Storybook MCP, registry MCP, or neither participate in this workflow?
    What authority do you believe each has?”

Avoid “Would you use this?” and pricing hypotheticals until the respondent has
shown a recurring event. Strong evidence is observed repository work, a reviewed
artifact, a separate destination install, and voluntary second-component use.

## Falsification tests

Stop, narrow, or reposition the wedge if any of these hold after recruiting the
specified cohort:

1. **No recurring handoff:** fewer than 8 of 15 qualified interviews report
   copying or repackaging Storybook-backed components across applications at
   least quarterly and cannot show a recent example.
2. **No incremental value:** fewer than 5 of 10 activated teams export a second
   distinct component within 30 days.
3. **Static boundary is too narrow:** fewer than 60% of intentionally selected
   story fixtures in pilot repositories inspect successfully, or maintainers
   reject the required simplifications.
4. **Review cost dominates:** median time from first inspect to accepted artifact
   exceeds 30 minutes after onboarding.
5. **Existing alternative wins:** at least 70% of qualified teams say and
   demonstrate that direct registry authoring or a component library solves the
   job with no meaningful recurring pain.
6. **Destination reliability fails:** fewer than 70% of accepted artifacts install
   and run in a separate target application without undocumented manual repair.
7. **MCP confusion persists:** more than 20% of activated users believe Compify
   replaces Storybook MCP after onboarding and documentation revisions.
8. **Security objection blocks adoption:** 3 or more of 10 security reviews
   reject local static parsing even when no story code is executed.

Record repository shape, versions, selection rationale, and unsupported syntax
for every failure; do not inflate success by silently excluding difficult pilot
components.

## North star and 90-day scorecard

The proposed north star is **Weekly Activated Libraries (WAL)**: the count of
distinct, non-demo source libraries in a rolling seven-day window where a
qualified external team (a) successfully inspects an intentionally selected
Storybook source, (b) opens or reviews the resulting valid registry artifact,
and (c) installs that artifact into a different application. Count a source
library at most once per week; exclude employees, templates, CI retries, and
re-exporting the same artifact.

Track **Weekly Activated Storybooks (WAS)** as the Storybook-specific diagnostic:
distinct Storybook projects satisfying those same three events. WAL remains the
broader north star if one library contains multiple Storybooks; WAS reveals
whether the claimed wedge actually supplies activation. Neither metric exists as
shipped telemetry merely because it is specified here. Use consented event data
and a single identity/event dictionary.

| Measure | Day-90 target | Guardrail |
| --- | ---: | --- |
| Qualified teams completing first inspect | 20 | At least 10 bring an existing, non-demo Storybook repository. |
| Teams exporting one reviewed artifact | 12 | Export passes schema validation and is opened/reviewed by its owner. |
| Teams exporting a second distinct component within 30 days | 6 | Same external team/library identity; reruns do not count. |
| Pilot selections successfully inspected | >= 70% | Report the full denominator and unsupported-syntax categories. |
| Median first-inspect to accepted-export time | <= 20 minutes | Report setup time separately rather than silently excluding it. |
| Accepted artifacts installed into a separate application | 20 artifacts across 8 teams | Pin destination CLI/client version and confirm destination differs from source. |
| Weekly Activated Libraries at day 90 | 5 | All three activation events occur; an export alone is not activation. |
| Four-week retained teams | 5 | A new qualified inspect/export/install action occurs in week four. |
| Critical security incidents caused by parsing/publishing | 0 | Pause publishing on credential or unintended-file exposure. |

Interview every activated and abandoned pilot. At day 45, prioritize the top two
unsupported patterns only if each occurs across at least three qualified teams.
At day 90, continue only if second-component use and cross-application installs
both meet target; ecosystem size and top-of-funnel interest are insufficient.

## Source and review discipline

All counts above were captured on 2026-08-07 from the directly linked first-party
repository, npm API, Storybook sitemap/docs, shadcn docs/issues, Stack Exchange
API, vendor sites, or product sites. Issue titles and current product behavior can
change; issue existence does not mean the behavior is current. The addon sitemap
method counts `<loc>` elements and subtracts the `/addons` index for the detail
URL estimate. npm “last-week” responses identify their own 2026-07-31 to
2026-08-06 window.

For the next review, save the response date/window and methodology, re-open every
source, pin tested Storybook/shadcn/client versions, and distinguish observed
pilot behavior from public proxy metrics. Do not convert downloads, stars, forks,
URLs, views, questions, or issues into unique-user, revenue, or demand claims.
