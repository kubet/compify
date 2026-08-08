import fs from "fs"
import path from "path"

export interface StyleContractLocation {
  file: string
  line: number
  column: number
}
export interface StyleContractUse extends StyleContractLocation {
  name: string
  /** Literal source between the first top-level comma and the closing paren. */
  fallback?: string
}
export interface StyleContractDefinition extends StyleContractLocation { name: string }
export interface StyleContractEvidence {
  schemaVersion: 1
  analysis: "static-css-lexical"
  incomplete: true
  limitations: string[]
  uses: StyleContractUse[]
  /** Lexical declaration candidates; not proof that a use resolves. */
  bundledDefinitions: StyleContractDefinition[]
  /** Pre-install lexical candidates for names used by the selected bundle. */
  consumerProvidedCandidates: StyleContractDefinition[]
}

const STYLE_EXTENSIONS = new Set([".css", ".scss", ".sass", ".less"])
const LIMITATIONS = [
  "Evidence is lexical and incomplete; it does not execute CSS, preprocessors, JavaScript, Storybook, or a browser.",
  "Only conventional literal custom-property names in bundled stylesheet files are recognized; computed, escaped, interpolated, and runtime-generated names are omitted.",
  "Bundled and consumer definitions are candidates, not proof that cascade, scope, selector, layer, media, or import order makes a value available.",
]

