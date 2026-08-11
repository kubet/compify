import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";

const commit = "83a494906a61517ea597ae94b26e1972f0c67777";
const archiveSha256 = "70dbf8472a2410c25be40e67c7275a72c8268f386444869cff37035af9444848";
const expectedReactChanged = new Set([
  "components/CodeEditor/CodeMirror.tsx",
  "components/CodeEditor/__snapshots__/useSyntaxHighlight.test.tsx.snap",
  "components/Console/Console.stories.tsx",
  "components/Console/utils/getType.ts",
  "components/FileExplorer/Directory.tsx",
  "components/FileExplorer/ModuleList.tsx",
  "components/FileExplorer/index.tsx",
  "components/FileExplorer/utils.ts",
  "components/FileTabs/FileTabs.test.tsx",
  "components/FileTabs/index.tsx",
  "components/Preview/index.tsx",
  "components/Tests/FormattedError.tsx",
  "components/Tests/Specs.tsx",
  "components/Tests/Tests.tsx",
  "components/common/ErrorOverlay.tsx",
  "components/common/Loading.tsx",
  "components/common/LoadingOverlay.tsx",
  "components/common/OpenInCodeSandboxButton/UnstyledOpenInCodeSandboxButton.tsx",
  "contexts/sandpackContext.tsx",
  "contexts/utils/useAppState.ts",
  "contexts/utils/useClient.ts",
  "contexts/utils/useFiles.test.ts",
  "contexts/utils/useFiles.ts",
  "hooks/useSandpackClient.ts",
  "hooks/useSandpackPreviewProgress.ts",
  "presets/Sandpack.stories.tsx",
  "presets/Sandpack.tsx",
  "templates/Templates.stories.tsx",
  "templates/index.tsx",
  "types.ts",
  "utils/sandpackUtils.test.ts",
  "utils/sandpackUtils.ts",
  "utils/useAsyncSandpackId.ts",
]);
const expectedClientChanged = new Set([
  "clients/index.ts",
  "clients/static/index.ts",
  "types.ts",
]);
const expectedClientMissing = new Set([
  "clients/node/client.utils.test.ts",
  "clients/node/client.utils.ts",
  "clients/node/iframe.utils.ts",
  "clients/node/index.ts",
  "clients/node/inject-scripts/historyListener.ts",
  "clients/node/inject-scripts/index.ts",
  "clients/node/inject-scripts/resize.ts",
  "clients/node/taskManager.test.ts",
  "clients/node/taskManager.ts",
  "clients/node/types.ts",
  "clients/static/types.d.ts",
]);
const expectedClientExtra = new Set([
  "clients/index.test.ts",
  "clients/static/client-utils.ts",
]);
const modificationNotice = "// Modified by Compify; see packages/compify-pack";
const root = resolve(import.meta.dir, "..");
const localPack = join(root, "packages/compify-pack");
const localClient = join(localPack, "sandpack-client");
const temp = mkdtempSync(join(tmpdir(), "compify-sandpack-provenance-"));

function files(rootDirectory: string, ignored = new Set<string>()): Map<string, Buffer> {
  const result = new Map<string, Buffer>();
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const path = relative(rootDirectory, absolute).replaceAll("\\", "/");
      if (ignored.has(path)) continue;
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) result.set(path, readFileSync(absolute));
    }
  };
  visit(rootDirectory);
  return result;
}

function assertSameSet(label: string, expected: Set<string>, actual: Set<string>): void {
  const absent = [...expected].filter((path) => !actual.has(path));
  const unexpected = [...actual].filter((path) => !expected.has(path));
  if (absent.length || unexpected.length) {
    throw new Error(`${label} mismatch; absent=${absent.join(",")} unexpected=${unexpected.join(",")}`);
  }
}

function verifyTree(
  label: string,
  upstreamDirectory: string,
  localDirectory: string,
  expectedChanged: Set<string>,
  expectedMissing = new Set<string>(),
  expectedExtra = new Set<string>(),
  ignoredLocal = new Set<string>()
): void {
  const upstream = files(upstreamDirectory);
  const local = files(localDirectory, ignoredLocal);
  const changed = new Set<string>();
  const missing = new Set<string>();
  const extra = new Set<string>();

  for (const [path, contents] of upstream) {
    const localContents = local.get(path);
    if (!localContents) missing.add(path);
    else if (!contents.equals(localContents)) changed.add(path);
  }
  for (const path of local.keys()) if (!upstream.has(path)) extra.add(path);

  assertSameSet(`${label} changed paths`, expectedChanged, changed);
  assertSameSet(`${label} omitted paths`, expectedMissing, missing);
  assertSameSet(`${label} local-only paths`, expectedExtra, extra);

  for (const path of [...changed, ...extra]) {
    const text = readFileSync(join(localDirectory, path), "utf8");
    if (!text.slice(0, 240).includes(modificationNotice)) {
      throw new Error(`${label} ${path} lacks the required modification notice near its header`);
    }
  }
}

try {
  const response = await fetch(`https://codeload.github.com/codesandbox/sandpack/tar.gz/${commit}`);
  if (!response.ok) throw new Error(`upstream archive returned HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const digest = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
  if (digest !== archiveSha256) throw new Error(`upstream archive digest changed: ${digest}`);
  const archive = join(temp, "sandpack.tar.gz");
  await Bun.write(archive, bytes);
  const tar = Bun.spawnSync(["tar", "-xzf", archive, "-C", temp], { stdout: "pipe", stderr: "pipe" });
  if (tar.exitCode !== 0) throw new Error(tar.stderr.toString());
  const extracted = readdirSync(temp).find((name) => name.startsWith("sandpack-") && name !== "sandpack.tar.gz");
  if (!extracted) throw new Error("upstream archive root was not found");
  const upstreamRoot = join(temp, extracted);

  verifyTree(
    "sandpack-react",
    join(upstreamRoot, "sandpack-react/src"),
    join(localPack, "src"),
    expectedReactChanged
  );
  verifyTree(
    "sandpack-client browser subset",
    join(upstreamRoot, "sandpack-client/src"),
    join(localClient, "src"),
    expectedClientChanged,
    expectedClientMissing,
    expectedClientExtra,
    new Set(["inject-scripts/dist/consoleHook.js"])
  );

  const upstreamLicense = readFileSync(join(upstreamRoot, "LICENSE"), "utf8");
  for (const license of [join(localPack, "LICENSE"), join(localClient, "LICENSE")]) {
    if (readFileSync(license, "utf8") !== upstreamLicense) {
      throw new Error(`the preserved Apache-2.0 license differs from upstream: ${license}`);
    }
  }
  console.log(
    `Verified Sandpack ${commit}: complete React tree (${expectedReactChanged.size} declared changes), browser-only client subset, omissions, local helpers, and both upstream licenses.`
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
