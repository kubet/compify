# Third-party notices

Original Compify source in repository states containing the current notice is
distributed under `AGPL-3.0-only`; see `COMPIFY-LICENSE` and `LICENSING.md`. Earlier
MIT-licensed repository states retain their prior grant. The following
redistributed artifacts retain their upstream terms.

## SUSE font

`SUSE.ttf` redistributes the SUSE typeface under the SIL Open Font License 1.1.
The license text is included at `OFL.txt` in the API runtime payload.

## Sharp/libvips runtime

The API and web images use Sharp with platform-specific prebuilt libvips
`8.18.3` packages version `1.3.2`, distributed under
`LGPL-3.0-or-later` together with dependencies under the licenses listed in
`sharp-libvips-THIRD_PARTY_NOTICES.md`. Exact complete source and build
material are pinned in `SHARP-LIBVIPS-SOURCE.md`; the LGPLv3 and
incorporated GPLv3 texts are included at `LGPL-3.0-or-later.txt` and
`GPL-3.0-only.txt`.

Dependency packages installed from the Bun lockfiles retain their respective
licenses. Shipped dependency trees include permissive, MPL, and LGPL components
whose notice, source, relinking, or other obligations are not replaced by the
Compify license or a commercial agreement. Generate and review an SBOM for each
platform-specific package and image so the exact transitive inventory and
required license/source payload match that artifact.
