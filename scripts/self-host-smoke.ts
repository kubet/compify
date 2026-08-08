/**
 * Black-box smoke check for a running self-host stack.
 *
 * Start the stack separately, then run:
 *   API_URL=http://localhost:3009 WEB_URL=http://localhost:3000 \
 *     bun scripts/self-host-smoke.ts
 */
const apiUrl = (process.env.API_URL ?? "http://localhost:3009").replace(
  /\/$/,
  ""
);
const webUrl = (process.env.WEB_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 90_000);

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10_000),
    redirect: "follow",
  });
}

async function waitFor(label: string, url: string) {
  const deadline = Date.now() + timeoutMs;
  let detail = "not attempted";
  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout(url);
      detail = `HTTP ${response.status}`;
      if (response.ok) return response;
    } catch (error) {
      detail = error instanceof Error ? error.message : String(error);
    }
    await Bun.sleep(1_000);
  }
  throw new Error(`${label} did not become ready at ${url}: ${detail}`);
}

async function expectResponse(
  label: string,
  url: string,
  status: number,
  check?: (response: Response, body: string) => void,
  init?: RequestInit
) {
  const response = await fetchWithTimeout(url, init);
  const body = await response.text();
  if (response.status !== status) {
    throw new Error(
      `${label}: expected HTTP ${status}, got ${response.status}: ${body.slice(
        0,
        300
      )}`
    );
  }
  check?.(response, body);
  console.log(`ok - ${label} (${response.status})`);
}

