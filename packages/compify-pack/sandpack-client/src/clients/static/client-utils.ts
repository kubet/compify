// Modified by Compify; see packages/compify-pack/sandpack-client/PROVENANCE.md.
import type { SandpackBundlerFiles } from "../..";

let counter = 0;

export function generateRandomId(): string {
  const now = Date.now();
  const randomNumber = Math.round(Math.random() * 10000);
  const count = (counter += 1);
  return (+`${now}${randomNumber}${count}`).toString(16);
}

const writeBuffer = (content: string | Uint8Array): Uint8Array => {
  if (typeof content === "string") {
    return new TextEncoder().encode(content);
  }

  return content;
};

export const fromBundlerFilesToFS = (
  files: SandpackBundlerFiles
): Record<string, Uint8Array> =>
  Object.entries(files).reduce<Record<string, Uint8Array>>(
    (accumulator, [path, file]) => {
      accumulator[path] = writeBuffer(file.code);
      return accumulator;
    },
    {}
  );
