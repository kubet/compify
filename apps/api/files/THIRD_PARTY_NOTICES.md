# Third-party notices

Compify's original source is distributed under the repository MIT license.
The following redistributed artifacts retain their upstream terms.

## Sandpack derivative (`packages/compify-pack`)

`compify-pack` is a derivative of CodeSandbox Sandpack and is distributed under
the Apache License 2.0. See `packages/compify-pack/LICENSE` and
`packages/compify-pack/PROVENANCE.md`.

## Tailwind CSS browser compiler

`apps/web/src/utils/tailwindv4.js` contains a bundled Tailwind CSS browser
compiler identified by the artifact as version 4.0.0. Tailwind CSS is Copyright Tailwind Labs, Inc. and distributed under the MIT
License. The complete copyright and permission notice is included at
`licenses/tailwindcss-LICENSE`.

## SUSE font

`apps/web/public/fonts/SUSE.ttf` and `apps/api/files/SUSE.ttf` redistribute the
SUSE typeface under the SIL Open Font License 1.1. The license text is included at `apps/web/public/fonts/OFL.txt` and
`apps/api/files/OFL.txt` so it remains present in both runtime images.

## node-webpmux

The API directly redistributes `node-webpmux`, Copyright ApeironTsuka, under
LGPL-3.0-or-later. Its source is available at
<https://github.com/ApeironTsuka/node-webpmux>. The complete license is included
at `licenses/node-webpmux-COPYING.LESSER` and in the installed package.

Dependency packages installed from the Bun lockfiles retain their respective
licenses. Generated SBOMs should be produced for each release artifact so the
exact transitive dependency inventory matches that release.
