// Modified by Compify; see packages/compify-pack/sandpack-client/PROVENANCE.md.
/* eslint-disable @typescript-eslint/no-explicit-any,prefer-rest-params */
import type { ClientOptions, SandboxSetup } from "../types";

import type { SandpackClient as SandpackClientBase } from "./base";

export type { SandpackClient } from "./base";

export async function loadSandpackClient(
  iframeSelector: string | HTMLIFrameElement,
  sandboxSetup: SandboxSetup,
  options: ClientOptions = {}
): Promise<SandpackClientBase> {
  const template: string = sandboxSetup.template ?? "parcel";

  if (template === "node") {
    throw new Error(
      `[sandpack-client]: template "${template}" requires the unsupported server runtime; this build supports browser runtime and static templates only`
    );
  }

  const Client =
    template === "static"
      ? await import("./static").then((module) => module.SandpackStatic)
      : await import("./runtime").then((module) => module.SandpackRuntime);

  return new Client(iframeSelector, sandboxSetup, options);
}
