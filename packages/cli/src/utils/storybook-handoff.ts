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
  /** Separate evidence sidecar; never added to registry or handoff receipt digests. */
  styleContractOutput?: string;
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

/** Snapshot only a bounded portion of the consumer tree. Symlinks are hashed as
 * links and never followed; special files are ignored rather than opened. */
export function snapshotConsumer(
  root: string,
  limits: ConsumerSnapshotLimits = DEFAULT_CONSUMER_SNAPSHOT_LIMITS
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
  const walk = (directory: string, depth: number) => {
    if (depth > limits.maxDepth)
      throw new Error(
        `Consumer snapshot exceeded maximum depth (${limits.maxDepth})`
      );
    const directoryReal = fs.realpathSync(directory);
    if (!contained(rootReal, directoryReal))
      throw new Error("Consumer snapshot directory escaped the consumer root");

    for (const item of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
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
        result.set(relative, sha256(`symlink:${fs.readlinkSync(absolute)}`));
      } else if (stats.isDirectory()) {
        if (!SNAPSHOT_IGNORES.has(item.name)) walk(absolute, depth + 1);
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
          if (
            !opened.isFile() ||
            opened.dev !== stats.dev ||
            opened.ino !== stats.ino ||
            opened.size !== stats.size
          )
            throw new Error(
              `Consumer file changed while snapshotting: ${relative}`
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
          if (
            after.size !== opened.size ||
            after.mtimeMs !== opened.mtimeMs ||
            after.ctimeMs !== opened.ctimeMs
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

type OwnedFileIdentity = { dev: number; ino: number; size: number };

function sameFile(stats: fs.Stats, identity: OwnedFileIdentity) {
  return stats.dev === identity.dev && stats.ino === identity.ino;
}

function removeOwnedFile(
  filename: string,
  identity: OwnedFileIdentity,
  expectedSha256: string
): boolean {
  let stats: fs.Stats;
  try {
    stats = fs.lstatSync(filename);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return true;
    return false;
  }
  if (
    !stats.isFile() ||
    !sameFile(stats, identity) ||
    stats.size !== identity.size
  )
    return false;
  const noFollow =
    (fs.constants as typeof fs.constants & { O_NOFOLLOW?: number })
      .O_NOFOLLOW || 0;
  let descriptor: number;
  try {
    descriptor = fs.openSync(filename, fs.constants.O_RDONLY | noFollow);
  } catch {
    return false;
  }
  try {
    const opened = fs.fstatSync(descriptor);
    if (
      !sameFile(opened, identity) ||
      sha256(fs.readFileSync(descriptor)) !== expectedSha256
    )
      return false;
  } finally {
    fs.closeSync(descriptor);
  }
  try {
    const current = fs.lstatSync(filename);
    if (!sameFile(current, identity)) return false;
    fs.unlinkSync(filename);
    return true;
  } catch {
    return false;
  }
}

function writeOwnedFileExclusive(filename: string, contents: string) {
  const descriptor = fs.openSync(filename, "wx");
  const identity = fs.fstatSync(descriptor);
  try {
    fs.writeFileSync(descriptor, contents);
    fs.fsyncSync(descriptor);
  } catch (error) {
    try {
      fs.closeSync(descriptor);
    } finally {
      try {
        const current = fs.lstatSync(filename);
        if (sameFile(current, identity)) fs.unlinkSync(filename);
      } catch {
        // The original write error is more useful than a cleanup error.
      }
    }
    throw error;
  }
  fs.closeSync(descriptor);
  return {
    dev: identity.dev,
    ino: identity.ino,
    size: Buffer.byteLength(contents),
  };
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
  const artifactIdentity = writeOwnedFileExclusive(output, registryJson);
  let styleContractIdentity: OwnedFileIdentity | undefined;
  let styleContractSha256: string | undefined;

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
      {
        cwd: consumer,
        shell: false,
        stdio: "inherit",
      }
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

    const unsigned = {
      schemaVersion: 1 as const,
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
    // This is deliberately a sidecar rather than a receipt/registry field:
    // both existing digests have established wire semantics. The bundle digest
    // binds the sidecar to the exact bundled inputs without changing either.
    const styleContractJson = `${JSON.stringify({
      schemaVersion: 1,
      kind: "compify.storybook.style-contract",
      bundleDigest: bundle.digest,
      evidence: inspectStyleContract(bundle.files, consumerCandidates),
    }, null, 2)}
`;
    styleContractSha256 = sha256(styleContractJson);
    styleContractIdentity = writeOwnedFileExclusive(styleContractPath, styleContractJson);
    const receiptJson = `${JSON.stringify(receipt, null, 2)}
`;
    writeOwnedFileExclusive(receiptPath, receiptJson);
    return receipt;
  } catch (error) {
    // A failed native command must never leave a success receipt. Remove only
    // the exact artifact inode and bytes created by this invocation; if another
    // actor changed it, retain it as failure evidence rather than deleting it.
    const retrySafe = removeOwnedFile(output, artifactIdentity, registrySha256);
    if (styleContractIdentity && styleContractSha256)
      removeOwnedFile(styleContractPath, styleContractIdentity, styleContractSha256);
    if (!retrySafe) {
      const detail = `Generated artifact was changed and retained at ${output}; remove it explicitly before retrying`;
      if (error instanceof Error) error.message = `${error.message}; ${detail}`;
      else throw new Error(`${String(error)}; ${detail}`);
    }
    throw error;
  }
}
