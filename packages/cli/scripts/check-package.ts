import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function run(command: string[], cwd: string): string {
  const result = Bun.spawnSync(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0)
    throw new Error(`${command.join(" ")} failed:
${result.stderr.toString()}`);
  return result.stdout.toString();
}

const packageRoot = join(import.meta.dir, "..");
const temp = mkdtempSync(join(tmpdir(), "compify-cli-pack-"));
try {
  run(
    ["bun", "pm", "pack", "--ignore-scripts", "--destination", temp],
    packageRoot
  );
  const tarball = readdirSync(temp).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("bun pm pack did not produce a tarball");
  run(["tar", "-xzf", join(temp, tarball), "-C", temp], packageRoot);
  const packed = join(temp, "package");
  for (const required of [
    "LICENSE",
    "COPYRIGHT.md",
    "README.md",
    "package.json",
    "bun.lock",
    "tsconfig.json",
    "tsup.config.ts",
    "src/index.ts",
    "scripts/check-package.ts",
    "dist/index.js",
  ]) {
    if (!existsSync(join(packed, required)))
      throw new Error(`packed CLI is missing ${required}`);
  }
  const manifest = await Bun.file(join(packed, "package.json")).json();
  if (manifest.license !== "AGPL-3.0-only")
    throw new Error("packed CLI has the wrong license metadata");
  const license = await Bun.file(join(packed, "LICENSE")).text();
  if (!license.startsWith("GNU AFFERO GENERAL PUBLIC LICENSE\nVersion 3"))
    throw new Error("packed CLI is missing the complete AGPL license");
  run(["bun", "install", "--frozen-lockfile", "--ignore-scripts"], packed);
  run(["bun", "run", "build"], packed);
  const help = run(["bun", "dist/index.js", "--help"], packed);
  if (!help.includes("storybook"))
    throw new Error("packed CLI help is missing Storybook commands");
  console.log(
    "Packed CLI contains complete source/build material, AGPL terms, its executable, and Storybook commands."
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
