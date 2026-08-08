import fs from "fs"
import os from "os"
import path from "path"
import { execFileSync } from "child_process"
import { afterEach, describe, expect, it } from "vitest"
import { buildStoryBundle, publishPayload, resolveStoryEntry, toRegistryItem } from "./storybook"

const roots: string[] = []
function project(files: Record<string, string>, pkg: object = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "compify-story-")); roots.push(root)
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "fixture", dependencies: { react: "^19.0.0", lodash: "4.17.21" }, ...pkg }))
  for (const [name, content] of Object.entries(files)) { const target = path.join(root, name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content) }
  return root
}
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }) })

describe("static Storybook bundling", () => {
  it("extracts CSF3 and CSF2 static args without executing source", () => {
    const root = project({
      "Button.stories.tsx": `import React from "react"\nimport { Button } from "./Button"\nexport default { title: "Button", component: Button }\nexport const Primary = { name: "Primary action", args: { label: "Go", disabled: false, count: -2, items: [1, null] } }\nexport function Legacy() { return <Button /> }\nLegacy.args = { label: "Old" }\n`,
      "Button.tsx": `import React from "react"\nexport const Button = () => null\n`,
    })
    const bundle = buildStoryBundle("Button.stories.tsx", { cwd: root })
    expect(bundle.stories).toEqual([
      { exportName: "Legacy", name: "Legacy", args: { label: "Old" }, portable: true },
      { exportName: "Primary", name: "Primary action", args: { label: "Go", disabled: false, count: -2, items: [1, null] }, portable: true },
    ])
    expect(bundle.files).toHaveProperty("Button.tsx")
    expect(bundle.dependencies).toEqual({ react: "^19.0.0" })
    expect(bundle.digest).toMatch(/^[a-f0-9]{64}$/)
  })

  it("reports dynamic args rather than evaluating them", () => {
    const root = project({ "X.stories.tsx": `const secret = process.env.SECRET\nexport default { title: "X" }\nexport const Dynamic = { args: makeArgs(secret) }\n` })
    const bundle = buildStoryBundle(undefined, { cwd: root })
    expect(bundle.stories[0]).toMatchObject({ exportName: "Dynamic", portable: false })
    expect(bundle.diagnostics).toContainEqual(expect.objectContaining({ code: "DYNAMIC_STORY_ARGS", severity: "warning" }))
  })

  it("selects one exact story and ignores non-portability in unselected stories", () => {
    const root = project({
      "Button.stories.tsx": `import { Button } from "./Button"
export default { component: Button }
export const Portable = { args: { label: "Go" } }
export const Dynamic = { args: makeArgs() }
`,
      "Button.tsx": `export const Button = () => null
`,
    })
    const bundle = buildStoryBundle(undefined, { cwd: root, story: "Portable" })
    expect(bundle.stories).toEqual([{ exportName: "Portable", name: "Portable", args: { label: "Go" }, portable: true }])
    expect(bundle.diagnostics).not.toContainEqual(expect.objectContaining({ exportName: "Dynamic" }))
  })

  it("rejects a named-story selection that does not exactly match an exported story", () => {
    const root = project({ "X.stories.tsx": `export default {}
export const Primary = {}
` })
    expect(() => buildStoryBundle(undefined, { cwd: root, story: "primary" })).toThrow("Story export not found: primary")
  })

  it("terminates local import cycles and normalizes CRLF deterministically", () => {
    const files = {
      "Cycle.stories.tsx": `import { a } from "./a"\nexport default { title: "Cycle", component: a }\nexport const One = { args: { ok: true } }\n`,
      "a.ts": `import "./b"\r\nexport const a = 1\r\n`, "b.ts": `import "./a"\nexport const b = 2\n`,
    }
    const a = project(files), b = project(files)
    const first = buildStoryBundle(undefined, { cwd: a }); const second = buildStoryBundle(undefined, { cwd: b })
    expect(Object.keys(first.files)).toEqual(["a.ts", "b.ts"])
    expect(first.files["a.ts"]).not.toContain("\r")
    expect(first.digest).toBe(second.digest)
    expect(JSON.stringify(publishPayload(first))).toBe(JSON.stringify(publishPayload(second)))
  })

  it("walks React.lazy import(), CommonJS require, and bare dynamic dependencies", () => {
    const root = project({
      "Dynamic.stories.tsx": `import { DynamicComponent } from "./Dynamic"\nexport default { component: DynamicComponent }\nexport const Default = {}\n`,
      "Dynamic.tsx": `import React from "react"\nconst Lazy = React.lazy(() => import("./Lazy"))\nconst helper = require("./helper")\nvoid import("lodash")\nexport const DynamicComponent = () => <Lazy value={helper} />\n`,
      "Lazy.tsx": `export default function Lazy() { return null }\n`,
      "helper.ts": `export const helper = true\n`,
    })
    const bundle = buildStoryBundle(undefined, { cwd: root })
    expect(Object.keys(bundle.files)).toEqual(["Dynamic.tsx", "helper.ts", "Lazy.tsx"])
    expect(bundle.dependencies).toEqual({ lodash: "4.17.21", react: "^19.0.0" })
    expect(bundle.diagnostics).not.toContainEqual(expect.objectContaining({ code: "DYNAMIC_IMPORT_UNRESOLVED" }))
  })

  it("rejects nonliteral import() and require() targets", () => {
    const root = project({
      "Unknown.stories.tsx": `import { Unknown } from "./Unknown"\nexport default { component: Unknown }\nexport const Default = {}\n`,
      "Unknown.tsx": `const name = "./other"\nvoid import(name)\nrequire(getTarget())\nexport const Unknown = () => null\n`,
    })
    const bundle = buildStoryBundle(undefined, { cwd: root })
    expect(bundle.diagnostics.filter(d => d.code === "DYNAMIC_IMPORT_UNRESOLVED")).toHaveLength(2)
  })

  it.each([
    ["AWS", ["AK", "IA1234567890ABCDEF"].join("")],
    ["Stripe", ["sk", "live", "1234567890abcdefghijkl"].join("_")],
    ["GitHub", ["gh", "p_1234567890abcdefghijklmnop"].join("")],
    ["OpenAI", ["s", `k-${"A".repeat(40)}`].join("")],
    ["Slack", ["xo", "xb-1234567890-abcdefghijklmnop"].join("")],
    ["Google", ["AI", `za${"A".repeat(35)}`].join("")],
  ])("rejects high-confidence %s tokens in static story args", (_kind, token) => {
    const root = project({ "Token.stories.tsx": `export default {}\nexport const Leaked = { args: { token: ${JSON.stringify(token)} } }\n` })
    expect(() => buildStoryBundle(undefined, { cwd: root })).toThrow(/detected in Token\.stories\.tsx/)
  })

  it("has a stable digest contract test vector", () => {
    const root = project({ "Vector.stories.js": `import { Vector } from "./Vector"\nexport default { title: "Vector", component: Vector }\nexport const Basic = { args: { text: "hello", n: 1 } }\n`, "Vector.js": `export const Vector = () => null\n` }, { dependencies: {} })
    const bundle = buildStoryBundle(undefined, { cwd: root, name: "vector", publishingName: "vector", visibility: "public" })
    expect(bundle.digest).toBe("bacb55f15f87c8413e94c1a01dcf3f5266f775b2de62e02f1104ae09f7953a36")
  })

  it("infers alias+satisfies meta and supports an explicit component override", () => {
    const root = project({
      "Card.stories.tsx": `import type { Meta } from "@storybook/react"\nimport { Card } from "./Card"\nconst meta = { component: Card } satisfies Meta<typeof Card>\nexport default meta\nexport const Default = {}\n`,
      "Card.tsx": `export const Card = () => null\n`,
      "Alternate.tsx": `export const Alternate = () => null\n`,
    })
    const inferred = buildStoryBundle(undefined, { cwd: root })
    expect(inferred.entry).toBe("Card.tsx")
    expect(Object.keys(inferred.files)).toEqual(["Card.tsx"])
    expect(inferred.dependencies).not.toHaveProperty("@storybook/react")
    const overridden = buildStoryBundle(undefined, { cwd: root, componentEntry: "Alternate.tsx" })
    expect(overridden.entry).toBe("Alternate.tsx")
    expect(Object.keys(overridden.files)).toEqual(["Alternate.tsx"])
  })

  it("maps module extensions to the supported API language", () => {
    const root = project({
      "Widget.stories.mjs": `import { Widget } from "./Widget.mjs"\nexport default { component: Widget }\nexport const Default = {}\n`,
      "Widget.mjs": `export const Widget = () => null\n`,
    })
    expect(buildStoryBundle(undefined, { cwd: root }).language).toBe("js")
  })

  it("sanitizes credentialed git remotes and omits local remotes", () => {
    const root = project({
      "Remote.stories.tsx": `import { Remote } from "./Remote"\nexport default { component: Remote }\nexport const Default = {}\n`,
      "Remote.tsx": `export const Remote = () => null\n`,
    })
    execFileSync("git", ["init", "-q", root])
    execFileSync("git", ["-C", root, "remote", "add", "origin", "https://user:token@GitHub.com/acme/remote.git?access=secret#fragment"])
    expect(buildStoryBundle(undefined, { cwd: root }).provenance.gitRemote).toBe("github.com/acme/remote.git")
    execFileSync("git", ["-C", root, "remote", "set-url", "origin", "file:///tmp/private/repo"])
    expect(buildStoryBundle(undefined, { cwd: root }).provenance).not.toHaveProperty("gitRemote")
  })

  it("rejects invalid slugs, secret config names, and oversized files", () => {
    const root = project({
      "Safe.stories.tsx": `import { Safe } from "./Safe"\nexport default { component: Safe }\nexport const Default = {}\n`,
      "Safe.tsx": `export const Safe = () => null\n`,
    })
    expect(() => buildStoryBundle(undefined, { cwd: root, name: "Not Safe" })).toThrow(/name must be a lowercase slug/)
    expect(() => buildStoryBundle(undefined, { cwd: root, publishingName: "UPPER" })).toThrow(/publishingName must be a lowercase slug/)
    fs.writeFileSync(path.join(root, ".npmrc"), "//registry.example/:_authToken=nope\n")
    fs.writeFileSync(path.join(root, "Safe.tsx"), `import "./.npmrc"\nexport const Safe = () => null\n`)
    expect(() => buildStoryBundle(undefined, { cwd: root })).toThrow(/secret file/)
    fs.writeFileSync(path.join(root, "Safe.tsx"), `export const Safe = "${"x".repeat(256 * 1024)}"`)
    expect(() => buildStoryBundle(undefined, { cwd: root })).toThrow(/262144 byte limit/)
  })

  it("rejects traversal and symlink escapes", () => {
    const outside = project({ "outside.ts": "export const stolen = true\n" })
    const root = project({ "Unsafe.stories.tsx": `import { stolen } from "./link"\nexport default { component: stolen }\nexport const One = {}\n` })
    fs.symlinkSync(path.join(outside, "outside.ts"), path.join(root, "link.ts"))
    expect(() => buildStoryBundle(undefined, { cwd: root })).toThrow(/escapes the? package root.*symlink/i)
    expect(() => resolveStoryEntry("../nope.stories.tsx", root)).toThrow()
  })

  it("requires explicit selection when entry inference is ambiguous", () => {
    const root = project({ "A.stories.tsx": "export default {}; export const A = {}", "B.stories.tsx": "export default {}; export const B = {}" })
    expect(() => resolveStoryEntry(undefined, root)).toThrow(/Multiple story entries/)
  })

  it("exports shadcn registry metadata and rejects secrets and binaries", () => {
    const root = project({ "Fine.stories.tsx": `import { Fine } from "./Fine"\nimport type { Meta } from "@storybook/react"\nconst meta = { component: Fine } satisfies Meta<typeof Fine>\nexport default meta\nexport const Basic = {}\n`, "Fine.tsx": `import "./styles.css"\nexport const Fine = () => null\n`, "styles.css": ".fine { color: red; }\n" })
    const bundle = buildStoryBundle(undefined, { cwd: root })
    const item = toRegistryItem(bundle) as any
    expect(item.type).toBe("registry:component"); expect(item.meta.compify.stories[0].exportName).toBe("Basic")
    expect(bundle.entry).toBe("Fine.tsx"); expect(bundle.provenance.storyPath).toBe("Fine.stories.tsx")
    expect(item.files.map((f: any) => f.path)).toEqual(["Fine.tsx", "styles.css"])
    // shadcn registry-item schema: component files use registry:component and
    // therefore do not require the target demanded by generic registry:file.
    expect(item.files.every((f: any) => f.type === "registry:component" && !("target" in f))).toBe(true)
    expect(bundle.dependencies).not.toHaveProperty("@storybook/react")
    fs.writeFileSync(path.join(root, "bad.pem"), "-----BEGIN PRIVATE KEY-----\n")
    fs.writeFileSync(path.join(root, "Fine.tsx"), `import "./bad.pem"\nexport const Fine = () => null`)
    expect(() => buildStoryBundle(undefined, { cwd: root })).toThrow(/secret file/)
  })
})
