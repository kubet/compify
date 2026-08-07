import { describe, expect, test } from "bun:test";
import { DEFAULT_PUBLISH_COMMAND, DEFAULT_SETUP_COMMAND, getPortabilityView, safeHttpUrl } from "./model";

describe("getPortabilityView", () => {
  test("provides safe, actionable guidance when parameters are absent", () => {
    const view = getPortabilityView();
    expect(view.status).toBe("unknown");
    expect(view.configured).toBe(false);
    expect(view.setupCommand).toBe(DEFAULT_SETUP_COMMAND);
    expect(view.publishCommand).toBe(DEFAULT_PUBLISH_COMMAND);
    expect(view.publishInstruction).toContain("built from this repository or available as released packages");
    expect(view.missing).toEqual(["status", "registry", "install command", "preview link"]);
  });

  test("uses configured distribution metadata and CLI overrides", () => {
    const view = getPortabilityView({
      status: "portable",
      registry: "@acme/button",
      installCommand: "ignored",
      previewUrl: "https://compify.app/view/@acme/button",
      reasons: ["No application-only dependencies"],
      cli: { setupCommand: "compify init", installCommand: "compify add @acme/button", publishCommand: "internal-publish" },
    });
    expect(view.label).toBe("Portable");
    expect(view.installCommand).toBe("compify add @acme/button");
    expect(view.previewHref).toBe("https://compify.app/view/@acme/button");
    expect(view.missing).toEqual([]);
    expect(view.publishCommand).toBe("internal-publish");
  });

  test("treats an invalid runtime status as unknown", () => {
    const view = getPortabilityView({ status: "surprise" } as never);
    expect(view.status).toBe("unknown");
    expect(view.label).toBe("Not assessed");
  });

  test("does not mutate author-provided reasons", () => {
    const reasons = ["Needs a theme token"];
    const view = getPortabilityView({ status: "partial", reasons });
    view.reasons.push("manager-only change");
    expect(reasons).toEqual(["Needs a theme token"]);
  });
});

describe("safeHttpUrl", () => {
  test("allows only HTTP(S) preview links", () => {
    expect(safeHttpUrl("https://example.com/preview")).toBe("https://example.com/preview");
    expect(safeHttpUrl("http://localhost:6006/story")).toBe("http://localhost:6006/story");
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeHttpUrl("file:///tmp/source.tsx")).toBeUndefined();
    expect(safeHttpUrl("not a url")).toBeUndefined();
  });
});
