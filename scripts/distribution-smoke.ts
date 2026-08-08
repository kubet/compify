import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

/**
 * Exercises the real self-hosted source-distribution journey:
 * browser registration/login -> CLI token -> local Storybook export ->
 * public/private publish -> registry authorization -> CLI installation.
 *
 * The stack and built CLI must exist before this script is run.
 */
const root = resolve(import.meta.dir, "..");
const apiUrl = (process.env.API_URL ?? "http://localhost:3009").replace(/\/$/, "");
const webUrl = (process.env.WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");
const cli = join(root, "packages/cli/dist/index.js");
const fixture = join(root, "examples/storybook-button");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectJson(url: string, status: number, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  const text = await response.text();
  assert(response.status === status, `${url}: expected ${status}, got ${response.status}: ${text.slice(0, 300)}`);
  if (!text) return undefined;
  try { return JSON.parse(text); }
  catch { throw new Error(`${url}: expected JSON, got ${JSON.stringify(text.slice(0, 300))}`); }
}

async function expectStatus(url: string, status: number, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  const text = await response.text();
  assert(response.status === status, `${url}: expected ${status}, got ${response.status}: ${text.slice(0, 300)}`);
  return text;
}

function runCli(args: string[], env: Record<string, string> = {}) {
  const result = Bun.spawnSync(["bun", cli, "--api-url", apiUrl, "--web-url", webUrl, ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = result.stdout.toString();
  const stderr = result.stderr.toString();
  assert(result.exitCode === 0, `compify ${args.join(" ")} failed\n${stdout}\n${stderr}`);
  return stdout;
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `distribution-${suffix}@example.test`;
const password = ["Distribution", "smoke", "12345"].join("-");
const headers = { Origin: webUrl, "Content-Type": "application/json" };
await expectStatus(`${apiUrl}/user/register`, 201, {
  method: "POST", headers, body: JSON.stringify({ email, password, firstName: "Distribution", lastName: "Smoke" }),
});
const login = await fetch(`${apiUrl}/user/login`, {
  method: "POST", headers, body: JSON.stringify({ email, password }),
  signal: AbortSignal.timeout(15_000),
});
assert(login.status === 201, `login failed: ${login.status}`);
const cookie = (login.headers.get("set-cookie") ?? "").split(";", 1)[0];
assert(cookie.startsWith("compify_auth="), "login did not issue the auth cookie");
const tokenResult = await expectJson(`${apiUrl}/user/cli/token`, 201, {
  method: "POST", headers: { Cookie: cookie, Origin: webUrl },
});
assert(typeof tokenResult?.token === "string" && tokenResult.token.startsWith("cli_"), "CLI token was not generated");
const cliEnv = { COMPIFY_TOKEN: tokenResult.token };

const temp = mkdtempSync(join(tmpdir(), "compify-distribution-"));
try {
  const localArtifact = join(temp, "button.registry.json");
  runCli(["storybook", "export", "src/Button.stories.tsx", "--story", "Primary", "--cwd", fixture, "--output", localArtifact]);
  const exported = JSON.parse(readFileSync(localArtifact, "utf8"));
  assert(exported.files.some((file: any) => file.path === "src/Button.tsx"), "local export omitted the component entry");
  assert(exported.files.some((file: any) => file.path === "src/button.module.css"), "local export omitted a transitive stylesheet");

  async function publish(visibility: "public" | "private", description?: string) {
    const slug = `${visibility}-button-${suffix}`.toLowerCase();
    const args = [
      "storybook", "publish", "src/Button.stories.tsx", "--story", "Primary", "--cwd", fixture,
      "--name", `${visibility}-button`, "--publishing-name", slug, "--visibility", visibility,
      ...(description ? ["--description", description] : []), "--json",
    ];
    const stdout = runCli(args, cliEnv);
    let result: any;
    try { result = JSON.parse(stdout); }
    catch { throw new Error(`publish --json emitted non-JSON stdout: ${JSON.stringify(stdout)}`); }
    assert(/^[a-f0-9]{64}$/.test(result.digest), `${visibility} publish omitted the canonical envelope digest`);
    assert(result.immutableRegistryUrl, `${visibility} publish omitted the immutable revision URL`);
    return result;
  }

  const publicResult = await publish("public");
  const privateResult = await publish("private");
  const publicRepeat = await publish("public");
  assert(publicRepeat.revision === publicResult.revision, "same digest was not idempotent");
  assert(publicRepeat.immutableRegistryUrl === publicResult.immutableRegistryUrl, "same digest changed immutable identity");
  const publicNext = await publish("public", "revision two");
  assert(publicNext.revision === publicResult.revision + 1, "changed artifact did not append a revision");
  assert(publicNext.immutableRegistryUrl !== publicResult.immutableRegistryUrl, "changed artifact reused an immutable URL");

  // Two independent CLI processes exercise the cross-instance PostgreSQL
  // advisory lock rather than an in-process mutex.
  async function publishConcurrent(description: string) {
    const slug = `public-button-${suffix}`.toLowerCase();
    const child = Bun.spawn([
      "bun", cli, "--api-url", apiUrl, "--web-url", webUrl,
      "storybook", "publish", "src/Button.stories.tsx", "--story", "Primary",
      "--cwd", fixture, "--name", "public-button", "--publishing-name", slug,
      "--visibility", "public", "--description", description, "--json",
    ], {
      cwd: root,
      env: { ...process.env, ...cliEnv },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    assert(exitCode === 0, `concurrent publish failed: ${stdout}
${stderr}`);
    return JSON.parse(stdout);
  }
  const concurrentDescriptions = ["concurrent alpha", "concurrent beta"];
  const concurrent = await Promise.all(
    concurrentDescriptions.map((description) => publishConcurrent(description)),
  );
  assert(
    JSON.stringify(concurrent.map((item) => item.revision).sort((a, b) => a - b)) ===
      JSON.stringify([publicNext.revision + 1, publicNext.revision + 2]),
    "concurrent publishes did not receive consecutive unique revisions",
  );
  const concurrentItems = await Promise.all(
    concurrent.map((item) => expectJson(item.immutableRegistryUrl, 200)),
  );
  assert(
    concurrentDescriptions.every((description) =>
      concurrentItems.some((item) => item.description === description),
    ),
    "concurrent immutable artifacts did not preserve both reviewed payloads",
  );

  const publicItem = await expectJson(publicResult.registryUrl, 200);
  assert(/^[a-f0-9]{64}$/.test(publicItem.meta?.compify?.digest), "public registry lost the selected bundle digest");
  assert(
    concurrentDescriptions.includes(publicItem.description),
    "latest registry URL did not advance to a serialized concurrent revision",
  );
  assert(JSON.stringify(publicItem.files.map((file: any) => [file.path, file.content])) === JSON.stringify(exported.files.map((file: any) => [file.path, file.content])), "public registry changed the reviewed source graph");
  const originalPublic = await expectJson(publicResult.immutableRegistryUrl, 200);
  assert(originalPublic.description === undefined, "immutable historical revision changed after republish");
  await expectJson(privateResult.immutableRegistryUrl, 404);
  const immutablePrivate = await expectJson(privateResult.immutableRegistryUrl, 200, {
    headers: { Authorization: `Bearer ${tokenResult.token}` },
  });
  assert(immutablePrivate.files?.length === exported.files.length, "immutable private revision is unavailable to owner");
  await expectJson(privateResult.registryUrl, 404);
  await expectJson(privateResult.registryUrl, 404, {
    headers: { Authorization: "Bearer malformed" },
  });
  const otherEmail = `other-${suffix}@example.test`;
  await expectStatus(`${apiUrl}/user/register`, 201, {
    method: "POST", headers, body: JSON.stringify({ email: otherEmail, password, firstName: "Other", lastName: "Smoke" }),
  });
  const otherLogin = await fetch(`${apiUrl}/user/login`, {
    method: "POST", headers, body: JSON.stringify({ email: otherEmail, password }),
    signal: AbortSignal.timeout(15_000),
  });
  assert(otherLogin.status === 201, `other-user login failed: ${otherLogin.status}`);
  const otherCookie = (otherLogin.headers.get("set-cookie") ?? "").split(";", 1)[0];
  const otherToken = await expectJson(`${apiUrl}/user/cli/token`, 201, {
    method: "POST", headers: { Cookie: otherCookie, Origin: webUrl },
  });
  const namespaceAvailability = await expectJson(
    `${apiUrl}/component/check/domain?domain=${encodeURIComponent(`public-button-${suffix}`)}`,
    200,
    { headers: { Cookie: otherCookie, Origin: webUrl } },
  );
  assert(
    namespaceAvailability.available === true,
    "another user's publishing slug leaked as unavailable across namespaces",
  );
  await expectJson(
    `${apiUrl}/component/check/domain?domain=${encodeURIComponent(publicResult.publishingDomain)}`,
    400,
    { headers: { Cookie: otherCookie, Origin: webUrl } },
  );
  await expectJson(privateResult.registryUrl, 404, {
    headers: { Authorization: `Bearer ${otherToken.token}` },
  });
  await expectJson(privateResult.immutableRegistryUrl, 404, {
    headers: { Authorization: `Bearer ${otherToken.token}` },
  });
  const privateItem = await expectJson(privateResult.registryUrl, 200, {
    headers: { Authorization: `Bearer ${tokenResult.token}` },
  });
  assert(/^[a-f0-9]{64}$/.test(privateItem.meta?.compify?.digest), "private registry lost the selected bundle digest");
  assert(JSON.stringify(privateItem.files.map((file: any) => [file.path, file.content])) === JSON.stringify(exported.files.map((file: any) => [file.path, file.content])), "private registry changed the reviewed source graph");
  const index = await expectJson(`${apiUrl}/r/registry.json`, 200);
  assert(index.items.some((item: any) => item.name === publicResult.publishingDomain), "public publish is absent from the registry index");
  assert(!index.items.some((item: any) => item.name === privateResult.publishingDomain), "private publish leaked into the registry index");

  for (const result of [publicResult, privateResult]) {
    const consumer = join(temp, result === publicResult ? "public-consumer" : "private-consumer");
    mkdirSync(consumer, { recursive: true });
    await Bun.write(join(consumer, "package.json"), JSON.stringify({ name: "consumer", private: true }));
    runCli(["add", result.componentId, "--yes", "--cwd", consumer], cliEnv);
    assert(existsSync(join(consumer, "src/components", result === publicResult ? "public-button" : "private-button", "src/Button.tsx")), `${result.publishingDomain} did not install through the CLI`);
  }

  // Exercise the supported private-registry protocol through the official,
  // pinned shadcn client—not Compify's legacy installer.
  const shadcnConsumer = join(temp, "shadcn-private-consumer");
  cpSync(join(root, "examples/consumer-next-ts"), shadcnConsumer, {
    recursive: true,
    filter: (source) => !["node_modules", ".next", ".env"].includes(source.split("/").at(-1) || ""),
  });
  const components = JSON.parse(readFileSync(join(shadcnConsumer, "components.json"), "utf8"));
  const [username, privateName] = privateResult.publishingDomain.split("/");
  assert(username && privateName, "private publication has no namespaced address");
  components.registries = {
    "@compify": {
      url: `${apiUrl}/r/${username}/{name}.json`,
      headers: { Authorization: "Bearer ${COMPIFY_TOKEN}" },
    },
  };
  await Bun.write(join(shadcnConsumer, "components.json"), `${JSON.stringify(components, null, 2)}
`);
  const run = (command: string[], env: Record<string, string> = {}) => {
    const result = Bun.spawnSync(command, {
      cwd: shadcnConsumer,
      env: { ...process.env, ...env },
      stdout: "inherit",
      stderr: "inherit",
    });
    assert(result.exitCode === 0, `${command.join(" ")} failed`);
  };
  run(["bun", "install", "--frozen-lockfile"]);
  run(["bunx", "shadcn@4.16.2", "add", `@compify/${privateName}`, "--yes"], {
    COMPIFY_TOKEN: tokenResult.token,
  });
  assert(existsSync(join(shadcnConsumer, "src/components/Button.tsx")), "shadcn omitted Button.tsx");
  assert(existsSync(join(shadcnConsumer, "src/components/button.module.css")), "shadcn omitted the transitive stylesheet");
  run(["bun", "run", "build"], { NEXT_TELEMETRY_DISABLED: "1" });

  await expectJson(`${apiUrl}/user/cli/token/revoke`, 201, {
    method: "POST", headers: { Cookie: otherCookie, Origin: webUrl },
  });
  await expectJson(`${apiUrl}/user/cli/token/revoke`, 201, {
    method: "POST", headers: { Cookie: cookie, Origin: webUrl },
  });
  await expectJson(privateResult.registryUrl, 404, {
    headers: { Authorization: `Bearer ${tokenResult.token}` },
  });
  console.log("distribution smoke passed: CSF export, serialized immutable revisions, namespace/private policy, Compify + shadcn install/build, and token revocation");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
