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
import { inspectStyleContract, scanConsumerStyleCandidates } from "./storybook-style-contract";

export const SHADCN_HANDOFF_VERSION = "4.16.2";

export interface HandoffOptions extends BuildStoryOptions {
  consumer: string;
  output?: string;
  receipt?: string;
  buildCommand?: string;
  buildArgs?: string[];
  /** Separate static-evidence sidecar, whose exact bytes are bound by the receipt. */
  styleContractOutput?: string;
}

export interface HandoffReceipt {
  schemaVersion: 2;
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
  styleContract: {
    path: string;
    sha256: string;
    bundleDigest: string;
    analysis: "static-css-lexical";
    incomplete: true;
  };
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
  ".turbo",
  ".cache",
  ".parcel-cache",
  ".vercel",
  "dist",
  "build",
  "coverage",
  "storybook-static",
]);

export interface ConsumerSnapshotLimits {
  maxEntries: number;
  maxDepth: number;
  maxBytes: number;
}

export const DEFAULT_CONSUMER_SNAPSHOT_LIMITS: ConsumerSnapshotLimits = {
  maxEntries: 10_000,
  maxDepth: 64,
  maxBytes: 256 * 1024 * 1024,
};

/** Snapshot only a bounded portion of the consumer tree. Symlinks and special
 * files are ignored rather than followed or opened. Concurrent path changes
 * abort the snapshot instead of returning evidence from another tree. */
