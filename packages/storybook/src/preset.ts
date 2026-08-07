import { createRequire } from "node:module";
import { join } from "node:path";

export function managerFileForVersion(version: string): "manager.js" | "manager-legacy.js" {
  const major = Number.parseInt(version, 10);
  if (!Number.isFinite(major) || major < 8 || major >= 11) {
    throw new Error(`@compify/storybook supports Storybook >=8 <11; received ${version}`);
  }
  return major === 8 ? "manager-legacy.js" : "manager.js";
}

/** Resolve from the consuming project, not this package's development tree. */
export function resolveConsumerManager(cwd = process.cwd()): "manager.js" | "manager-legacy.js" {
  const consumerRequire = createRequire(join(cwd, "package.json"));
  let version: string;
  try {
    ({ version } = consumerRequire("storybook/package.json") as { version: string });
  } catch {
    throw new Error(`@compify/storybook could not resolve Storybook from ${cwd}`);
  }

  const manager = managerFileForVersion(version);
  if (manager === "manager-legacy.js") {
    try {
      consumerRequire.resolve("@storybook/manager-api/package.json");
    } catch {
      throw new Error(
        "Storybook 8 requires @storybook/manager-api to be resolvable from the consuming project",
      );
    }
  }
  return manager;
}

/** Add only the manager entry; this preset never changes a renderer or preview. */
export function managerEntries(entries: string[] = []): string[] {
  return [...entries, join(__dirname, resolveConsumerManager())];
}
