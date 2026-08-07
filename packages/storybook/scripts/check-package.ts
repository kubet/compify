import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function run(command: string[], cwd: string): string {
  const result = Bun.spawnSync(command, { cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) {
    throw new Error(`${command.join(" ")} failed:
${result.stderr.toString()}`);
  }
  return result.stdout.toString();
}

const packageRoot = join(import.meta.dir, "..");
const temp = mkdtempSync(join(tmpdir(), "compify-storybook-pack-"));
try {
  run(["bun", "pm", "pack", "--ignore-scripts", "--destination", temp], packageRoot);
  const tarball = readdirSync(temp).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("bun pm pack did not produce a tarball");
  run(["tar", "-xzf", join(temp, tarball), "-C", temp], packageRoot);
  const packed = join(temp, "package");

  for (const [version, expected] of [
    ["8.6.14", "manager-legacy.js"],
    ["9.1.20", "manager.js"],
    ["10.2.10", "manager.js"],
  ] as const) {
    const consumer = join(temp, `consumer-${version}`);
    const modules = join(consumer, "node_modules");
    mkdirSync(join(modules, "@compify"), { recursive: true });
    cpSync(packed, join(modules, "@compify", "storybook"), { recursive: true });
    mkdirSync(join(modules, "storybook"), { recursive: true });
    writeFileSync(join(modules, "storybook", "package.json"), JSON.stringify({
      name: "storybook", version, exports: { "./package.json": "./package.json" },
    }));
    if (version.startsWith("8.")) {
      mkdirSync(join(modules, "@storybook", "manager-api"), { recursive: true });
      writeFileSync(join(modules, "@storybook", "manager-api", "package.json"), JSON.stringify({
        name: "@storybook/manager-api", version, exports: { "./package.json": "./package.json" },
      }));
    }
    writeFileSync(join(consumer, "package.json"), JSON.stringify({ type: "module" }));

    run(["node", "-e", `const p=require('@compify/storybook'); const value=p.managerEntries([])[0]; if(!value.endsWith('${expected}')) throw new Error(value);`], consumer);
    run(["node", "--input-type=module", "-e", "const p=await import('@compify/storybook/parameters'); if(typeof p.getPortabilityView!=='function') throw new Error('missing parameters export')"], consumer);
  }
  console.log("Packed addon resolves preset and parameters exports for Storybook 8, 9, and 10 selectors.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
