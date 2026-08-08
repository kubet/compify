import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync, type SpawnSyncReturns } from "child_process";
import {
  buildStoryBundle,
  resolveStoryEntry,
  toRegistryItem,
  type BuildStoryOptions,
} from "./storybook";

export const SHADCN_HANDOFF_VERSION = "4.16.2";

export interface HandoffOptions extends BuildStoryOptions {
  consumer: string;
  output?: string;
  receipt?: string;
  buildCommand?: string;
  buildArgs?: string[];
}

export interface HandoffReceipt {
  schemaVersion: 1;
  kind: "compify.storybook.handoff";
  evidenceLevel: "installed" | "built";
  source: {
    storyPath: string;
    componentEntry: string;
    stories: string[];
    bundleDigest: string;
    registryItemSha256: string;
  };
  consumer: { root: string };
  artifact: { path: string; sha256: string };
  installer: {
    package: "shadcn";
    version: string;
    command: string[];
    exitCode: 0;
  };
  build: null | { command: string[]; exitCode: 0 };
  changes: Array<{ path: string; beforeSha256?: string; afterSha256?: string }>;
  checks: {
    sourceConsumerSeparate: true;
    portable: true;
    componentsConfigPresent: true;
  };
  receiptDigest: string;
}

type Spawn = (
  file: string,
  args: readonly string[],
  options: { cwd: string; shell: false; stdio: "inherit" }
) => SpawnSyncReturns<Buffer>;
const sha256 = (value: string | Buffer) =>
  crypto.createHash("sha256").update(value).digest("hex");

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function contained(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function packageRoot(start: string): string {
  let current = fs.realpathSync(start);
  if (!fs.statSync(current).isDirectory()) current = path.dirname(current);
  for (;;) {
    if (fs.existsSync(path.join(current, "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current)
      throw new Error(`No package.json found above ${start}`);
    current = parent;
  }
}

const SNAPSHOT_IGNORES = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
]);
function snapshot(root: string): Map<string, string> {
  const result = new Map<string, string>();
  const walk = (directory: string) => {
    for (const item of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (item.isDirectory() && SNAPSHOT_IGNORES.has(item.name)) continue;
      const absolute = path.join(directory, item.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      if (item.isSymbolicLink())
        result.set(relative, sha256(`symlink:${fs.readlinkSync(absolute)}`));
      else if (item.isDirectory()) walk(absolute);
      else if (item.isFile())
        result.set(relative, sha256(fs.readFileSync(absolute)));
    }
  };
  walk(root);
  return result;
}

function changes(before: Map<string, string>, after: Map<string, string>) {
  return [...new Set([...before.keys(), ...after.keys()])]
    .sort()
    .flatMap((file) => {
      const oldHash = before.get(file);
      const newHash = after.get(file);
      if (oldHash === newHash) return [];
      return [
        {
          path: file,
          ...(oldHash ? { beforeSha256: oldHash } : {}),
          ...(newHash ? { afterSha256: newHash } : {}),
        },
      ];
    });
}

function assertSucceeded(
  label: string,
  result: SpawnSyncReturns<Buffer>
): asserts result is SpawnSyncReturns<Buffer> & { status: 0 } {
  if (result.error)
    throw new Error(`${label} could not start: ${result.error.message}`);
  if (result.signal)
    throw new Error(`${label} terminated by signal ${result.signal}`);
  if (result.status !== 0)
    throw new Error(
      `${label} exited with status ${
        result.status === null ? "unknown" : result.status
      }`
    );
}

function reserveFile(filename: string) {
  if (fs.existsSync(filename))
    throw new Error(`Refusing to overwrite existing file: ${filename}`);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
}

/** Performs a local-only handoff. The injectable spawn function exists solely
 * so tests can verify exact argv; production always uses spawnSync with no shell. */
export function runStorybookHandoff(
  input: string | undefined,
  options: HandoffOptions,
  spawn: Spawn = spawnSync
): HandoffReceipt {
  if (!options.consumer) throw new Error("--consumer is required");
  const requestedConsumer = path.resolve(
    options.cwd || process.cwd(),
    options.consumer
  );
  if (
    !fs.existsSync(requestedConsumer) ||
    !fs.statSync(requestedConsumer).isDirectory()
  )
    throw new Error(`Consumer directory does not exist: ${options.consumer}`);
  const consumer = fs.realpathSync(requestedConsumer);
  if (!fs.existsSync(path.join(consumer, "package.json")))
    throw new Error("Consumer must be a package root containing package.json");
  if (
    !fs.existsSync(path.join(consumer, "components.json")) ||
    !fs.statSync(path.join(consumer, "components.json")).isFile()
  )
    throw new Error(
      "Consumer must already contain components.json; initialize shadcn explicitly first"
    );

  const bundle = buildStoryBundle(input, options);
  const errors = bundle.diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error"
  );
  const nonPortable = bundle.stories.filter((story) => !story.portable);
  if (errors.length || nonPortable.length) {
    const reasons = errors.map((error) => `${error.code}: ${error.message}`);
    if (nonPortable.length)
      reasons.push(
        `Non-portable stories: ${nonPortable
          .map((story) => story.exportName)
          .join(", ")}`
      );
    throw new Error(reasons.join("; "));
  }
  const sourceRoot = packageRoot(resolveStoryEntry(input, options.cwd));
  if (contained(sourceRoot, consumer) || contained(consumer, sourceRoot))
    throw new Error(
      "Consumer must be an explicitly separate package tree from the selected story"
    );

  if (options.buildArgs?.length && !options.buildCommand)
    throw new Error("--build-arg requires --build-command");
  if (options.buildCommand !== undefined && !options.buildCommand.trim())
    throw new Error("--build-command must not be empty");
  const output = path.resolve(
    options.cwd || process.cwd(),
    options.output || `.compify/${bundle.name}.registry.json`
  );
  const receiptPath = path.resolve(
    options.cwd || process.cwd(),
    options.receipt || `.compify/${bundle.name}.handoff.json`
  );
  if (output === receiptPath)
    throw new Error("Artifact and receipt paths must be different");
  reserveFile(output);
  reserveFile(receiptPath);

  const registryJson = `${JSON.stringify(toRegistryItem(bundle), null, 2)}
`;
  fs.writeFileSync(output, registryJson, { flag: "wx" });
  const before = snapshot(consumer);
  const installerCommand = [
    "bunx",
    "--bun",
    `shadcn@${SHADCN_HANDOFF_VERSION}`,
    "add",
    output,
    "--yes",
  ];
  const installResult = spawn(installerCommand[0], installerCommand.slice(1), {
    cwd: consumer,
    shell: false,
    stdio: "inherit",
  });
  assertSucceeded("shadcn install", installResult);
  let build: HandoffReceipt["build"] = null;
  if (options.buildCommand) {
    const buildCommand = [options.buildCommand, ...(options.buildArgs || [])];
    const buildResult = spawn(buildCommand[0], buildCommand.slice(1), {
      cwd: consumer,
      shell: false,
      stdio: "inherit",
    });
    assertSucceeded("consumer build", buildResult);
    build = { command: buildCommand, exitCode: 0 };
  }

  const unsigned = {
    schemaVersion: 1 as const,
    kind: "compify.storybook.handoff" as const,
    evidenceLevel: build ? "built" as const : "installed" as const,
    source: {
      storyPath: bundle.provenance.storyPath,
      componentEntry: bundle.entry,
      stories: bundle.stories.map((story) => story.exportName),
      bundleDigest: bundle.digest,
      registryItemSha256: sha256(registryJson),
    },
    consumer: { root: consumer },
    artifact: { path: output, sha256: sha256(registryJson) },
    installer: {
      package: "shadcn" as const,
      version: SHADCN_HANDOFF_VERSION,
      command: installerCommand,
      exitCode: 0 as const,
    },
    build,
    changes: changes(before, snapshot(consumer)),
    checks: {
      sourceConsumerSeparate: true as const,
      portable: true as const,
      componentsConfigPresent: true as const,
    },
  };
  const receipt: HandoffReceipt = {
    ...unsigned,
    receiptDigest: sha256(canonical(unsigned)),
  };
  fs.writeFileSync(
    receiptPath,
    `${JSON.stringify(receipt, null, 2)}
`,
    { flag: "wx" }
  );
  return receipt;
}
