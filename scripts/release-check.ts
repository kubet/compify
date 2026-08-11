import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const required = [
  "LICENSE",
  "COPYRIGHT.md",
  "LICENSING.md",
  "TRADEMARKS.md",
  "THIRD_PARTY_NOTICES.md",
  "RELEASING.md",
  "CONTRIBUTING.md",
  ".github/pull_request_template.md",
  "SECURITY.md",
  "GOVERNANCE.md",
  "SUPPORT.md",
  ".github/workflows/package-release.yml",
  "docs/compatibility.md",
  "docs/licensing.mdx",
  "docs/ecosystem-strategy.md",
  "scripts/shadcn-consumer-smoke.ts",
  "scripts/distribution-smoke.ts",
  "scripts/verify-sandpack-provenance.ts",
  "scripts/postgres-role-smoke.sh",
  "deploy/postgres-roles.sh",
  "scripts/supply-chain-check.ts",
  "examples/external-react-uswds-button/LICENSE",
  "examples/external-react-uswds-button/UPSTREAM.md",
  "examples/external-react-uswds-button/package.json",
  "examples/external-react-uswds-button/src/components/Button/Button.tsx",
  "examples/external-react-uswds-button/src/components/Button/Button.stories.tsx",
  "packages/cli/LICENSE",
  "packages/storybook/LICENSE",
  "packages/compify-pack/LICENSE",
  "packages/compify-pack/PROVENANCE.md",
  "packages/compify-pack/sandpack-client/LICENSE",
  "packages/compify-pack/sandpack-client/PROVENANCE.md",
  "packages/compify-pack/sandpack-client/THIRD_PARTY_NOTICES.md",
  "packages/compify-pack/sandpack-client/console-feed-LICENSE",
  "scripts/verify-sandpack-remediation.ts",
  "scripts/verify-compify-pack-dist.ts",
  "apps/api/files/OFL.txt",
  "apps/api/files/COMPIFY-LICENSE",
  "apps/api/files/LICENSING.md",
  "apps/api/files/TRADEMARKS.md",
  "apps/api/files/THIRD_PARTY_NOTICES.md",
  "apps/web/src/app/source/page.js",
  "licenses/tailwindcss-LICENSE",
  "licenses/LGPL-3.0-or-later.txt",
  "licenses/GPL-3.0-only.txt",
  "licenses/SHARP-LIBVIPS-SOURCE.md",
  "licenses/sharp-libvips-THIRD_PARTY_NOTICES.md",
  "licenses/contributor-covenant-CC-BY-4.0.txt",
  "licenses/nextjs-MIT.txt",
  "licenses/console-feed-MIT.txt",
  "licenses/nteract-ansi-to-react-BSD-3-Clause.txt",
  "licenses/jupyter-notebook-BSD-3-Clause.txt",
  "packages/templates/dark-solar-saas/UPSTREAM.md",
  "apps/api/files/GPL-3.0-only.txt",
  "apps/api/files/LGPL-3.0-or-later.txt",
  "apps/api/files/SHARP-LIBVIPS-SOURCE.md",
  "apps/api/files/sharp-libvips-THIRD_PARTY_NOTICES.md",
];
for (const file of required)
  if (!existsSync(join(root, file)))
    throw new Error(`release payload is missing ${file}`);

const license = readFileSync(join(root, "LICENSE"), "utf8");
if (!license.startsWith("GNU AFFERO GENERAL PUBLIC LICENSE\nVersion 3"))
  throw new Error("root LICENSE is not the complete AGPL v3 text");
for (const copy of [
  "apps/api/files/COMPIFY-LICENSE",
  "packages/cli/LICENSE",
  "packages/storybook/LICENSE",
]) {
  if (readFileSync(join(root, copy), "utf8") !== license)
    throw new Error(`${copy} differs from the root AGPL text`);
}
const copyright = readFileSync(join(root, "COPYRIGHT.md"), "utf8");
for (const copy of [
  "apps/api/files/COPYRIGHT.md",
  "packages/cli/COPYRIGHT.md",
  "packages/storybook/COPYRIGHT.md",
]) {
  if (readFileSync(join(root, copy), "utf8") !== copyright)
    throw new Error(`${copy} differs from the root copyright notice`);
}
const licensing = readFileSync(join(root, "LICENSING.md"), "utf8");
if (!licensing.includes("b0d0945c9b406c201d80528616715b699822ad03"))
  throw new Error(
    "LICENSING.md does not identify the last MIT repository state"
  );

