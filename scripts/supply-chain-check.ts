import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const fail = (message: string): never => { throw new Error(`supply-chain check: ${message}`); };
const read = (path: string) => readFileSync(join(root, path), "utf8");

// Third-party workflow code executes with the job token: immutable commit pins are
// mandatory, including in workflows added later.
const workflowDir = join(root, ".github/workflows");
const workflows = readdirSync(workflowDir).filter((name) => /\.ya?ml$/.test(name));
for (const name of workflows) {
  const text = read(`.github/workflows/${name}`);
  for (const match of text.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)) {
    const action = match[1];
    if (action.startsWith("./") || action.startsWith("docker://")) continue;
    const ref = action.slice(action.lastIndexOf("@") + 1);
    if (!/^[0-9a-f]{40}$/.test(ref)) fail(`${name} uses a mutable action reference: ${action}`);
  }
}

// Every externally fetched container must be content-addressed. This covers
// build stages and the images operators actually run through Compose.
for (const dockerfile of ["apps/api/Dockerfile", "apps/web/Dockerfile"]) {
  const stages = new Set<string>();
  for (const [index, line] of read(dockerfile).split("\n").entries()) {
    const match = line.match(/^FROM\s+([^\s]+)(?:\s+AS\s+(\S+))?$/i);
    if (!match) continue;
    if (match[1] !== "scratch" && !stages.has(match[1]) && !/@sha256:[0-9a-f]{64}$/.test(match[1]))
      fail(`${dockerfile}:${index + 1} has an unpinned base image: ${match[1]}`);
    if (match[2]) stages.add(match[2]);
  }
}
for (const [index, line] of read("docker-compose.yml").split("\n").entries()) {
  const match = line.match(/^\s*image:\s*([^\s#]+)/);
  if (match && !/@sha256:[0-9a-f]{64}$/.test(match[1]))
    fail(`docker-compose.yml:${index + 1} has an unpinned image: ${match[1]}`);
}

// Only these reviewed packages are public. A new non-private manifest must not
// silently become publishable, and public packages must carry registry metadata.
const publicPackages = new Set(["packages/cli/package.json", "packages/storybook/package.json"]);
const packageFiles: string[] = [];
const ignoredTrees = new Set([".git", ".next", "node_modules", "dist", "build", "coverage"]);
function findManifests(directory: string): void {
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    if (ignoredTrees.has(entry.name)) continue;
    const path = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) findManifests(path);
    else if (entry.name === "package.json") packageFiles.push(path);
  }
}
findManifests("");
packageFiles.sort();
for (const manifest of packageFiles) {
  const pkg = JSON.parse(read(manifest));
  const isPublic = publicPackages.has(manifest);
  if (isPublic) {
    if (pkg.private === true) fail(`${manifest} is allowlisted for release but marked private`);
    if (pkg.license !== "MIT") fail(`${manifest} must declare its MIT license`);
    if (!pkg.files?.includes("LICENSE") || !existsSync(join(root, manifest, "../LICENSE")))
      fail(`${manifest} must ship a LICENSE`);
    if (pkg.repository?.directory !== manifest.replace(/\/package\.json$/, ""))
      fail(`${manifest} has missing or incorrect repository.directory metadata`);
  } else if (pkg.private !== true) {
    fail(`${manifest} must be private unless added to the reviewed public-package allowlist`);
  }
  const lockfile = join(root, manifest, "../bun.lock");
  // Source/parser fixtures are package-boundary inputs, not independently installed roots.
  const isSourceFixture = manifest === "examples/storybook-button/package.json" || manifest.includes("/test-fixtures/");
  if (!isSourceFixture && !existsSync(lockfile))
    fail(`${manifest} has no bun.lock for frozen installs`);
}

const release = read(".github/workflows/package-release.yml");
for (const requirement of [
  "environment: npm-release", "id-token: write", "--provenance", "ref: ${{ github.sha }}",
  "persist-credentials: false", "package-sha256:", "EXPECTED_SHA256:", "npm@11.6.2",
  "concurrency:", "cancel-in-progress: false",
]) if (!release.includes(requirement)) fail(`package release is missing ${requirement}`);
if (/NPM_TOKEN|NODE_AUTH_TOKEN|npm_[A-Za-z0-9_]*token/i.test(release))
  fail("npm release must use OIDC trusted publishing, not a registry token");
if ((release.match(/id-token:\s*write/g) ?? []).length !== 1)
  fail("OIDC permission must exist only in the protected publish job");

const gitignore = read(".gitignore");
if (!/^\.env\.\*$/m.test(gitignore) || !/^\.env$/m.test(gitignore))
  fail(".gitignore must exclude local environment files");

console.log(`Supply-chain policy verified: ${workflows.length} workflows, 2 Dockerfiles, ${packageFiles.length} manifests, and npm OIDC release controls.`);
