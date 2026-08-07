import fs from "fs"
import path from "path"

export function componentFolderName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

/** Resolve an untrusted registry filename without allowing it to escape root. */
export function safeComponentPath(root: string, filename: string): string {
  if (!filename || filename.includes("\0") || path.isAbsolute(filename) || path.win32.isAbsolute(filename)) {
    throw new Error(`Unsafe component path: ${JSON.stringify(filename)}`)
  }

  const segments = filename.split(/[\\/]+/)
  if (segments.some((segment) => segment === "..")) {
    throw new Error(`Unsafe component path: ${JSON.stringify(filename)}`)
  }

  const base = path.resolve(root)
  const target = path.resolve(base, ...segments)
  const relative = path.relative(base, target)
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Unsafe component path: ${JSON.stringify(filename)}`)
  }

  // Refuse traversal through an existing symlink. Missing descendants are
  // safe to create after their nearest existing parent has been checked.
  let current = base
  for (const segment of segments) {
    current = path.join(current, segment)
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(`Unsafe component path through symlink: ${JSON.stringify(filename)}`)
    }
  }

  return target
}