const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
for (const [manifest, expected] of [
  ["packages/cli/package.json", "@compify/cli"],
  ["packages/storybook/package.json", "@compify/storybook"],
] as const) {
  const pkg = JSON.parse(readFileSync(join(root, manifest), "utf8"));
  if (pkg.license !== "AGPL-3.0-only")
    throw new Error(`${manifest} does not declare AGPL-3.0-only`);
  for (const sourceFile of [
    "LICENSE",
    "src",
    "tsup.config.ts",
    "tsconfig.json",
    "bun.lock",
    "scripts",
  ]) {
    if (!pkg.files?.includes(sourceFile))
      throw new Error(`${manifest} does not convey ${sourceFile}`);
  }
  if (!changelog.includes(`${expected}@${pkg.version}`))
    throw new Error(`CHANGELOG.md does not name ${expected}@${pkg.version}`);
}
const sharpSource = readFileSync(
  join(root, "licenses/SHARP-LIBVIPS-SOURCE.md"),
  "utf8"
);
if (
  !sharpSource.includes("4da6d14c0d59866adfb9d8cf52bcaa53846dc4f6") ||
  !sharpSource.includes("libvips `8.18.3`")
)
  throw new Error("Sharp/libvips source record is not pinned");
for (const lockfile of ["apps/api/bun.lock", "apps/web/bun.lock"]) {
  const lock = readFileSync(join(root, lockfile), "utf8");
  const versions = [
    ...lock.matchAll(/@img\/sharp-libvips-[^"@]+@([0-9.]+)/g),
  ].map((match) => match[1]);
  if (versions.length === 0 || versions.some((version) => version !== "1.3.2"))
    throw new Error(
      `${lockfile} does not pin Sharp/libvips platform packages 1.3.2`
    );
}

for (const lockfile of [
  "apps/web/bun.lock",
  "packages/compify-pack/bun.lock",
]) {
  const lock = readFileSync(join(root, lockfile), "utf8");
  if (lock.includes("@codesandbox/nodebox"))
    throw new Error(
      `${lockfile} still contains the non-OSI Nodebox dependency`
    );
}

const llms = readFileSync(join(root, "apps/web/public/llms.txt"), "utf8");
if (!llms.includes("AGPL-3.0-only") || !llms.includes("/source"))
  throw new Error("llms.txt does not publish the license/source boundary");

const compose = readFileSync(join(root, "docker-compose.yml"), "utf8");
if (!compose.includes("AUTH_COOKIE_SAME_SITE: ${AUTH_COOKIE_SAME_SITE:-lax}"))
  throw new Error("Compose does not pass AUTH_COOKIE_SAME_SITE");
if (!compose.includes("DB_USERNAME: compify_runtime"))
  throw new Error("Compose API does not use the fixed runtime database role");
if (
  !compose.includes("target: migration") ||
  !compose.includes("target: runtime")
)
  throw new Error("Compose does not separate migration and runtime API images");
if (!compose.includes("SOURCE_REVISION: ${SOURCE_REVISION:-}"))
  throw new Error("Compose does not publish an exact source revision");
for (const dockerfile of ["apps/api/Dockerfile", "apps/web/Dockerfile"]) {
  const docker = readFileSync(join(root, dockerfile), "utf8");
  for (const label of [
    "org.opencontainers.image.source",
    "org.opencontainers.image.revision",
    'org.opencontainers.image.licenses="AGPL-3.0-only"',
  ]) {
    if (!docker.includes(label))
      throw new Error(`${dockerfile} is missing ${label}`);
  }
}
console.log(
  "Release metadata, AGPL source/license payloads, runtime notices, and Compose auth/role separation are present."
);
