import fs from "fs"
import path from "path"
import crypto from "crypto"
import { execFileSync } from "child_process"
import { parse } from "@babel/parser"

export interface PortabilityDiagnostic {
  severity: "warning" | "error"
  code: string
  message: string
  file?: string
  exportName?: string
}
export interface StoryInfo {
  exportName: string
  name: string
  args?: unknown
  portable: boolean
}
export interface StoryBundle {
  schemaVersion: 1
  name: string
  description?: string
  publishingName: string
  visibility: "public" | "private" | "unlisted"
  language: "tsx" | "jsx" | "ts" | "js"
  entry: string
  files: Record<string, string>
  dependencies: Record<string, string>
  stories: StoryInfo[]
  provenance: { storyPath: string; gitCommit?: string; gitRemote?: string }
  digest: string
  diagnostics: PortabilityDiagnostic[]
}

const SOURCE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"]
const TEXT_EXTENSIONS = [...SOURCE_EXTENSIONS, ".css", ".scss", ".sass", ".less", ".json", ".svg", ".md"]
const MAX_FILES = 100
const MAX_FILE_BYTES = 256 * 1024
const MAX_TOTAL_BYTES = 5 * 1024 * 1024
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".next"])

function contained(root: string, target: string): boolean {
  const relative = path.relative(root, target)
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
}
function posixRelative(root: string, target: string): string {
  return path.relative(root, target).split(path.sep).join("/")
}
function findPackageRoot(start: string): string {
  let current = path.dirname(start)
  for (;;) {
    if (fs.existsSync(path.join(current, "package.json"))) return fs.realpathSync(current)
    const parent = path.dirname(current)
    if (parent === current) throw new Error("Could not find a package.json above the Storybook entry")
    current = parent
  }
}
function walkStories(dir: string, found: string[]) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory() && IGNORED_DIRS.has(item.name)) continue
    const candidate = path.join(dir, item.name)
    if (item.isDirectory()) walkStories(candidate, found)
    else if (/\.stories\.(?:tsx?|jsx?|mjs|cjs)$/.test(item.name)) found.push(candidate)
  }
}
export function resolveStoryEntry(input: string | undefined, cwd = process.cwd()): string {
  const realCwd = fs.realpathSync(path.resolve(cwd))
  if (input) {
    const selected = path.resolve(realCwd, input)
    if (!fs.existsSync(selected) || !fs.statSync(selected).isFile()) throw new Error(`Story entry does not exist: ${input}`)
    const real = fs.realpathSync(selected)
    if (!contained(realCwd, real)) throw new Error("Story entry escapes the working directory (including through a symlink)")
    if (!/\.stories\.(?:tsx?|jsx?|mjs|cjs)$/.test(real)) throw new Error("Entry must be a React CSF story source file (*.stories.tsx/jsx/ts/js)")
    return real
  }
  const found: string[] = []
  walkStories(realCwd, found)
  found.sort()
  if (found.length !== 1) throw new Error(found.length ? `Multiple story entries found; specify one explicitly:\n${found.map(x => `  ${posixRelative(realCwd, x)}`).join("\n")}` : "No Storybook story entry found; specify a *.stories.tsx/jsx file")
  return fs.realpathSync(found[0])
}
function parserPlugins(filename: string): any[] {
  const plugins: any[] = ["jsx", "decorators-legacy", "classProperties", "dynamicImport", "importAttributes"]
  if (/\.[cm]?tsx?$/.test(filename)) plugins.push("typescript")
  return plugins
}
function parseSource(source: string, filename: string): any {
  try { return parse(source, { sourceType: "unambiguous", plugins: parserPlugins(filename), errorRecovery: false }) }
  catch (error) { throw new Error(`Could not statically parse ${filename}: ${error instanceof Error ? error.message : String(error)}`) }
}
function unwrap(node: any): any {
  while (node && ["TSAsExpression", "TSSatisfiesExpression", "TSNonNullExpression", "TypeCastExpression", "ParenthesizedExpression"].includes(node.type)) node = node.expression
  return node
}
function staticValue(node: any): { ok: true; value: any } | { ok: false } {
  node = unwrap(node)
  if (!node) return { ok: false }
  if (node.type === "StringLiteral" || node.type === "NumericLiteral" || node.type === "BooleanLiteral") return { ok: true, value: node.value }
  if (node.type === "NullLiteral") return { ok: true, value: null }
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return { ok: true, value: node.quasis[0].value.cooked ?? node.quasis[0].value.raw }
  if (node.type === "UnaryExpression" && ["-", "+", "!"].includes(node.operator)) {
    const v = staticValue(node.argument); if (!v.ok) return v
    return { ok: true, value: node.operator === "-" ? -v.value : node.operator === "+" ? +v.value : !v.value }
  }
  if (node.type === "ArrayExpression") {
    const result: any[] = []
    for (const child of node.elements) { const v = staticValue(child); if (!v.ok) return v; result.push(v.value) }
    return { ok: true, value: result }
  }
  if (node.type === "ObjectExpression") {
    const result: Record<string, any> = {}
    for (const prop of node.properties) {
      if (prop.type !== "ObjectProperty" || prop.computed) return { ok: false }
      const key = prop.key.name ?? prop.key.value
      if (typeof key !== "string") return { ok: false }
      const v = staticValue(prop.value); if (!v.ok) return v
      result[key] = v.value
    }
    return { ok: true, value: result }
  }
  return { ok: false }
}
function objectProperty(node: any, name: string): any {
  node = unwrap(node)
  if (node?.type !== "ObjectExpression") return undefined
  const p = node.properties.find((x: any) => x.type === "ObjectProperty" && !x.computed && (x.key.name === name || x.key.value === name))
  return p?.value
}
function storyDisplayName(exportName: string): string {
  return exportName.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, x => x.toUpperCase())
}
function declarations(ast: any): Map<string, any> {
  const values = new Map<string, any>()
  for (const statement of ast.program.body) {
    const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement
    if (declaration?.type === "VariableDeclaration") {
      for (const item of declaration.declarations) if (item.id.type === "Identifier") values.set(item.id.name, unwrap(item.init))
    }
  }
  return values
}
function resolveAlias(node: any, values: Map<string, any>): any {
  const seen = new Set<string>()
  node = unwrap(node)
  while (node?.type === "Identifier" && values.has(node.name) && !seen.has(node.name)) {
    seen.add(node.name); node = unwrap(values.get(node.name))
  }
  return node
}
function defaultMeta(ast: any): any {
  const values = declarations(ast)
  const statement = ast.program.body.find((item: any) => item.type === "ExportDefaultDeclaration")
  return statement ? resolveAlias(statement.declaration, values) : undefined
}
function inferComponentSpecifier(ast: any): string | undefined {
  const values = declarations(ast)
  const meta = defaultMeta(ast)
  const component = resolveAlias(objectProperty(meta, "component"), values)
  if (!component) return undefined
  let binding: string | undefined
  if (component.type === "Identifier") binding = component.name
  else if (component.type === "MemberExpression" && component.object.type === "Identifier") binding = component.object.name
  if (!binding) return undefined
  for (const statement of ast.program.body) {
    if (statement.type !== "ImportDeclaration") continue
    if (statement.specifiers.some((specifier: any) => specifier.local?.name === binding)) return statement.source.value
  }
  return undefined
}
function inspectStories(ast: any, file: string, diagnostics: PortabilityDiagnostic[]): StoryInfo[] {
  const candidates = new Map<string, any>()
  const assignments = new Map<string, any>()
  const meta = defaultMeta(ast)
  for (const statement of ast.program.body) {
    if (statement.type === "ExportNamedDeclaration") {
      const d = statement.declaration
      if (d?.type === "VariableDeclaration") for (const decl of d.declarations) if (decl.id.type === "Identifier") candidates.set(decl.id.name, unwrap(decl.init))
      if (d?.type === "FunctionDeclaration" && d.id) candidates.set(d.id.name, d)
    }
    if (statement.type === "ExpressionStatement" && statement.expression.type === "AssignmentExpression") {
      const left = statement.expression.left
      if (left.type === "MemberExpression" && !left.computed && left.object.type === "Identifier" && ["args", "storyName"].includes(left.property.name)) assignments.set(`${left.object.name}.${left.property.name}`, statement.expression.right)
    }
  }
  const exclude = staticValue(objectProperty(meta, "excludeStories")); const include = staticValue(objectProperty(meta, "includeStories"))
  const allowed = (n: string) => !(exclude.ok && Array.isArray(exclude.value) && exclude.value.includes(n)) && !(include.ok && Array.isArray(include.value) && !include.value.includes(n))
  const stories: StoryInfo[] = []
  for (const [exportName, value] of candidates) {
    if (!allowed(exportName) || exportName.startsWith("_") || exportName === "meta") continue
    const argsNode = objectProperty(value, "args") ?? assignments.get(`${exportName}.args`)
    const nameNode = objectProperty(value, "name") ?? assignments.get(`${exportName}.storyName`)
    const nameValue = staticValue(nameNode)
    const argsValue = staticValue(argsNode)
    let portable = true
    let args: unknown
    if (argsNode && argsValue.ok) args = argsValue.value
    else if (argsNode) {
      portable = false
      diagnostics.push({ severity: "warning", code: "DYNAMIC_STORY_ARGS", message: "Story args are not a JSON-static literal", file, exportName })
    }
    if (nameNode && !nameValue.ok) diagnostics.push({ severity: "warning", code: "DYNAMIC_STORY_NAME", message: "Story name is dynamic; using export name", file, exportName })
    stories.push({ exportName, name: nameValue.ok && typeof nameValue.value === "string" ? nameValue.value : storyDisplayName(exportName), ...(args !== undefined ? { args } : {}), portable })
  }
  if (!meta) diagnostics.push({ severity: "error", code: "MISSING_META", message: "No CSF default export was found", file })
  if (!stories.length) diagnostics.push({ severity: "error", code: "NO_STORIES", message: "No named CSF story exports were found", file })
  return stories.sort((a, b) => a.exportName.localeCompare(b.exportName))
}
function literalModuleTarget(node: any): string | undefined {
  node = unwrap(node)
  if (node?.type === "StringLiteral") return node.value
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0) return node.quasis[0].value.cooked ?? node.quasis[0].value.raw
  return undefined
}
function importSources(ast: any, file: string, diagnostics: PortabilityDiagnostic[]): string[] {
  const found = new Set<string>()
  const reportDynamic = (kind: string) => diagnostics.push({ severity: "error", code: "DYNAMIC_IMPORT_UNRESOLVED", file, message: `${kind} target must be a static string literal so its source can be bundled` })
  const visit = (node: any): void => {
    if (!node || typeof node !== "object") return
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) && node.source) {
      const target = literalModuleTarget(node.source); if (target !== undefined) found.add(target)
    }
    if (node.type === "ImportExpression") {
      const target = literalModuleTarget(node.source)
      if (target === undefined) reportDynamic("import()")
      else found.add(target)
    }
    if (node.type === "CallExpression" && (node.callee?.type === "Import" || (node.callee?.type === "Identifier" && node.callee.name === "require"))) {
      const kind = node.callee.type === "Import" ? "import()" : "require()"
      const target = node.arguments?.length === 1 ? literalModuleTarget(node.arguments[0]) : undefined
      if (target === undefined) reportDynamic(kind)
      else found.add(target)
    }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue
      if (Array.isArray(value)) for (const child of value) visit(child)
      else if (value && typeof value === "object") visit(value)
    }
  }
  visit(ast.program)
  return [...found]
}
function barePackage(specifier: string): string {
  const parts = specifier.split("/")
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}
function resolveLocal(from: string, specifier: string): string {
  const base = path.resolve(path.dirname(from), specifier)
  const options = [base, ...TEXT_EXTENSIONS.map(e => base + e), ...TEXT_EXTENSIONS.map(e => path.join(base, `index${e}`))]
  const hit = options.find(p => fs.existsSync(p) && fs.statSync(p).isFile())
  if (!hit) throw new Error(`Could not resolve local import ${JSON.stringify(specifier)} from ${from}`)
  return fs.realpathSync(hit)
}
function likelySecretKind(text: string): string | undefined {
  const patterns: Array<[string, RegExp]> = [
    ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ["Stripe live secret key", /\bsk_live_[A-Za-z0-9]{16,}\b/],
    ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
    ["OpenAI-style API key", /\bsk-[A-Za-z0-9_-]{32,}\b/],
    ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
    ["Google API key", /\bAIza[A-Za-z0-9_-]{35}\b/],
  ]
  return patterns.find(([, pattern]) => pattern.test(text))?.[0]
}
function assertSafeText(filename: string, buffer: Buffer) {
  const base = path.basename(filename).toLowerCase()
  if (/^(\.env(?:\..*)?|\.npmrc|\.yarnrc(?:\..*)?|\.pypirc|credentials(?:\.json)?|secrets?(?:\..*)?|id_(?:rsa|dsa|ecdsa|ed25519)|.*\.(?:pem|key|p12|pfx|crt|cer))$/.test(base)) throw new Error(`Refusing to include secret file: ${filename}`)
  const text = buffer.toString("utf8")
  const secretKind = likelySecretKind(text)
  if (secretKind) throw new Error(`${secretKind} detected in ${filename}`)
  if (buffer.includes(0) || text.includes("\uFFFD") || /[\x00-\x08\x0e-\x1f]/.test(text)) throw new Error(`Refusing to include binary or invalid UTF-8 file: ${filename}`)
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) throw new Error(`Private key detected in ${filename}`)
}
function gitValue(root: string, args: string[]): string | undefined {
  try { return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || undefined } catch { return undefined }
}
function sanitizeGitRemote(remote: string | undefined): string | undefined {
  if (!remote) return undefined
  // SCP-like SSH syntax (git@host:owner/repo.git).
  const scp = remote.match(/^(?:[^@/:]+@)?([A-Za-z0-9.-]+):(.+)$/)
  if (scp && !remote.includes("://") && !/^[A-Za-z]:/.test(remote)) {
    const cleanPath = scp[2].split(/[?#]/, 1)[0].replace(/^\/+/, "")
    return cleanPath ? `${scp[1].toLowerCase()}/${cleanPath}` : undefined
  }
  try {
    const parsed = new URL(remote)
    if (!["https:", "http:", "ssh:", "git:"].includes(parsed.protocol) || !parsed.hostname) return undefined
    const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, "")
    return cleanPath ? `${parsed.host.toLowerCase()}/${cleanPath}` : undefined
  } catch { return undefined }
}
function sourceLanguage(filename: string): "tsx" | "jsx" | "ts" | "js" {
  const extension = path.extname(filename).toLowerCase()
  if (extension === ".tsx") return "tsx"
  if (extension === ".ts") return "ts"
  if (extension === ".jsx") return "jsx"
  return "js" // .js, .mjs, and .cjs share the API wire language.
}
function validateSlug(value: string, field: string, max: number): void {
  if (value.length > max || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new Error(`${field} must be a lowercase slug of at most ${max} characters`)
}
function canonical(value: any): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`
  return JSON.stringify(value)
}
export interface BuildStoryOptions { cwd?: string; name?: string; publishingName?: string; description?: string; visibility?: "public" | "private" | "unlisted"; componentEntry?: string }
export function buildStoryBundle(input?: string, options: BuildStoryOptions = {}): StoryBundle {
  const storyPath = resolveStoryEntry(input, options.cwd)
  const root = findPackageRoot(storyPath)
  if (!contained(root, storyPath)) throw new Error("Story entry escapes its package root")
  const storyRel = posixRelative(root, storyPath)
  const storyRaw = fs.readFileSync(storyPath); assertSafeText(storyRel, storyRaw)
  const storySource = storyRaw.toString("utf8").replace(/\r\n?/g, "\n")
  const storyAst = parseSource(storySource, storyRel)
  const diagnostics: PortabilityDiagnostic[] = []
  const stories = inspectStories(storyAst, storyRel, diagnostics)

  let componentPath: string | undefined
  if (options.componentEntry) {
    const requested = path.resolve(options.cwd || process.cwd(), options.componentEntry)
    if (!fs.existsSync(requested) || !fs.statSync(requested).isFile()) throw new Error(`Component entry does not exist: ${options.componentEntry}`)
    componentPath = fs.realpathSync(requested)
    if (!contained(root, componentPath)) throw new Error("Component entry escapes the story package root (including through a symlink)")
  } else {
    const specifier = inferComponentSpecifier(storyAst)
    if (specifier?.startsWith(".")) {
      try { componentPath = resolveLocal(storyPath, specifier) }
      catch (error) { diagnostics.push({ severity: "error", code: "COMPONENT_ENTRY_UNRESOLVED", message: error instanceof Error ? error.message : String(error), file: storyRel }) }
    } else {
      diagnostics.push({
        severity: "error", code: "COMPONENT_ENTRY_UNRESOLVED", file: storyRel,
        message: specifier
          ? `CSF meta component resolves to non-local import ${JSON.stringify(specifier)}; pass --component-entry <path>`
          : "Could not infer a local component source from default meta.component; pass --component-entry <path>",
      })
    }
  }
  if (componentPath && !contained(root, componentPath)) throw new Error("Inferred component entry escapes the package root (including through a symlink)")
  if (componentPath && (!SOURCE_EXTENSIONS.includes(path.extname(componentPath)) || /\.stories\./.test(path.basename(componentPath)))) {
    diagnostics.push({ severity: "error", code: "INVALID_COMPONENT_ENTRY", message: "Component entry must be a non-story JavaScript/TypeScript source file", file: posixRelative(root, componentPath) })
    componentPath = undefined
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
  const versions = { ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies, ...pkg.dependencies }
  const files = new Map<string, string>(); const dependencyNames = new Set<string>(); const queue = componentPath ? [componentPath] : []
  let total = 0
  while (queue.length) {
    const current = queue.shift()!; const rel = posixRelative(root, current)
    if (files.has(rel)) continue
    if (!contained(root, current)) throw new Error(`Local import escapes package root: ${current}`)
    const raw = fs.readFileSync(current); assertSafeText(rel, raw)
    const normalized = raw.toString("utf8").replace(/\r\n?/g, "\n")
    const fileBytes = Buffer.byteLength(normalized, "utf8")
    if (fileBytes > MAX_FILE_BYTES) throw new Error(`File exceeds ${MAX_FILE_BYTES} byte limit: ${rel}`)
    total += fileBytes
    if (total > MAX_TOTAL_BYTES) throw new Error(`Component bundle exceeds ${MAX_TOTAL_BYTES} byte limit`)
    files.set(rel, normalized)
    if (files.size > MAX_FILES) throw new Error(`Component bundle exceeds ${MAX_FILES} file limit`)
    if (!SOURCE_EXTENSIONS.includes(path.extname(current))) continue
    const ast = parseSource(normalized, rel)
    for (const source of importSources(ast, rel, diagnostics)) {
      if (source.startsWith(".") || source.startsWith("/")) {
        if (source.startsWith("/")) throw new Error(`Absolute local import is not portable: ${source}`)
        const resolved = resolveLocal(current, source)
        if (!contained(root, resolved)) throw new Error(`Local import escapes package root (including through a symlink): ${source}`)
        queue.push(resolved)
      } else if (!source.startsWith("node:")) dependencyNames.add(barePackage(source))
    }
  }
  const sortedFiles = Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)))
  const lower = new Map<string, string>(); for (const key of Object.keys(sortedFiles)) { const old = lower.get(key.toLowerCase()); if (old && old !== key) throw new Error(`Case-colliding paths are not portable: ${old} and ${key}`); lower.set(key.toLowerCase(), key) }
  const dependencies: Record<string, string> = {}
  for (const dep of [...dependencyNames].sort()) {
    if (typeof versions[dep] === "string") dependencies[dep] = versions[dep]
    else diagnostics.push({ severity: "error", code: "UNDECLARED_DEPENDENCY", message: `Bare import ${dep} is not declared in package.json` })
  }
  const entry = componentPath ? posixRelative(root, componentPath) : ""
  const baseName = path.basename(storyPath).replace(/\.stories\.[^.]+$/, "")
  const name = options.name || baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  if (!name) throw new Error("A non-empty component name is required")
  const publishingName = options.publishingName || name
  validateSlug(name, "name", 120); validateSlug(publishingName, "publishingName", 64)
  const gitCommit = gitValue(root, ["rev-parse", "HEAD"])
  const gitRemote = sanitizeGitRemote(gitValue(root, ["config", "--get", "remote.origin.url"]))
  const provenance = { storyPath: storyRel, ...(gitCommit ? { gitCommit } : {}), ...(gitRemote ? { gitRemote } : {}) }
  const languagePath = componentPath || storyPath
  const unsigned = { schemaVersion: 1 as const, name, ...(options.description ? { description: options.description } : {}), publishingName, visibility: options.visibility || "private" as const, language: sourceLanguage(languagePath), entry, files: sortedFiles, dependencies, stories, provenance }
  // Server contract: lowercase SHA-256 hex of stable, recursively key-sorted JSON
  // for the complete publish request, with only the top-level digest omitted.
  const digest = crypto.createHash("sha256").update(canonical(unsigned), "utf8").digest("hex")
  return { ...unsigned, digest, diagnostics }
}

export function toRegistryItem(bundle: StoryBundle) {
  return {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    name: bundle.name,
    type: "registry:component",
    ...(bundle.description ? { description: bundle.description } : {}),
    dependencies: Object.keys(bundle.dependencies),
    files: Object.entries(bundle.files).map(([filePath, content]) => ({ path: filePath, type: "registry:component", content })),
    meta: { compify: { schemaVersion: 1, entry: bundle.entry, stories: bundle.stories, provenance: bundle.provenance, digest: bundle.digest, dependencyVersions: bundle.dependencies } },
  }
}

export function publishPayload(bundle: StoryBundle): Omit<StoryBundle, "diagnostics"> {
  const { diagnostics: _diagnostics, ...payload } = bundle
  return payload
}
