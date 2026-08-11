// Modified by Compify; see packages/compify-pack/sandpack-client/PROVENANCE.md.
import { loadSandpackClient } from "./index";

jest.mock("static-browser-server", () => ({
  PreviewController: class PreviewController {
    async initPreview(): Promise<string> {
      return "https://static-preview.example.test";
    }
  },
}));

describe(loadSandpackClient, () => {
  it("loads the browser runtime client", async () => {
    const client = await loadSandpackClient(document.createElement("iframe"), {
      files: { "/index.js": { code: "console.log('runtime')" } },
      template: "parcel",
    });

    expect(client.constructor.name).toBe("SandpackRuntime");
    client.destroy();
  });

  it("loads the static preview client", async () => {
    const client = await loadSandpackClient(document.createElement("iframe"), {
      files: { "/index.html": { code: "<h1>static</h1>" } },
      template: "static",
    });

    expect(client.constructor.name).toBe("SandpackStatic");
    client.destroy();
  });

  it("explicitly rejects the omitted server runtime", async () => {
    await expect(
      loadSandpackClient(
        document.createElement("iframe"),
        { files: {}, template: "node" },
        {}
      )
    ).rejects.toThrow(
      '[sandpack-client]: template "node" requires the unsupported server runtime; this build supports browser runtime and static templates only'
    );
  });
});
