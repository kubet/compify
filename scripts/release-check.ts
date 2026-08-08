import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const required = [
  "LICENSE", "THIRD_PARTY_NOTICES.md", "RELEASING.md", "SECURITY.md",
  "GOVERNANCE.md", "SUPPORT.md", ".github/workflows/package-release.yml",
  "docs/compatibility.md",
  "docs/ecosystem-strategy.md", "scripts/shadcn-consumer-smoke.ts",
  "scripts/verify-sandpack-provenance.ts",
  "packages/cli/LICENSE", "packages/storybook/LICENSE",
  "packages/compify-pack/LICENSE", "packages/compify-pack/PROVENANCE.md",
  "apps/api/files/OFL.txt", "apps/api/files/COMPIFY-LICENSE",
  "apps/api/files/THIRD_PARTY_NOTICES.md", "licenses/tailwindcss-LICENSE",
  "licenses/node-webpmux-COPYING.LESSER",
];
for (const file of required) if (!existsSync(join(root, file))) throw new Error(`release payload is missing ${file}`);

const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
for (const [manifest, expected] of [
  ["packages/cli/package.json", "@compify/cli"],
  ["packages/storybook/package.json", "@compify/storybook"],
] as const) {
  const pkg = JSON.parse(readFileSync(join(root, manifest), "utf8"));
  if (!pkg.files?.includes("LICENSE")) throw new Error(`${manifest} does not include LICENSE in files`);
  if (!changelog.includes(`${expected}@${pkg.version}`)) throw new Error(`CHANGELOG.md does not name ${expected}@${pkg.version}`);
}
const compose = readFileSync(join(root, "docker-compose.yml"), "utf8");
if (!compose.includes("AUTH_COOKIE_SAME_SITE: ${AUTH_COOKIE_SAME_SITE:-lax}")) throw new Error("Compose does not pass AUTH_COOKIE_SAME_SITE");
console.log("Release metadata, package licenses, runtime notices, and Compose auth configuration are present.");