export function snapshotConsumer(
  root: string,
  limits: ConsumerSnapshotLimits = DEFAULT_CONSUMER_SNAPSHOT_LIMITS,
  hooks: { beforeDescend?: (directory: string) => void } = {}
): Map<string, string> {
  if (
    !Number.isSafeInteger(limits.maxEntries) ||
    limits.maxEntries < 1 ||
    !Number.isSafeInteger(limits.maxDepth) ||
    limits.maxDepth < 0 ||
    !Number.isSafeInteger(limits.maxBytes) ||
    limits.maxBytes < 0
  )
    throw new Error("Invalid consumer snapshot limits");

  const result = new Map<string, string>();
  const rootReal = fs.realpathSync(root);
  let entries = 0;
  let bytes = 0;
  const walk = (
    directory: string,
    depth: number,
    expectedIdentity?: { dev: number; ino: number }
  ) => {
    if (depth > limits.maxDepth)
      throw new Error(
        `Consumer snapshot exceeded maximum depth (${limits.maxDepth})`
      );
    const expectedDirectory = path.resolve(directory);
    const directoryInitial = fs.lstatSync(expectedDirectory);
    if (
      expectedIdentity &&
      (directoryInitial.dev !== expectedIdentity.dev ||
        directoryInitial.ino !== expectedIdentity.ino)
    )
      throw new Error("Consumer snapshot directory changed before traversal");
    const directoryReal = fs.realpathSync(expectedDirectory);
    if (
      !directoryInitial.isDirectory() ||
      directoryInitial.isSymbolicLink() ||
      directoryReal !== expectedDirectory ||
      !contained(rootReal, directoryReal)
    )
      throw new Error("Consumer snapshot directory changed or escaped the consumer root");
    const directoryEntries = fs
      .readdirSync(expectedDirectory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    const directoryAfterRead = fs.lstatSync(expectedDirectory);
    if (
      !directoryAfterRead.isDirectory() ||
      directoryAfterRead.dev !== directoryInitial.dev ||
      directoryAfterRead.ino !== directoryInitial.ino
    )
      throw new Error("Consumer snapshot directory changed while listing");

    for (const item of directoryEntries) {
      entries += 1;
      if (entries > limits.maxEntries)
        throw new Error(
          `Consumer snapshot exceeded maximum entries (${limits.maxEntries})`
        );

      const absolute = path.join(directory, item.name);
      const relative = path
        .relative(rootReal, absolute)
        .split(path.sep)
        .join("/");
      const stats = fs.lstatSync(absolute);
      if (stats.isSymbolicLink()) {
        continue;
      } else if (stats.isDirectory()) {
        if (!SNAPSHOT_IGNORES.has(item.name)) {
          hooks.beforeDescend?.(absolute);
          walk(absolute, depth + 1, { dev: stats.dev, ino: stats.ino });
        }
      } else if (stats.isFile()) {
        bytes += stats.size;
        if (bytes > limits.maxBytes)
          throw new Error(
            `Consumer snapshot exceeded maximum bytes (${limits.maxBytes})`
          );
        const noFollow =
          (fs.constants as typeof fs.constants & { O_NOFOLLOW?: number })
            .O_NOFOLLOW || 0;
        const descriptor = fs.openSync(
          absolute,
          fs.constants.O_RDONLY | noFollow
        );
        try {
          const opened = fs.fstatSync(descriptor);
          const resolved = fs.realpathSync(absolute);
          const resolvedStats = fs.statSync(resolved);
          if (
            !opened.isFile() ||
            opened.dev !== stats.dev ||
            opened.ino !== stats.ino ||
            opened.size !== stats.size ||
            resolved !== path.resolve(absolute) ||
            !contained(rootReal, resolved) ||
            resolvedStats.dev !== opened.dev ||
            resolvedStats.ino !== opened.ino
          )
            throw new Error(
              `Consumer file changed or escaped while snapshotting: ${relative}`
            );
          const hash = crypto.createHash("sha256");
          const buffer = Buffer.allocUnsafe(64 * 1024);
          let offset = 0;
          while (offset < opened.size) {
            const count = fs.readSync(
              descriptor,
              buffer,
              0,
              Math.min(buffer.length, opened.size - offset),
              offset
            );
            if (count === 0)
              throw new Error(
                `Consumer file changed while snapshotting: ${relative}`
              );
            hash.update(buffer.subarray(0, count));
            offset += count;
          }
          const after = fs.fstatSync(descriptor);
          const resolvedAfter = fs.realpathSync(absolute);
          const resolvedStatsAfter = fs.statSync(resolvedAfter);
          if (
            after.size !== opened.size ||
            after.mtimeMs !== opened.mtimeMs ||
            after.ctimeMs !== opened.ctimeMs ||
            resolvedAfter !== resolved ||
            resolvedStatsAfter.dev !== opened.dev ||
            resolvedStatsAfter.ino !== opened.ino
          )
            throw new Error(
              `Consumer file changed while snapshotting: ${relative}`
            );
          result.set(relative, hash.digest("hex"));
        } finally {
          fs.closeSync(descriptor);
        }
      }
    }
  };
  walk(rootReal, 0);
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

function writeOwnedFileExclusive(filename: string, contents: string) {
  const descriptor = fs.openSync(filename, "wx");
  try {
    fs.writeFileSync(descriptor, contents);
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
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
  const styleContractPath = path.resolve(
    options.cwd || process.cwd(),
    options.styleContractOutput || `.compify/${bundle.name}.style-contract.json`
  );
  if (new Set([output, receiptPath, styleContractPath]).size !== 3)
    throw new Error("Artifact, receipt, and style-contract sidecar paths must be different");
  reserveFile(output);
  reserveFile(receiptPath);
  reserveFile(styleContractPath);

  // Snapshot and lexical consumer evidence are collected before installation,
  // so candidates cannot be confused with files written by shadcn.
  const consumerCandidates = scanConsumerStyleCandidates(consumer);
  // Snapshot before reserving the artifact so a bounded-traversal failure never
  // strands a filename that prevents a corrected invocation from retrying.
  const before = snapshotConsumer(consumer);
  const registryJson = `${JSON.stringify(toRegistryItem(bundle), null, 2)}
`;
  const registrySha256 = sha256(registryJson);
  writeOwnedFileExclusive(output, registryJson);

  try {
    const installerCommand = [
      "bunx",
      "--bun",
      `shadcn@${SHADCN_HANDOFF_VERSION}`,
      "add",
      output,
      "--yes",
    ];
    const installResult = spawn(
      installerCommand[0],
      installerCommand.slice(1),
      { cwd: consumer, shell: false, stdio: "inherit" }
    );
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

    const styleContractJson = `${JSON.stringify({
      schemaVersion: 1,
      kind: "compify.storybook.style-contract",
      bundleDigest: bundle.digest,
      evidence: inspectStyleContract(bundle.files, consumerCandidates),
    }, null, 2)}
`;
    const styleContractSha256 = sha256(styleContractJson);
    writeOwnedFileExclusive(styleContractPath, styleContractJson);

    const unsigned = {
      schemaVersion: 2 as const,
      kind: "compify.storybook.handoff" as const,
      evidenceLevel: build ? ("built" as const) : ("installed" as const),
      source: {
        storyPath: bundle.provenance.storyPath,
        componentEntry: bundle.entry,
        stories: bundle.stories.map((story) => story.exportName),
        bundleDigest: bundle.digest,
        registryItemSha256: registrySha256,
      },
      consumer: { root: consumer },
      artifact: { path: output, sha256: registrySha256 },
      styleContract: {
        path: styleContractPath,
        sha256: styleContractSha256,
        bundleDigest: bundle.digest,
        analysis: "static-css-lexical" as const,
        incomplete: true as const,
      },
      installer: {
        package: "shadcn" as const,
        version: SHADCN_HANDOFF_VERSION,
        command: installerCommand,
        exitCode: 0 as const,
      },
      build,
      changes: changes(before, snapshotConsumer(consumer)),
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
    const receiptJson = `${JSON.stringify(receipt, null, 2)}
`;
    writeOwnedFileExclusive(receiptPath, receiptJson);
    return receipt;
  } catch (error) {
    const detail = `No success receipt was written. Generated files are retained as failure evidence; review and remove them explicitly before retrying`;
    if (error instanceof Error) {
      error.message = `${error.message}; ${detail}`;
      throw error;
    }
    throw new Error(`${String(error)}; ${detail}`);
  }
}
