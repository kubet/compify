import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function run(command: string[], cwd: string): string {
  const result = Bun.spawnSync(command, { cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(`${command.join(" ")} failed:
${result.stderr.toString()}`);
  return result.stdout.toString();
}

const packageRoot = join(import.meta.dir, "..");
const temp = mkdtempSync(join(tmpdir(), "compify-cli-pack-"));
try {
  run(["bun", "pm", "pack", "--ignore-scripts", "--destination", temp], packageRoot);
  const tarball = readdirSync(temp).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("bun pm pack did not produce a tarball");
  run(["tar", "-xzf", join(temp, tarball), "-C", temp], packageRoot);
  const packed = join(temp, "package");
  for (const required of ["LICENSE", "README.md", "package.json", "dist/index.js"]) {
    if (!existsSync(join(packed, required))) throw new Error(`packed CLI is missing ${required}`);
  }
  run(["bun", "install", "--ignore-scripts"], packed);
  const help = run(["bun", "dist/index.js", "--help"], packed);
  if (!help.includes("storybook")) throw new Error("packed CLI help is missing Storybook commands");
  console.log("Packed CLI contains its license, documentation, executable, and Storybook commands.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