function includes(...needles: string[]) {
  return (_response: Response, body: string) => {
    for (const needle of needles) {
      if (!body.includes(needle))
        throw new Error(`response is missing ${JSON.stringify(needle)}`);
    }
  };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("smoke payload is not JSON");
  return encoded;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

await waitFor("API liveness", `${apiUrl}/health`);
await waitFor("API dependency readiness", `${apiUrl}/ready`);
await waitFor("web", webUrl);

await expectResponse(
  "API liveness",
  `${apiUrl}/health`,
  200,
  includes('"status":"ok"')
);
await expectResponse(
  "API readiness",
  `${apiUrl}/ready`,
  200,
  includes('"status":"ready"')
);
await expectResponse("web home", webUrl, 200, (_response, body) => {
  if (!body.toLowerCase().includes("compify"))
    throw new Error("home page does not identify Compify");
});
await expectResponse("docs index", `${webUrl}/docs`, 200, includes("Compify"));
await expectResponse(
  "API reference page",
  `${webUrl}/docs/api-reference`,
  200,
  includes("API reference")
);
await expectResponse(
  "docs search",
  `${webUrl}/api/search?query=cli`,
  200,
  (response, body) => {
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new Error("search is not JSON");
    const results = JSON.parse(body);
    if (
      !Array.isArray(results) ||
      !results.some((item) =>
        JSON.stringify(item).toLowerCase().includes("cli")
      )
    ) {
      throw new Error("search returned no CLI documentation result");
    }
  }
);

await expectResponse(
  "OpenAPI JSON",
  `${apiUrl}/openapi.json`,
  200,
  (response, body) => {
    if (!response.headers.get("content-type")?.includes("json"))
      throw new Error("OpenAPI response is not JSON");
    const document = JSON.parse(body);
    if (!String(document.openapi).startsWith("3."))
      throw new Error("not OpenAPI 3.x");
    const browserCookie =
      document.components?.securitySchemes?.["browser-cookie"];
    if (
      browserCookie?.in !== "cookie" ||
      browserCookie?.name !== "compify_auth"
    ) {
      throw new Error("OpenAPI is missing browser cookie authentication");
    }
    for (const path of [
      "/health",
      "/component/my",
      "/cli/get-all",
      "/c/fetch/sitemap/all",
    ]) {
      if (!document.paths?.[path])
        throw new Error(`OpenAPI is missing ${path}`);
    }
  }
);
await expectResponse(
  "read-only Swagger initializer",
  `${apiUrl}/api/docs/swagger-ui-init.js`,
  200,
  includes(
    '"supportedSubmitMethods": []',
    '"tryItOutEnabled": false',
    '"persistAuthorization": false'
  )
);
await expectResponse(
  "empty-compatible registry index",
  `${apiUrl}/r/registry.json`,
  200,
  (_response, body) => {
    const registry = JSON.parse(body);
    if (
      registry.$schema !== "https://ui.shadcn.com/schema/registry.json" ||
      !Array.isArray(registry.items)
    ) {
      throw new Error("registry index is not shadcn-compatible");
    }
  }
);
await expectResponse(
  "credentialed CORS preflight",
  `${apiUrl}/user/login`,
  204,
  (response) => {
    if (
      response.headers.get("access-control-allow-origin") !== webUrl ||
      response.headers.get("access-control-allow-credentials") !== "true"
    ) {
      throw new Error("configured browser origin was not accepted by CORS");
    }
  },
  {
    method: "OPTIONS",
    headers: {
      Origin: webUrl,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  }
);
await expectResponse(
  "unconfigured CORS origin",
  `${apiUrl}/health`,
  200,
  (response) => {
    if (
      response.headers.get("access-control-allow-origin") ===
      "https://cross-site.invalid"
    ) {
      throw new Error("unconfigured browser origin was accepted by CORS");
    }
  },
  { headers: { Origin: "https://cross-site.invalid" } }
);

for (const [label, path] of [
  ["JWT component boundary", "/component/my"],
  ["JWT theme boundary", "/theme/not-a-real-id"],
  ["JWT user boundary", "/user/whoami"],
  ["CLI token boundary", "/cli/get-all"],
  ["internal API boundary", "/c/fetch/sitemap/all"],
] as const) {
  await expectResponse(label, `${apiUrl}${path}`, 401);
}

const smokeEmail = `self-host-smoke-${Date.now()}@example.test`;
const originalPassword = "Smoke-password-12345";
const replacementPassword = "Smoke-password-67890";
const browserHeaders = { Origin: webUrl, "Content-Type": "application/json" };

const register = await fetchWithTimeout(`${apiUrl}/user/register`, {
  method: "POST",
  headers: browserHeaders,
  body: JSON.stringify({
    email: smokeEmail,
    password: originalPassword,
    firstName: "Smoke",
    lastName: "Test",
  }),
});
if (register.status !== 201) {
  throw new Error(`browser registration failed with HTTP ${register.status}`);
}
console.log("ok - browser registration (201)");

const login = await fetchWithTimeout(`${apiUrl}/user/login`, {
  method: "POST",
  headers: browserHeaders,
  body: JSON.stringify({ email: smokeEmail, password: originalPassword }),
});
const loginBody = await login.text();
const setCookie = login.headers.get("set-cookie") ?? "";
if (
  login.status !== 201 ||
  !setCookie.includes("compify_auth=") ||
  !setCookie.includes("HttpOnly") ||
  !setCookie.includes("SameSite=Lax") ||
  loginBody.includes("accessToken")
) {
  throw new Error(
    "browser login did not issue only the hardened HttpOnly cookie"
  );
}
const sessionCookie = setCookie.split(";", 1)[0];
console.log("ok - hardened browser cookie login (201)");

await expectResponse(
  "cookie-authenticated user",
  `${apiUrl}/user/whoami`,
  200,
  (_response, body) => {
    if (!body.includes(smokeEmail))
      throw new Error("session belongs to the wrong user");
  },
  { headers: { Cookie: sessionCookie, Origin: webUrl } }
);

const cliTokenResponse = await fetchWithTimeout(`${apiUrl}/user/cli/token`, {
  method: "POST",
  headers: { Cookie: sessionCookie, Origin: webUrl },
});
const cliTokenBody = await cliTokenResponse.json();
if (
  cliTokenResponse.status !== 201 ||
  !/^cli_[a-f0-9]{64}$/.test(cliTokenBody.token)
) {
  throw new Error(
    `CLI token creation failed with HTTP ${cliTokenResponse.status}`
  );
}
const cliToken = cliTokenBody.token as string;
console.log("ok - CLI token creation (201)");

const publishingName = `smoke-button-${Date.now()}`;
const unsignedArtifact = {
  schemaVersion: 1,
  name: "Self-host Smoke Button",
  description:
    "Disposable registry artifact created by the self-host smoke test",
  publishingName,
  visibility: "public",
  language: "tsx",
  entry: "components/smoke-button.tsx",
  files: {
    "components/smoke-button.tsx":
      'export function SmokeButton() { return <button type="button">Smoke</button> }',
  },
  dependencies: { react: "^19.0.0" },
  stories: [{ exportName: "Default", name: "Default", portable: true }],
  provenance: { storyPath: "components/smoke-button.stories.tsx" },
};
const artifact = {
  ...unsignedArtifact,
  digest: await sha256(canonicalJson(unsignedArtifact)),
};
const publishResponse = await fetchWithTimeout(`${apiUrl}/cli/publish-story`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${cliToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(artifact),
});
const publishBody = await publishResponse.json();
if (
  publishResponse.status !== 201 ||
  typeof publishBody.registryUrl !== "string" ||
  !publishBody.registryUrl.startsWith(`${apiUrl}/r/`)
) {
  throw new Error(`registry publish failed with HTTP ${publishResponse.status}`);
}
console.log("ok - registry publish and object upload (201)");

await expectResponse(
  "published shadcn registry artifact",
  publishBody.registryUrl,
  200,
  (_response, body) => {
    const item = JSON.parse(body);
    if (
      item.$schema !== "https://ui.shadcn.com/schema/registry-item.json" ||
      item.type !== "registry:component" ||
      !item.files?.some(
        (file: { path?: string; content?: string }) =>
          file.path === "components/smoke-button.tsx" &&
          file.content?.includes("SmokeButton")
      )
    ) {
      throw new Error("published item lost its installable file contract");
    }
  }
);
await expectResponse(
  "published artifact in registry index",
  `${apiUrl}/r/registry.json`,
  200,
  (_response, body) => {
    const registry = JSON.parse(body);
    if (
      !registry.items?.some((item: { name?: string }) =>
        item.name?.endsWith(`/${publishingName}`)
      )
    ) {
      throw new Error("published item is absent from registry index");
    }
  }
);
await expectResponse(
  "CLI install-source fetch",
  `${apiUrl}/cli/get?id=${encodeURIComponent(
    `@${publishBody.publishingDomain}`
  )}`,
  200,
  (_response, body) => {
    const source = JSON.parse(body);
    if (source.files?.["components/smoke-button.tsx"] === undefined)
      throw new Error("CLI fetch did not return the published source");
  },
  { headers: { "x-cli-token": cliToken } }
);

const rejectedCsrf = await fetchWithTimeout(`${apiUrl}/user/change-password`, {
  method: "POST",
  headers: {
    Cookie: sessionCookie,
    Origin: "https://cross-site.invalid",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    currentPassword: originalPassword,
    newPassword: replacementPassword,
  }),
});
if (rejectedCsrf.status !== 403) {
  throw new Error(
    `cross-site mutation was not rejected: HTTP ${rejectedCsrf.status}`
  );
}
console.log("ok - cross-site mutation rejected (403)");

const passwordChange = await fetchWithTimeout(
  `${apiUrl}/user/change-password`,
  {
    method: "POST",
    headers: { Cookie: sessionCookie, ...browserHeaders },
    body: JSON.stringify({
      currentPassword: originalPassword,
      newPassword: replacementPassword,
    }),
  }
);
if (passwordChange.status !== 201) {
  throw new Error(`password change failed with HTTP ${passwordChange.status}`);
}
await expectResponse(
  "credential change invalidates old session",
  `${apiUrl}/user/whoami`,
  401,
  undefined,
  { headers: { Cookie: sessionCookie } }
);

console.log(`self-host smoke passed: ${apiUrl} + ${webUrl}`);
