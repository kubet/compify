import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it } from "vitest"
import { componentFolderName, safeComponentPath } from "./component-path"

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

describe("component paths", () => {
  it("normalizes component folder names consistently", () => {
    expect(componentFolderName("My Fancy Card! ")).toBe("my-fancy-card")
  })

  it("accepts nested relative files under the install root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "compify-path-"))
    roots.push(root)
    expect(safeComponentPath(root, "parts/button.tsx")).toBe(
      path.join(root, "parts", "button.tsx")
    )
  })

  it.each(["../secret", "parts/../../secret", "/tmp/secret", "C:\\secret", "a\0b"])(
    "rejects unsafe registry filename %j",
    (filename) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), "compify-path-"))
      roots.push(root)
      expect(() => safeComponentPath(root, filename)).toThrow(/Unsafe component path/)
    }
  )

  it("rejects writes through an existing symlink", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "compify-path-"))
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "compify-outside-"))
    roots.push(root, outside)
    fs.symlinkSync(outside, path.join(root, "linked"))
    expect(() => safeComponentPath(root, "linked/file.tsx")).toThrow(/symlink/)
  })
})
