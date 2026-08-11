# Sharp/libvips corresponding source

Compify's API and web runtime images install the platform-specific
`@img/sharp-libvips-*` package selected by the frozen Bun lock. Version `1.3.2`
of these packages identifies upstream Git commit
[`4da6d14c0d59866adfb9d8cf52bcaa53846dc4f6`](https://github.com/lovell/sharp-libvips/commit/4da6d14c0d59866adfb9d8cf52bcaa53846dc4f6)
and conveys libvips `8.18.3` plus the dependency versions recorded by that
source tree.

Exact complete build source, scripts, dependency versions, and platform files
are available without charge as a Git archive:

<https://github.com/lovell/sharp-libvips/archive/4da6d14c0d59866adfb9d8cf52bcaa53846dc4f6.tar.gz>

The prebuilt shared libvips library remains separate from Sharp's native addon
in the installed `@img` packages, so a recipient can replace it with a
compatible rebuilt library. See the upstream `build.sh`, `build/`, `platforms/`,
and `versions.properties` material for the corresponding build procedure.

The distributed binaries are `LGPL-3.0-or-later` and contain dependencies under
the terms listed in `sharp-libvips-THIRD_PARTY_NOTICES.md`. The LGPLv3 and
incorporated GPLv3 texts are included at `LGPL-3.0-or-later.txt` and
`GPL-3.0-only.txt`. Release automation must verify the actual platform package,
version, integrity, embedded libvips version, and source commit for every image;
this record must be updated if the frozen Sharp platform package changes.
