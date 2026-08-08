import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  runStorybookHandoff,
  SHADCN_HANDOFF_VERSION,
} from "./storybook-handoff";

const roots: string[] = [];
function directory(prefix: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  roots.push(root);
  return root;
}
function sourceProject() {
  const root = directory("compify-handoff-source-");
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ name: "source", dependencies: { react: "^19.0.0" } })
  );
  fs.writeFileSync(
    path.join(root, "Button.tsx"),
    `import React from "react"
export const Button = () => null
`
  );
  fs.writeFileSync(
    path.join(root, "Button.stories.tsx"),
    `import { Button } from "./Button"
export default { component: Button }
export const Primary = { args: { label: "go" } }
`
  );
  return root;
}
function consumerProject() {
  const root = directory("compify-handoff-consumer-");
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ name: "consumer" })
  );
  fs.writeFileSync(
    path.join(root, "components.json"),
    JSON.stringify({ style: "new-york" })
  );
  return root;
}
const success = () =>
  ({
    pid: 1,
    output: [],
    stdout: null,
    stderr: null,
    status: 0,
    signal: null,
  } as any);
const canonical = (value: any): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : value && typeof value === "object"
    ? `{${Object.keys(value)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
        .join(",")}}`
    : JSON.stringify(value);
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0))
    fs.rmSync(root, { recursive: true, force: true });
});

describe("Storybook handoff", () => {
  it("uses pinned shadcn argv without a shell and writes a digest-verifiable receipt", () => {
    const source = sourceProject();
    const consumer = consumerProject();
    const calls: any[] = [];
    const spawn = ((file: string, args: readonly string[], options: any) => {
      calls.push({ file, args: [...args], options });
      if (file === "bunx")
        fs.writeFileSync(
          path.join(consumer, "installed;not-a-command.tsx"),
          "export {}\n"
        );
      return success();
    }) as any;
    const output = path.join(source, ".compify", "button registry.json");
    const receiptPath = path.join(source, ".compify", "receipt.json");
    const receipt = runStorybookHandoff(
      "Button.stories.tsx",
      {
        cwd: source,
        consumer,
        story: "Primary",
        output,
        receipt: receiptPath,
        buildCommand: "bun",
        buildArgs: ["run", "build; touch PWNED"],
      },
      spawn
    );

    expect(calls[0]).toEqual({
      file: "bunx",
      args: [
        "--bun",
        `shadcn@${SHADCN_HANDOFF_VERSION}`,
        "add",
        output,
        "--yes",
      ],
      options: {
        cwd: fs.realpathSync(consumer),
        shell: false,
        stdio: "inherit",
      },
    });
    expect(calls[1]).toEqual({
      file: "bun",
      args: ["run", "build; touch PWNED"],
      options: {
        cwd: fs.realpathSync(consumer),
        shell: false,
        stdio: "inherit",
      },
    });
    expect(fs.existsSync(path.join(consumer, "PWNED"))).toBe(false);
    expect(receipt.changes).toEqual([
      {
        path: "installed;not-a-command.tsx",
        afterSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    ]);
    const parsed = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
    const { receiptDigest, ...unsigned } = parsed;
    expect(receiptDigest).toBe(
      crypto.createHash("sha256").update(canonical(unsigned)).digest("hex")
    );
    expect(parsed.source.stories).toEqual(["Primary"]);
  });

  it("fails before executing when the consumer is not a separate initialized package", () => {
    const source = sourceProject();
    const nested = path.join(source, "consumer");
    fs.mkdirSync(nested);
    fs.writeFileSync(path.join(nested, "package.json"), "{}");
    fs.writeFileSync(path.join(nested, "components.json"), "{}");
    const spawn = vi.fn(() => success()) as any;
    expect(() =>
      runStorybookHandoff(
        "Button.stories.tsx",
        { cwd: source, consumer: nested },
        spawn
      )
    ).toThrow(/separate package tree/);
    expect(spawn).not.toHaveBeenCalled();
  });

  it("does not issue a success receipt when native installation fails", () => {
    const source = sourceProject();
    const consumer = consumerProject();
    const receipt = path.join(source, "receipt.json");
    const failed = (() => ({ ...success(), status: 7 })) as any;
    expect(() =>
      runStorybookHandoff(
        "Button.stories.tsx",
        { cwd: source, consumer, receipt },
        failed
      )
    ).toThrow(/status 7/);
    expect(fs.existsSync(receipt)).toBe(false);
  });
});
