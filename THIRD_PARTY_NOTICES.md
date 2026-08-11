# Third-party notices

Original Compify source in repository states containing the current notice is
distributed under `AGPL-3.0-only`; see `LICENSE` and `LICENSING.md`. Earlier
MIT-licensed repository states retain their prior grant. The following
redistributed artifacts retain their upstream terms.

## Contributor Covenant

`CODE_OF_CONDUCT.md` is adapted from Contributor Covenant version 2.1,
Copyright Organization for Ethical Source, under Creative Commons Attribution
4.0 International. The complete license is included at
`licenses/contributor-covenant-CC-BY-4.0.txt`; the document identifies its source
and modifications by adaptation.

## Sandpack derivative (`packages/compify-pack`)

`compify-pack` is a private internal derivative of CodeSandbox Sandpack v2.19.8
(commit `83a494906a61517ea597ae94b26e1972f0c67777`) and retains Apache
License 2.0. It uses a separately versioned browser-only subset of the upstream
client for runtime and static previews; the optional server-emulator adapter is
not redistributed. The complete React tree, exact client subset, modifications,
omissions, and byte-identical licenses are verified; see
`packages/compify-pack/LICENSE`, `packages/compify-pack/PROVENANCE.md`, and
`packages/compify-pack/sandpack-client/PROVENANCE.md`.
The static-preview console hook bundles `console-feed` 3.3.0 under the MIT
License; its complete notice is preserved both with the package at
`packages/compify-pack/sandpack-client/console-feed-LICENSE` and in runtime
notices at `licenses/console-feed-MIT.txt`.

The retained `ansi-to-react` utility also includes code attributed upstream to
nteract and Jupyter Classic under BSD-3-Clause. Their notices are included at
`licenses/nteract-ansi-to-react-BSD-3-Clause.txt` and
`licenses/jupyter-notebook-BSD-3-Clause.txt`.

## react-uswds compatibility fixture

`examples/external-react-uswds-button` contains four unmodified files from
TrussWorks' `react-uswds` at commit
`03fd50acc356f793ad353b8ce93744255ef22ac7`, used only as a qualified external
compatibility fixture. The files remain under Apache License 2.0. Exact upstream
provenance and checksums are recorded in
`examples/external-react-uswds-button/UPSTREAM.md`; the complete license is at
`examples/external-react-uswds-button/LICENSE`.

## Next.js template assets

Five default SVG assets in `packages/templates/dark-solar-saas/public` are
byte-identical to the `create-next-app` template at Next.js tag `v15.5.23` and
retain Vercel's MIT terms. Exact checksums and paths are in
`packages/templates/dark-solar-saas/UPSTREAM.md`; the license is at
`licenses/nextjs-MIT.txt`. Names and logos retain their owners' trademark rights.

## Tailwind CSS browser compiler

`apps/web/src/utils/tailwindv4.js` contains a bundled Tailwind CSS browser
compiler identified by the artifact as version 4.0.0. Tailwind CSS is Copyright Tailwind Labs, Inc. and distributed under the MIT
License. The complete copyright and permission notice is included at
`licenses/tailwindcss-LICENSE`.

## SUSE font

`apps/web/public/fonts/SUSE.ttf` and `apps/api/files/SUSE.ttf` redistribute the
SUSE typeface under the SIL Open Font License 1.1. The license text is included at `apps/web/public/fonts/OFL.txt` and
`apps/api/files/OFL.txt` so it remains present in both runtime images.

## Sharp/libvips runtime

The API and web images use Sharp with platform-specific prebuilt libvips
`8.18.3` packages version `1.3.2`, distributed under
`LGPL-3.0-or-later` together with dependencies under the licenses listed in
`licenses/sharp-libvips-THIRD_PARTY_NOTICES.md`. Exact complete source and build
material are pinned in `licenses/SHARP-LIBVIPS-SOURCE.md`; the LGPLv3 and
incorporated GPLv3 texts are included at `licenses/LGPL-3.0-or-later.txt` and
`licenses/GPL-3.0-only.txt`.

Dependency packages installed from the Bun lockfiles retain their respective
licenses. Shipped dependency trees include permissive, MPL, and LGPL components
whose notice, source, relinking, or other obligations are not replaced by the
Compify license or a commercial agreement. Generate and review an SBOM for each
platform-specific package and image so the exact transitive inventory and
required license/source payload match that artifact.
