import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const dist = join(root, "packages/compify-pack/dist");
const files: string[] = [];
function walk(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if ([".js", ".mjs", ".cjs"].includes(extname(entry.name)))
      files.push(path);
  }
}
walk(dist);
if (files.length === 0) throw new Error("compify-pack dist is empty");
for (const path of files) {
  const text = readFileSync(path, "utf8");
  if (/process(?:\?\.)?\.env\.SANDPACK_/.test(text))
    throw new Error(
      `${relative(root, path)} retains a browser-unsafe Sandpack process global`
    );
}
for (const entry of [
  "index.js",
  "index.mjs",
  "unstyled/index.js",
  "unstyled/index.mjs",
]) {
  const text = readFileSync(join(dist, entry), "utf8");
  if (!text.includes("Modified by Compify from CodeSandbox Sandpack v2.19.8"))
    throw new Error(`${entry} lacks the derivative provenance banner`);
}
console.log(
  `Verified ${files.length} compify-pack JavaScript artifacts are browser-safe and marked.`
);
