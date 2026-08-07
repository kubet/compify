import { describe, expect, test } from "bun:test";
import { managerFileForVersion } from "./preset";

describe("Storybook manager selection", () => {
  test.each([
    ["8.6.14", "manager-legacy.js"],
    ["9.1.20", "manager.js"],
    ["10.2.10", "manager.js"],
  ] as const)("selects the compatible entry for Storybook %s", (version, expected) => {
    expect(managerFileForVersion(version)).toBe(expected);
  });

  test("rejects unsupported or invalid versions", () => {
    expect(() => managerFileForVersion("7.6.0")).toThrow();
    expect(() => managerFileForVersion("11.0.0")).toThrow();
    expect(() => managerFileForVersion("unknown")).toThrow();
  });
});
