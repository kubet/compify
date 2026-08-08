import fs from "fs"
import os from "os"
import path from "path"
import { execFileSync } from "child_process"
import { afterEach, describe, expect, it } from "vitest"
import { inspectStyleContract, scanConsumerStyleCandidates } from "./storybook-style-contract"

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }) })

describe("static CSS custom-property evidence", () => {
  it("reports literal uses, literal fallbacks, and definitions with deterministic file evidence", () => {
    const files = {
      "z.css": `.z { color: var(--z); --inside: 1 }`,
      "a.css": `:root {
  --brand: red;
}
.a { color: var( --brand , rgb(1, 2, 3)); background: var(--missing) }`,
      "component.tsx": `throw new Error("must not execute var(--runtime)")`,
    }
    const first = inspectStyleContract(files)
    const second = inspectStyleContract(Object.fromEntries(Object.entries(files).reverse()))
    expect(second).toEqual(first)
    expect(first.incomplete).toBe(true)
    expect(first.uses).toEqual([
      { name: "--brand", fallback: "rgb(1, 2, 3)", file: "a.css", line: 4, column: 18 },
      { name: "--missing", file: "a.css", line: 4, column: 59 },
      { name: "--z", file: "z.css", line: 1, column: 17 },
    ])
    expect(first.bundledDefinitions.map(x => [x.name, x.file])).toEqual([["--brand", "a.css"], ["--inside", "z.css"]])
  })

  it("ignores comments, strings, and dynamic/interpolated variable names without executing source", () => {
    ;(globalThis as any).__compifyStyleExecuted = false
    const evidence = inspectStyleContract({
      "adversarial.css": `/* var(--comment); --fake: red */
.x::after { content: "var(--string), --also-fake: x"; color: var(--${"${token}"}, red); outline: var( --literal, blue); bad: my-var(--not-a-call) }`,
      "evil.ts": `(globalThis as any).__compifyStyleExecuted = true; var(--not-css)`,
    })
    expect((globalThis as any).__compifyStyleExecuted).toBe(false)
    expect(evidence.uses).toEqual([{ name: "--literal", fallback: "blue", file: "adversarial.css", line: 2, column: 98 }])
    expect(evidence.bundledDefinitions).toEqual([])
  })


  it("keeps consumer candidates for every used name without implying lexical definitions resolve it", () => {
    const candidates = [
      { name: "--needed", file: "theme.css", line: 2, column: 3 },
      { name: "--already", file: "theme.css", line: 3, column: 3 },
      { name: "--unrelated", file: "theme.css", line: 4, column: 3 },
    ]
    const evidence = inspectStyleContract({
      "bundle.css": `:root { --already: red } .x { color: var(--needed); background: var(--already) }`,
    }, candidates)
    expect(evidence.consumerProvidedCandidates).toEqual([
      { name: "--needed", file: "theme.css", line: 2, column: 3 },
      { name: "--already", file: "theme.css", line: 3, column: 3 },
    ])
  })

  it("finds sorted consumer candidates without following symlinks", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "compify-style-consumer-")); roots.push(root)
    fs.mkdirSync(path.join(root, "styles")); fs.mkdirSync(path.join(root, "outside"))
    fs.writeFileSync(path.join(root, "styles", "z.css"), `.x { --z: 1; --a: 2 }`)
    fs.writeFileSync(path.join(root, "a.scss"), `:root { --brand: red }`)
    fs.writeFileSync(path.join(root, "outside", "hidden.css"), `:root { --hidden: 1 }`)
    fs.symlinkSync(path.join(root, "outside"), path.join(root, "styles", "linked"))
    fs.symlinkSync(path.join(root, "outside", "hidden.css"), path.join(root, "linked.css"))
    // A CSS-suffixed FIFO would block forever if special files were opened.
    execFileSync("mkfifo", [path.join(root, "never-open.css")])
    const candidates = scanConsumerStyleCandidates(root)
    expect(candidates.map(x => [x.file, x.name])).toEqual([
      ["a.scss", "--brand"], ["outside/hidden.css", "--hidden"], ["styles/z.css", "--z"], ["styles/z.css", "--a"],
    ])
  })
})
