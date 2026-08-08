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

  run(["bun", "run", "build"], join(root, "packages/cli"));
  run([
    "bun", join(root, "packages/cli/dist/index.js"), "storybook", "export",
    "src/Button.stories.tsx", "--story", "Primary",
    "--cwd", join(root, "examples/storybook-button"), "--output", artifact,
  ]);
  run(["bun", "install", "--frozen-lockfile"], consumer);
  // Pin the verified client: `latest` would make release evidence non-reproducible.
  run(["bunx", "shadcn@4.16.2", "add", artifact, "--yes"], consumer);

  const component = join(consumer, "src/components/Button.tsx");
  const stylesheet = join(consumer, "src/components/button.module.css");
  if (!existsSync(component) || !existsSync(stylesheet)) {
    throw new Error("shadcn did not place the complete component graph at the configured alias");
  }
  if (!readFileSync(component, "utf8").includes('./button.module.css')) {
    throw new Error("shadcn installation broke the component's relative stylesheet import");
  }
  run(["bun", "run", "build"], consumer, { NEXT_TELEMETRY_DISABLED: "1" });
  console.log("Compify export installed with shadcn 4.16.2 and passed a clean Next.js production build.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
