import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

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
function capture(command: string[], cwd = root) {
  const result = Bun.spawnSync(command, { cwd, stdout: "pipe", stderr: "inherit" });
  if (result.exitCode !== 0) throw new Error(`${command.join(" ")} failed`);
  return result.stdout.toString();
}
function sha256(file: string) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
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
    "--style-contract-output", join(temp, "button.style-contract.json"),
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
    "--receipt", aliasReceipt, "--style-contract-output", join(temp, "alias.style-contract.json"),
    "--build-command", "bun", "--build-arg", "run",
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

  // Qualified external fixture: verify every unmodified upstream input, then
  // copy it outside this repository so Compify does not misattribute the
  // enclosing Compify Git commit as upstream provenance.
  const externalFixture = join(root, "examples/external-react-uswds-button");
  const externalFixtureHashes: Record<string, string> = {
    "LICENSE": "a6cba85bc92e0cff7a450b1d873c0eaa2e9fc96bf472df0247a26bec77bf3ff9",
    "package.json": "7031107e1ec3c6bae64c41a0b1015af0032f5302bb15999340f41e0fb0348388",
    "src/components/Button/Button.stories.tsx": "a829e6ed810f5864222649595523ab1d2d248d0277b940bf0bafe4c58f1d0c93",
    "src/components/Button/Button.tsx": "2b7df31389ffd92912115396ec7253fdfa3f5a63493dddef3fd0331358b951bc",
  };
  for (const [file, expected] of Object.entries(externalFixtureHashes)) {
    if (sha256(join(externalFixture, file)) !== expected) {
      throw new Error(`vendored external fixture checksum changed: ${file}`);
    }
  }
  const externalSource = join(temp, "external-react-uswds-button");
  cpSync(externalFixture, externalSource, { recursive: true });
  const externalInspection = JSON.parse(capture([
    "bun", join(root, "packages/cli/dist/index.js"), "storybook", "inspect",
    "src/components/Button/Button.stories.tsx", "--story", "DefaultButton",
    "--cwd", externalSource, "--json",
  ]));
  if (!externalInspection.portable || externalInspection.diagnostics.length !== 0) {
    throw new Error("qualified react-uswds Button selection is no longer statically portable");
  }
  if (externalInspection.digest !== "336189c7ba356928a6d8973fc48e2bb2de7ac9ce2105ccccf57399df8df1eccb") {
    throw new Error(`qualified external bundle digest changed: ${externalInspection.digest}`);
  }
  if (externalInspection.packageFiles.join() !== "src/components/Button/Button.tsx") {
    throw new Error("qualified external fixture no longer has the reviewed one-file graph");
  }
  if (externalInspection.styleContract.uses.length || externalInspection.styleContract.bundledDefinitions.length) {
    throw new Error("qualified external fixture unexpectedly gained bundled style evidence");
  }

  const externalConsumer = join(temp, "external-consumer");
  cpSync(join(root, "examples/consumer-next-ts"), externalConsumer, {
    recursive: true,
    filter: (source) => !["node_modules", ".next", ".env"].includes(source.split("/").at(-1) || ""),
  });
  await Bun.write(join(externalConsumer, "components.json"), `${JSON.stringify(components, null, 2)}
`);
  await Bun.write(join(externalConsumer, "src/app/page.tsx"), `import { Button } from "@/components/Button/Button";
export default function Page() {
  return <main><Button type="button">Click Me</Button></main>;
}
`);
  run(["bun", "install", "--frozen-lockfile"], externalConsumer);
  const externalArtifact = join(temp, "react-uswds-button.registry.json");
  const externalReceipt = join(temp, "react-uswds-button.handoff.json");
  run([
    "bun", join(root, "packages/cli/dist/index.js"), "storybook", "handoff",
    "src/components/Button/Button.stories.tsx", "--story", "DefaultButton",
    "--cwd", externalSource, "--consumer", externalConsumer,
    "--output", externalArtifact, "--receipt", externalReceipt,
    "--style-contract-output", join(temp, "react-uswds-button.style-contract.json"),
    "--build-command", "bun", "--build-arg", "run", "--build-arg", "build",
  ], root, { NEXT_TELEMETRY_DISABLED: "1" });
  if (sha256(externalArtifact) !== "0ea583918003ca21278d8eb2fad5007e74c20a20c4d0e163b103c704aea3167b") {
    throw new Error("qualified external registry artifact digest changed");
  }
  const externalItem = JSON.parse(readFileSync(externalArtifact, "utf8"));
  if (JSON.stringify(externalItem.dependencies) !== JSON.stringify([
    "classnames@^2.3.2",
    "react@^16.x || ^17.x || ^18.x || ^19.x",
  ])) {
    throw new Error("qualified external artifact did not preserve reviewed dependency ranges");
  }
  if (JSON.parse(readFileSync(externalReceipt, "utf8")).evidenceLevel !== "built") {
    throw new Error("qualified external handoff did not produce built evidence");
  }
  const externalConsumerPackage = JSON.parse(readFileSync(join(externalConsumer, "package.json"), "utf8"));
  if (externalConsumerPackage.dependencies?.classnames !== "^2.3.2" ||
      externalConsumerPackage.dependencies?.react !== "^16.x || ^17.x || ^18.x || ^19.x") {
    throw new Error("native shadcn installation did not retain the reviewed dependency ranges in the consumer manifest");
  }
  if (sha256(join(externalConsumer, "src/components/Button/Button.tsx")) !== "2b7df31389ffd92912115396ec7253fdfa3f5a63493dddef3fd0331358b951bc") {
    throw new Error("native shadcn installation changed the reviewed upstream Button source");
  }

  console.log("Compify handoff produced built receipts for two synthetic graphs and one qualified external react-uswds Button graph.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
