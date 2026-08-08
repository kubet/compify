import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Bun links local directory dependencies. Materialize the tracked package build
// for Next.js, then expose Fumadocs' precompiled CSS without Tailwind 3 reprocessing.
const appRoot = path.resolve(import.meta.dir, "..");
const source = path.resolve(appRoot, "../../packages/compify-pack");
const destination = path.join(appRoot, "node_modules/compify-pack");
const temporary = `${destination}.materializing`;

await rm(temporary, { recursive: true, force: true });
await mkdir(temporary, { recursive: true });
await cp(path.join(source, "dist"), path.join(temporary, "dist"), {
  recursive: true,
  dereference: true,
});
await writeFile(
  path.join(temporary, "package.json"),
  await readFile(path.join(source, "package.json")),
);
for (const filename of ["LICENSE", "README.md", "PROVENANCE.md"]) {
  await cp(path.join(source, filename), path.join(temporary, filename), {
    dereference: true,
  });
}
await rm(destination, { recursive: true, force: true });
await rename(temporary, destination);

const docsStylesSource = path.join(
  appRoot,
  "node_modules/fumadocs-ui/dist/style.css",
);
const docsStylesDestination = path.join(appRoot, "public/fumadocs.css");
await mkdir(path.dirname(docsStylesDestination), { recursive: true });
await cp(docsStylesSource, docsStylesDestination, { dereference: true });

// Serve the maintainer-supplied README demo with a browser-playable video MIME
// type instead of GitHub's application/octet-stream raw-file response.
const demoVideoSource = path.resolve(appRoot, "../../docs/assets/demo-video.mp4");
const demoVideoDestination = path.join(appRoot, "public/demo-video.mp4");
await cp(demoVideoSource, demoVideoDestination, { dereference: true });
