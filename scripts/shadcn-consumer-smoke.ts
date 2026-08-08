import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dir, "..");
function run(command: string[], cwd = root, env: Record<string, string> = {}) {
  const result = Bun.spawnSync(command, {
    cwd,
    env: { ...process.env, ...env },
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) throw new Error(`${command.join(" ")} failed`);
}

const temp = mkdtempSync(join(tmpdir(), "compify-shadcn-consumer-"));
try {
  const consumer = join(temp, "consumer");
  cpSync(join(root, "examples/consumer-next-ts"), consumer, {
    recursive: true,
    filter: (source) => !["node_modules", ".next", ".env"].includes(source.split("/").at(-1) || ""),
  });
  const components = {
    $schema: "https://ui.shadcn.com/schema.json",
    style: "new-york",
    rsc: false,
    tsx: true,
    tailwind: { config: "", css: "src/app/globals.css", baseColor: "neutral", cssVariables: true },
    iconLibrary: "lucide",
    aliases: { components: "@/components", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks", utils: "@/lib/utils" },
  };
  await Bun.write(join(consumer, "components.json"), `${JSON.stringify(components, null, 2)}
`);
  const artifact = join(temp, "button.registry.json");
  const receiptPath = join(temp, "button.handoff.json");

  run(["bun", "run", "build"], join(root, "packages/cli"));
  run(["bun", "install", "--frozen-lockfile"], consumer);
  run([
    "bun", join(root, "packages/cli/dist/index.js"), "storybook", "handoff",
    "src/Button.stories.tsx", "--story", "Primary",
    "--cwd", join(root, "examples/storybook-button"), "--consumer", consumer,
    "--output", artifact, "--receipt", receiptPath,
    "--build-command", "bun", "--build-arg", "run", "--build-arg", "build",
  ], root, { NEXT_TELEMETRY_DISABLED: "1" });

  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  if (receipt.kind !== "compify.storybook.handoff" || receipt.evidenceLevel !== "built") {
    throw new Error("handoff did not emit a built-evidence receipt");
  }
  if (!receipt.changes.some((change: { path: string }) => change.path.endsWith("Button.tsx"))) {
    throw new Error("handoff receipt did not identify the installed component change");
  }

  const component = join(consumer, "src/components/Button.tsx");
  const stylesheet = join(consumer, "src/components/button.module.css");
  if (!existsSync(component) || !existsSync(stylesheet)) {
    throw new Error("shadcn did not place the complete component graph at the configured alias");
  }
  if (!readFileSync(component, "utf8").includes('./button.module.css')) {
    throw new Error("shadcn installation broke the component's relative stylesheet import");
  }
  const aliasConsumer = join(temp, "alias-consumer");
  cpSync(join(root, "examples/consumer-next-ts"), aliasConsumer, {
    recursive: true,
    filter: (source) => !["node_modules", ".next", ".env"].includes(source.split("/").at(-1) || ""),
  });
  await Bun.write(join(aliasConsumer, "components.json"), `${JSON.stringify(components, null, 2)}
`);
  run(["bun", "install", "--frozen-lockfile"], aliasConsumer);
  const aliasRoot = join(root, "packages/cli/test-fixtures/storybook-aliases");
  const aliasReceipt = join(temp, "alias.handoff.json");
  run([
    "bun", join(root, "packages/cli/dist/index.js"), "storybook", "handoff",
    "src/components/Button.stories.tsx", "--story", "Primary",
    "--component-entry", "src/components/Button.tsx", "--cwd", aliasRoot,
    "--consumer", aliasConsumer, "--output", join(temp, "alias.registry.json"),
    "--receipt", aliasReceipt, "--build-command", "bun", "--build-arg", "run",
    "--build-arg", "build",
  ], root, { NEXT_TELEMETRY_DISABLED: "1" });
  const aliasButton = join(aliasConsumer, "src/components/Button.tsx");
  const aliasUtils = join(aliasConsumer, "src/lib/utils.ts");
  if (!existsSync(aliasButton) || !existsSync(aliasUtils)) {
    throw new Error("shadcn did not install the rewritten exact-alias graph");
  }
  if (!readFileSync(aliasButton, "utf8").includes('../lib/utils')) {
    throw new Error("handoff did not rewrite the package import to a consumer-usable relative path");
  }
  if (JSON.parse(readFileSync(aliasReceipt, "utf8")).evidenceLevel !== "built") {
    throw new Error("exact-alias handoff did not produce built evidence");
  }

  console.log("Compify handoff produced built receipts for relative and exact-alias graphs in clean Next.js consumers.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
