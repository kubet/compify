import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const scopeIndex = process.argv.indexOf("--scope");
const scope = scopeIndex >= 0 ? process.argv[scopeIndex + 1] : undefined;
if (scope !== "compify-pack" && scope !== "web") {
  throw new Error("usage: bun scripts/verify-sandpack-remediation.ts --scope <compify-pack|web>");
}

const formerImplementation = ["Node", "box"].join("");
const formerPackage = ["@codesandbox", formerImplementation.toLowerCase()].join("/");
const forbiddenText = [
  formerPackage,
  formerImplementation,
  ["Sustainable", "Use", "License"].join(" "),
];
const textualExtensions = new Set([
  "", ".cjs", ".css", ".d.ts", ".html", ".js", ".json", ".lock", ".map", ".md",
  ".mjs", ".txt", ".ts", ".tsx", ".xml", ".yaml", ".yml",
]);
const scanned: string[] = [];

function fail(path: string, value: string): never {
  throw new Error(`${relative(root, path)} still contains forbidden remediation value ${JSON.stringify(value)}`);
}

function inspectFile(path: string): void {
  const extension = path.endsWith(".d.ts") ? ".d.ts" : extname(path).toLowerCase();
  if (!textualExtensions.has(extension)) return;
  const contents = readFileSync(path, "utf8");
  for (const value of forbiddenText) if (contents.includes(value)) fail(path, value);
  scanned.push(path);
}

function inspectTree(directory: string): void {
  if (!existsSync(directory)) throw new Error(`required remediation artifact is missing: ${relative(root, directory)}`);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.name.toLowerCase() === formerImplementation.toLowerCase()) fail(path, formerImplementation);
    if (entry.isDirectory()) inspectTree(path);
    else if (entry.isSymbolicLink()) {
      const target = lstatSync(path);
      if (target.isFile()) inspectFile(path);
    } else if (entry.isFile()) inspectFile(path);
  }
}

for (const lock of ["packages/compify-pack/bun.lock", "apps/web/bun.lock"]) {
  inspectFile(join(root, lock));
}

if (scope === "compify-pack") {
  inspectTree(join(root, "packages/compify-pack/dist"));
  inspectTree(join(root, "packages/compify-pack/sandpack-client/dist"));
  inspectTree(join(root, "packages/compify-pack/node_modules"));
} else {
  inspectTree(join(root, "apps/web/.next"));
  inspectTree(join(root, "apps/web/node_modules"));
  inspectTree(join(root, "packages/compify-pack/dist"));
  inspectTree(join(root, "packages/compify-pack/sandpack-client/dist"));
}

console.log(
  `Verified ${scope}: locks, installed dependencies, and ${scanned.length} textual artifact files exclude the former server implementation and license.`
);
