import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const commit = "83a494906a61517ea597ae94b26e1972f0c67777";
const archiveSha256 = "70dbf8472a2410c25be40e67c7275a72c8268f386444869cff37035af9444848";
const expected = new Set([
  "components/CodeEditor/CodeMirror.tsx",
  "components/CodeEditor/__snapshots__/useSyntaxHighlight.test.tsx.snap",
  "components/FileTabs/FileTabs.test.tsx",
  "components/FileTabs/index.tsx",
  "components/Preview/index.tsx",
  "components/Tests/FormattedError.tsx",
  "components/common/ErrorOverlay.tsx",
  "components/common/Loading.tsx",
  "components/common/LoadingOverlay.tsx",
  "contexts/sandpackContext.tsx",
  "contexts/utils/useClient.ts",
  "contexts/utils/useFiles.ts",
  "presets/Sandpack.tsx",
  "utils/useAsyncSandpackId.ts",
]);
const root = resolve(import.meta.dir, "..");
const local = join(root, "packages/compify-pack");
const temp = mkdtempSync(join(tmpdir(), "compify-sandpack-provenance-"));
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
  const upstreamSrc = join(upstreamRoot, "sandpack-react/src");
  const localSrc = join(local, "src");
  const diff = Bun.spawnSync(["diff", "-qr", upstreamSrc, localSrc], { stdout: "pipe", stderr: "pipe" });
  if (![0, 1].includes(diff.exitCode)) throw new Error(diff.stderr.toString());
  const actual = new Set<string>();
  for (const line of diff.stdout.toString().trim().split("\n").filter(Boolean)) {
    const suffix = ` and ${localSrc}/`;
    if (!line.startsWith("Files ") || !line.includes(suffix) || !line.endsWith(" differ")) {
      throw new Error(`undocumented upstream tree shape change: ${line}`);
    }
    actual.add(line.slice(line.indexOf(suffix) + suffix.length, -" differ".length));
  }
  const missing = [...expected].filter((name) => !actual.has(name));
  const unexpected = [...actual].filter((name) => !expected.has(name));
  if (missing.length || unexpected.length) throw new Error(`changed path allowlist mismatch; missing=${missing.join(",")} unexpected=${unexpected.join(",")}`);
  for (const file of expected) {
    const text = readFileSync(join(localSrc, file), "utf8");
    if (!text.slice(0, 200).includes("// Modified by Compify; see packages/compify-pack/PROVENANCE.md.")) {
      throw new Error(`${file} lacks the required modification notice near its header`);
    }
  }
  if (readFileSync(join(upstreamRoot, "LICENSE"), "utf8") !== readFileSync(join(local, "LICENSE"), "utf8")) {
    throw new Error("the preserved Apache-2.0 license differs from upstream");
  }
  console.log(`Verified Sandpack ${commit}: complete source tree, ${actual.size} declared modifications, and upstream license.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
