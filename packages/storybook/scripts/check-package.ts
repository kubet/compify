import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  cpSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function run(command: string[], cwd: string): string {
  const result = Bun.spawnSync(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(`${command.join(" ")} failed:
${result.stderr.toString()}`);
  }
  return result.stdout.toString();
}

const packageRoot = join(import.meta.dir, "..");
const temp = mkdtempSync(join(tmpdir(), "compify-storybook-pack-"));
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
    "src/preset.ts",
    "scripts/check-package.ts",
    "dist/preset.cjs",
  ]) {
    if (!existsSync(join(packed, required)))
      throw new Error(`packed addon is missing ${required}`);
  }
  const manifest = await Bun.file(join(packed, "package.json")).json();
  if (manifest.license !== "AGPL-3.0-only")
    throw new Error("packed addon has the wrong license metadata");
  const license = await Bun.file(join(packed, "LICENSE")).text();
  if (!license.startsWith("GNU AFFERO GENERAL PUBLIC LICENSE\nVersion 3"))
    throw new Error("packed addon is missing the complete AGPL license");
  run(["bun", "install", "--frozen-lockfile", "--ignore-scripts"], packed);
  run(["bun", "run", "build"], packed);

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
    writeFileSync(
      join(modules, "storybook", "package.json"),
      JSON.stringify({
        name: "storybook",
        version,
        exports: { "./package.json": "./package.json" },
      })
    );
    if (version.startsWith("8.")) {
      mkdirSync(join(modules, "@storybook", "manager-api"), {
        recursive: true,
      });
      writeFileSync(
        join(modules, "@storybook", "manager-api", "package.json"),
        JSON.stringify({
          name: "@storybook/manager-api",
          version,
          exports: { "./package.json": "./package.json" },
        })
      );
    }
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({ type: "module" })
    );

    run(
      [
        "node",
        "-e",
        `const p=require('@compify/storybook'); const value=p.managerEntries([])[0]; if(!value.endsWith('${expected}')) throw new Error(value);`,
      ],
      consumer
    );
    run(
      [
        "node",
        "--input-type=module",
        "-e",
        "const p=await import('@compify/storybook/parameters'); if(typeof p.getPortabilityView!=='function') throw new Error('missing parameters export')",
      ],
      consumer
    );
  }
  console.log(
    "Packed addon contains complete source/build material and AGPL terms, and resolves preset and parameters exports for Storybook 8, 9, and 10 selectors."
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