function maskedCss(source: string): string {
  const chars = source.split("")
  let state: "code" | "comment" | "single" | "double" = "code"
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i], next = chars[i + 1]
    if (state === "code") {
      if (c === "/" && next === "*") { chars[i] = chars[i + 1] = " "; i++; state = "comment" }
      else if (c === "'") { chars[i] = " "; state = "single" }
      else if (c === '"') { chars[i] = " "; state = "double" }
    } else if (state === "comment") {
      if (c === "*" && next === "/") { chars[i] = chars[i + 1] = " "; i++; state = "code" }
      else if (c !== "\n" && c !== "\r") chars[i] = " "
    } else {
      const quote = state === "single" ? "'" : '"'
      if (c === "\\") { chars[i] = " "; if (i + 1 < chars.length) { if (chars[i + 1] !== "\n" && chars[i + 1] !== "\r") chars[i + 1] = " "; i++ } }
      else if (c === quote) { chars[i] = " "; state = "code" }
      else if (c !== "\n" && c !== "\r") chars[i] = " "
    }
  }
  return chars.join("")
}
function location(source: string, offset: number, file: string): StyleContractLocation {
  const before = source.slice(0, offset)
  const line = before.split("\n").length
  const last = before.lastIndexOf("\n")
  return { file, line, column: offset - last }
}
function compareEvidence(a: StyleContractLocation & { name: string }, b: StyleContractLocation & { name: string }) {
  return a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column || a.name.localeCompare(b.name)
}
function scanStylesheet(source: string, file: string) {
  const masked = maskedCss(source)
  const definitions: StyleContractDefinition[] = []
  const uses: StyleContractUse[] = []
  const definition = /(^|[;{])\s*(--[A-Za-z_][A-Za-z0-9_-]*)\s*:/gm
  for (const match of masked.matchAll(definition)) {
    const offset = match.index! + match[0].indexOf(match[2])
    definitions.push({ name: match[2], ...location(source, offset, file) })
  }
  const use = /(^|[^A-Za-z0-9_-])var\s*\(\s*(--[A-Za-z_][A-Za-z0-9_-]*)/g
  for (const match of masked.matchAll(use)) {
    const name = match[2]
    const nameOffset = match.index! + match[0].lastIndexOf(name)
    const open = match.index! + match[0].indexOf("(", match[1].length)
    let depth = 1, comma = -1, close = -1
    for (let i = open + 1; i < masked.length; i++) {
      if (masked[i] === "(") depth++
      else if (masked[i] === ")") { depth--; if (depth === 0) { close = i; break } }
      else if (masked[i] === "," && depth === 1 && comma < 0) comma = i
    }
    const fallback = comma >= 0 && close >= 0 ? source.slice(comma + 1, close).trim() : undefined
    uses.push({ name, ...(fallback !== undefined ? { fallback } : {}), ...location(source, nameOffset, file) })
  }
  return { definitions, uses }
}

export function inspectStyleContract(files: Record<string, string>, consumerProvidedCandidates: StyleContractDefinition[] = []): StyleContractEvidence {
  const uses: StyleContractUse[] = []
  const bundledDefinitions: StyleContractDefinition[] = []
  for (const file of Object.keys(files).sort()) {
    if (!STYLE_EXTENSIONS.has(path.posix.extname(file).toLowerCase())) continue
    const result = scanStylesheet(files[file], file)
    uses.push(...result.uses); bundledDefinitions.push(...result.definitions)
  }
  uses.sort(compareEvidence); bundledDefinitions.sort(compareEvidence)
  const usedNames = new Set(uses.map(item => item.name))
  const relevantCandidates = consumerProvidedCandidates.filter(item => usedNames.has(item.name)).sort(compareEvidence)
  return { schemaVersion: 1, analysis: "static-css-lexical", incomplete: true, limitations: [...LIMITATIONS], uses, bundledDefinitions, consumerProvidedCandidates: relevantCandidates }
}

/** Read stylesheet text only. Symlinks and ignored/generated trees are never followed. */
export function scanConsumerStyleCandidates(root: string): StyleContractDefinition[] {
  const realRoot = fs.realpathSync(root)
  const ignored = new Set([".git", "node_modules", ".next", "dist", "build", "coverage", "storybook-static"])
  const result: StyleContractDefinition[] = []
  let files = 0, bytes = 0
  const contained = (target: string) => {
    const relative = path.relative(realRoot, target)
    return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
  }
  const walk = (directory: string) => {
    const expectedDirectory = path.resolve(directory)
    const directoryInitial = fs.lstatSync(expectedDirectory)
    const directoryReal = fs.realpathSync(expectedDirectory)
    if (!directoryInitial.isDirectory() || directoryInitial.isSymbolicLink() ||
        directoryReal !== expectedDirectory || !contained(directoryReal))
      throw new Error("Consumer style evidence directory changed or escaped the consumer root")
    const entries = fs.readdirSync(expectedDirectory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    const directoryAfterRead = fs.lstatSync(expectedDirectory)
    if (!directoryAfterRead.isDirectory() || directoryAfterRead.dev !== directoryInitial.dev || directoryAfterRead.ino !== directoryInitial.ino)
      throw new Error("Consumer style evidence directory changed while listing")
    for (const item of entries) {
      const absolute = path.join(directory, item.name)
      const initial = fs.lstatSync(absolute)
      if (initial.isSymbolicLink()) continue
      if (initial.isDirectory()) { if (!ignored.has(item.name)) walk(absolute); continue }
      // Sockets, FIFOs, devices, and all other special files are never opened.
      if (!initial.isFile() || !STYLE_EXTENSIONS.has(path.extname(item.name).toLowerCase())) continue
      if (++files > 500) throw new Error("Consumer style evidence exceeded 500 stylesheet files")
      if (initial.size > 256 * 1024 || bytes + initial.size > 5 * 1024 * 1024) throw new Error("Consumer style evidence exceeded stylesheet byte limits")
      const noFollow = (fs.constants as typeof fs.constants & { O_NOFOLLOW?: number }).O_NOFOLLOW || 0
      const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | noFollow)
      try {
        const opened = fs.fstatSync(descriptor)
        const resolved = fs.realpathSync(absolute)
        const resolvedStats = fs.statSync(resolved)
        if (!opened.isFile() || opened.dev !== initial.dev || opened.ino !== initial.ino || opened.size !== initial.size ||
            resolved !== path.resolve(absolute) || !contained(resolved) ||
            resolvedStats.dev !== opened.dev || resolvedStats.ino !== opened.ino)
          throw new Error(`Consumer stylesheet changed or escaped while reading: ${item.name}`)
        const source = fs.readFileSync(descriptor, "utf8")
        const after = fs.fstatSync(descriptor)
        const resolvedAfter = fs.realpathSync(absolute)
        const resolvedStatsAfter = fs.statSync(resolvedAfter)
        if (after.dev !== opened.dev || after.ino !== opened.ino || after.size !== opened.size || after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs ||
            resolvedAfter !== resolved || resolvedStatsAfter.dev !== opened.dev || resolvedStatsAfter.ino !== opened.ino)
          throw new Error(`Consumer stylesheet changed while reading: ${item.name}`)
        bytes += opened.size
        const file = path.relative(realRoot, absolute).split(path.sep).join("/")
        result.push(...scanStylesheet(source, file).definitions)
      } finally { fs.closeSync(descriptor) }
    }
  }
  walk(realRoot)
  return result.sort(compareEvidence)
}
