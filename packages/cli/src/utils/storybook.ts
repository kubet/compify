import fs from "fs"
import path from "path"
import crypto from "crypto"
import { execFileSync } from "child_process"
import { parse } from "@babel/parser"
import { inspectStyleContract, type StyleContractEvidence } from "./storybook-style-contract"

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
export type SourceMediaKind = "typescript" | "javascript" | "stylesheet" | "json" | "svg" | "markdown" | "text"
export interface SourceFileEvidence { sha256: string; mediaKind: SourceMediaKind }
export interface SourceImportEdge {
  from: string
  to: string | null
  specifier: string
  resolutionReason: "exact" | "extension" | "directory-index" | "alias" | "package" | "node-builtin" | "external-url" | "package-import" | "unresolved-local" | "absolute-local"
}
export interface SourceGraphEvidence {
  files: Record<string, SourceFileEvidence>
  imports: SourceImportEdge[]
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
  /** Deterministic inspection sidecar. Deliberately excluded from digest and registry wire payloads. */
  sourceGraph: SourceGraphEvidence
  /** Incomplete, non-executing CSS lexical evidence; excluded from digest and registry wire payloads. */
  styleContract: StyleContractEvidence
}

const SOURCE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"]
const TEXT_EXTENSIONS = [...SOURCE_EXTENSIONS, ".css", ".scss", ".sass", ".less", ".json", ".svg", ".md"]
const MAX_FILES = 500
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
type StaticResult = { ok: true; value: any } | { ok: false }
function staticValue(node: any, values?: Map<string, any>, seen = new Set<string>()): StaticResult {
  node = unwrap(node)
  if (!node) return { ok: false }
  if (node.type === "Identifier" && values?.has(node.name) && !seen.has(node.name)) {
    const nextSeen = new Set(seen); nextSeen.add(node.name)
    return staticValue(values.get(node.name), values, nextSeen)
  }
  if (node.type === "StringLiteral" || node.type === "BooleanLiteral") return { ok: true, value: node.value }
  if (node.type === "NumericLiteral") return Number.isFinite(node.value) ? { ok: true, value: node.value } : { ok: false }
  if (node.type === "NullLiteral") return { ok: true, value: null }
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return { ok: true, value: node.quasis[0].value.cooked ?? node.quasis[0].value.raw }
  if (node.type === "UnaryExpression" && ["-", "+", "!"].includes(node.operator)) {
    const v = staticValue(node.argument, values, seen); if (!v.ok) return v
    return { ok: true, value: node.operator === "-" ? -v.value : node.operator === "+" ? +v.value : !v.value }
  }
  if (node.type === "ArrayExpression") {
    const result: any[] = []
    for (const child of node.elements) {
      if (child?.type === "SpreadElement") {
        const spread = staticValue(child.argument, values, seen)
        if (!spread.ok || !Array.isArray(spread.value)) return { ok: false }
        result.push(...spread.value)
      } else {
        const v = staticValue(child, values, seen); if (!v.ok) return v; result.push(v.value)
      }
    }
    return { ok: true, value: result }
  }
  if (node.type === "ObjectExpression") {
    const result: Record<string, any> = {}
    for (const prop of node.properties) {
      if (prop.type === "SpreadElement") {
        const spread = staticValue(prop.argument, values, seen)
        if (!spread.ok || !spread.value || typeof spread.value !== "object" || Array.isArray(spread.value)) return { ok: false }
        Object.defineProperties(result, Object.getOwnPropertyDescriptors(spread.value))
        continue
      }
      if (prop.type !== "ObjectProperty" || prop.computed) return { ok: false }
      const key = prop.key.name ?? prop.key.value
      if (typeof key !== "string" && typeof key !== "number") return { ok: false }
      const v = staticValue(prop.value, values, seen); if (!v.ok) return v
      // defineProperty keeps special JSON keys such as __proto__ as own data
      // instead of mutating the evaluator object's prototype.
      Object.defineProperty(result, String(key), { value: v.value, enumerable: true, configurable: true, writable: true })
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
function csfFactoryMeta(ast: any): { binding: string; node: any } | undefined {
  const imported = new Set<string>()
  for (const statement of ast.program.body) if (statement.type === "ImportDeclaration") {
    for (const specifier of statement.specifiers) if (specifier.local?.name) imported.add(specifier.local.name)
  }
  for (const statement of ast.program.body) {
    const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement
    if (declaration?.type !== "VariableDeclaration") continue
    for (const item of declaration.declarations) {
      const init = unwrap(item.init); const callee = unwrap(init?.callee)
      if (item.id.type !== "Identifier" || init?.type !== "CallExpression" || init.arguments.length !== 1) continue
      if (callee?.type !== "MemberExpression" || callee.computed || callee.property.name !== "meta") continue
      if (callee.object.type !== "Identifier" || !imported.has(callee.object.name)) continue
      const node = unwrap(init.arguments[0])
      if (node?.type === "ObjectExpression") return { binding: item.id.name, node }
    }
  }
  return undefined
}
function defaultMeta(ast: any): any {
  const values = declarations(ast)
  const statement = ast.program.body.find((item: any) => item.type === "ExportDefaultDeclaration")
  if (statement) return resolveAlias(statement.declaration, values)
  // Babel represents `export { meta as default }` as a named export.
  for (const item of ast.program.body) if (item.type === "ExportNamedDeclaration" && !item.source) {
    const specifier = item.specifiers.find((s: any) => s.type === "ExportSpecifier" && (s.exported.name ?? s.exported.value) === "default")
    if (specifier?.local?.name) return resolveAlias({ type: "Identifier", name: specifier.local.name }, values)
  }
  return csfFactoryMeta(ast)?.node
}
function unwrapCsfFactoryStory(node: any, metaBinding: string | undefined): any {
  node = unwrap(node); const callee = unwrap(node?.callee)
  if (node?.type !== "CallExpression" || node.arguments.length !== 1 || callee?.type !== "MemberExpression" || callee.computed) return node
  if (callee.object?.type === "Identifier" && callee.object.name === metaBinding && callee.property.name === "story") return unwrap(node.arguments[0])
  return node
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
  const values = declarations(ast)
  const candidates = new Map<string, { node: any; localName: string }>()
  const assignments = new Map<string, any>()
  const meta = defaultMeta(ast)
  const factoryMeta = csfFactoryMeta(ast)
  for (const statement of ast.program.body) {
    if (statement.type === "ExportNamedDeclaration") {
      const d = statement.declaration
      if (d?.type === "VariableDeclaration") for (const decl of d.declarations) if (decl.id.type === "Identifier") candidates.set(decl.id.name, { node: unwrap(decl.init), localName: decl.id.name })
      if (d?.type === "FunctionDeclaration" && d.id) candidates.set(d.id.name, { node: d, localName: d.id.name })
      // CSF permits locally declared stories exported through an export list,
      // including aliases (`export { primary as Primary }`).
      if (!statement.source && statement.exportKind !== "type") for (const specifier of statement.specifiers) {
        if (specifier.type !== "ExportSpecifier" || specifier.exportKind === "type" || specifier.local?.type !== "Identifier") continue
        const exportName = specifier.exported.name ?? specifier.exported.value
        if (typeof exportName === "string" && exportName !== "default" && values.has(specifier.local.name)) {
          candidates.set(exportName, { node: unwrap(values.get(specifier.local.name)), localName: specifier.local.name })
        }
      }
    }
    if (statement.type === "ExpressionStatement" && statement.expression.type === "AssignmentExpression") {
      const left = statement.expression.left
      if (left.type === "MemberExpression" && !left.computed && left.object.type === "Identifier" && ["args", "storyName"].includes(left.property.name)) assignments.set(`${left.object.name}.${left.property.name}`, statement.expression.right)
    }
  }
  const matchesFilter = (node: any, exportName: string): boolean | undefined => {
    node = unwrap(node)
    const literal = staticValue(node, values)
    if (literal.ok && Array.isArray(literal.value)) return literal.value.includes(exportName)
    if (node?.type === "RegExpLiteral") {
      try { return new RegExp(node.pattern, node.flags.replace(/[gy]/g, "")).test(exportName) } catch { return undefined }
    }
    return undefined
  }
  const excludeNode = objectProperty(meta, "excludeStories")
  const includeNode = objectProperty(meta, "includeStories")
  const allowed = (name: string) => matchesFilter(excludeNode, name) !== true && matchesFilter(includeNode, name) !== false
  const stories: StoryInfo[] = []
  for (const [exportName, candidate] of candidates) {
    if (!allowed(exportName) || exportName.startsWith("_") || exportName === "meta") continue
    const rawValue = candidate.node
    const value = unwrapCsfFactoryStory(rawValue, factoryMeta?.binding)
    if (value === rawValue && rawValue?.type === "CallExpression" && rawValue.callee?.type === "MemberExpression" && rawValue.callee.property?.name === "extend") {
      diagnostics.push({ severity: "error", code: "CSF_FACTORY_EXTEND_UNSUPPORTED", message: "CSF factory Story.extend() inheritance is not statically supported", file, exportName })
    }
    const argsNode = objectProperty(value, "args") ?? assignments.get(`${candidate.localName}.args`)
    const nameNode = objectProperty(value, "name") ?? assignments.get(`${candidate.localName}.storyName`)
    const nameValue = staticValue(nameNode, values)
    const argsValue = staticValue(argsNode, values)
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
function importSources(ast: any, file: string, diagnostics: PortabilityDiagnostic[]): ModuleSource[] {
  const found = new Map<string, ModuleSource>()
  const reportDynamic = (kind: string) => diagnostics.push({ severity: "error", code: "DYNAMIC_IMPORT_UNRESOLVED", file, message: `${kind} target must be a static string literal so its source can be bundled` })
  const add = (node: any) => {
    const target = literalModuleTarget(node)
    if (target !== undefined && typeof node.start === "number" && typeof node.end === "number") found.set(`${node.start}:${node.end}`, { specifier: target, start: node.start, end: node.end })
    return target
  }
  const visit = (node: any): void => {
    if (!node || typeof node !== "object") return
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) && node.source) add(node.source)
    if (node.type === "ImportExpression") {
      if (add(node.source) === undefined) reportDynamic("import()")
    }
    if (node.type === "CallExpression" && (node.callee?.type === "Import" || (node.callee?.type === "Identifier" && node.callee.name === "require"))) {
      const kind = node.callee.type === "Import" ? "import()" : "require()"
      const targetNode = node.arguments?.length === 1 ? node.arguments[0] : undefined
      if (!targetNode || add(targetNode) === undefined) reportDynamic(kind)
    }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue
      if (Array.isArray(value)) for (const child of value) visit(child)
      else if (value && typeof value === "object") visit(value)
    }
  }
  visit(ast.program)
  return [...found.values()]
}
interface ModuleSource { specifier: string; start: number; end: number }
interface AliasConfig {
  root: string
  baseDir?: string
  hasBaseUrl?: boolean
  paths: Record<string, unknown>
  imports: Record<string, unknown>
}

function parseJsonConfig(filename: string): any {
  const raw = fs.readFileSync(filename)
  if (raw.byteLength > 256 * 1024) throw new Error(`Configuration exceeds 262144 byte limit: ${filename}`)
  const text = raw.toString("utf8")
  let clean = ""; let quoted = false; let escaped = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]; const next = text[i + 1]
    if (quoted) {
      clean += char
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === '"') quoted = false
    } else if (char === '"') { quoted = true; clean += char }
    else if (char === "/" && next === "/") { while (i < text.length && text[i] !== "\n") i++; clean += "\n" }
    else if (char === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2)
      if (end < 0) throw new Error(`Invalid unterminated comment in ${filename}`)
      clean += " ".repeat(end + 2 - i); i = end + 1
    } else clean += char
  }
  // JSONC permits trailing commas; remove them without touching string data.
  let json = ""; quoted = false; escaped = false
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]
    if (quoted) {
      json += char
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === '"') quoted = false
    } else if (char === '"') { quoted = true; json += char }
    else if (char === ",") {
      let next = i + 1
      while (/\s/.test(clean[next] || "")) next++
      if (clean[next] !== "}" && clean[next] !== "]") json += char
    } else json += char
  }
  try { return JSON.parse(json) }
  catch (error) { throw new Error(`Could not statically parse ${filename}: ${error instanceof Error ? error.message : String(error)}`) }
}
function findTsconfig(storyPath: string, root: string): string | undefined {
  let current = path.dirname(storyPath)
  for (;;) {
    const candidate = path.join(current, "tsconfig.json")
    if (fs.existsSync(candidate)) {
      const real = fs.realpathSync(candidate)
      if (!contained(root, real) || real !== path.resolve(candidate)) throw new Error("tsconfig.json escapes the package root through a symlink")
      return real
    }
    if (current === root) return undefined
    const parent = path.dirname(current)
    if (parent === current || !contained(root, parent)) return undefined
    current = parent
  }
}
function loadAliasConfig(storyPath: string, root: string, pkg: any): AliasConfig {
  const config: AliasConfig = { root, paths: {}, imports: pkg.imports && typeof pkg.imports === "object" && !Array.isArray(pkg.imports) ? pkg.imports : {} }
  const filename = findTsconfig(storyPath, root)
  if (!filename) return config
  const parsed = parseJsonConfig(filename)
  if (parsed?.extends !== undefined) throw new Error("tsconfig extends is not supported; inherited configuration is outside the bounded static alias contract")
  const compiler = parsed?.compilerOptions
  if (compiler !== undefined && (!compiler || typeof compiler !== "object" || Array.isArray(compiler))) throw new Error("tsconfig compilerOptions must be a static object")
  if (compiler?.paths !== undefined && (!compiler.paths || typeof compiler.paths !== "object" || Array.isArray(compiler.paths))) throw new Error("tsconfig compilerOptions.paths must be a static object")
  config.paths = compiler?.paths || {}
  if (compiler?.baseUrl !== undefined && typeof compiler.baseUrl !== "string") throw new Error("tsconfig compilerOptions.baseUrl must be a static string")
  const base = path.resolve(path.dirname(filename), compiler?.baseUrl || ".")
  if (!contained(root, base)) throw new Error("tsconfig baseUrl escapes the package root")
  config.baseDir = base
  config.hasBaseUrl = compiler?.baseUrl !== undefined
  return config
}
function wildcardMatches(pattern: string, specifier: string): boolean {
  const first = pattern.indexOf("*")
  if (first < 0) return false
  return specifier.startsWith(pattern.slice(0, first)) && specifier.endsWith(pattern.slice(first + 1))
}
function resolveFromBase(base: string, specifier: string): string {
  return resolveLocal(path.join(base, "__compify_alias__.ts"), `./${specifier.replace(/^\.\//, "")}`)
}
function assertAliasBoundary(specifier: string, resolved: string, config: AliasConfig): string {
  if (!contained(config.root, resolved)) throw new Error(`Alias ${JSON.stringify(specifier)} resolves outside its package root`)
  let boundary = path.dirname(resolved)
  while (boundary !== config.root) {
    if (fs.existsSync(path.join(boundary, "package.json"))) throw new Error(`Alias ${JSON.stringify(specifier)} crosses into a nested package root`)
    const parent = path.dirname(boundary)
    if (parent === boundary) throw new Error(`Alias ${JSON.stringify(specifier)} resolves outside its package root`)
    boundary = parent
  }
  return resolved
}
function configuredLocal(specifier: string, config: AliasConfig): string | undefined {
  let target: unknown
  let kind: "package.json imports" | "tsconfig paths" | undefined
  if (specifier.startsWith("#")) {
    if (Object.prototype.hasOwnProperty.call(config.imports, specifier)) { target = config.imports[specifier]; kind = "package.json imports" }
    else {
      const wildcard = Object.keys(config.imports).find(key => wildcardMatches(key, specifier))
      if (wildcard) throw new Error(`Wildcard package.json imports alias ${JSON.stringify(wildcard)} is not portable`)
      throw new Error(`Package import ${JSON.stringify(specifier)} is not an exact static package.json imports alias`)
    }
  } else if (Object.prototype.hasOwnProperty.call(config.paths, specifier)) {
    target = config.paths[specifier]; kind = "tsconfig paths"
  } else {
    const wildcard = Object.keys(config.paths).find(key => wildcardMatches(key, specifier))
    if (wildcard) throw new Error(`Wildcard tsconfig paths alias ${JSON.stringify(wildcard)} is not portable`)
    if (config.baseDir && config.hasBaseUrl) {
      try { return assertAliasBoundary(specifier, resolveFromBase(config.baseDir, specifier), config) }
      catch (error) { if (!(error instanceof Error) || !error.message.startsWith("Could not resolve local import")) throw error }
    }
    return undefined
  }
  if (kind === "tsconfig paths") {
    if (!Array.isArray(target) || target.length !== 1 || typeof target[0] !== "string") throw new Error(`Alias ${JSON.stringify(specifier)} in tsconfig paths must have exactly one static target`)
    target = target[0]
  } else if (typeof target !== "string") {
    throw new Error(`Alias ${JSON.stringify(specifier)} in package.json imports must have one unconditional string target`)
  }
  if (!target || target.includes("*") || target.includes("\\") || /[?#]/.test(target) || /^[A-Za-z][A-Za-z+.-]*:/.test(target) || path.isAbsolute(target) || (kind === "package.json imports" && !target.startsWith("./"))) {
    throw new Error(`Alias ${JSON.stringify(specifier)} has an external, absolute, wildcard, or non-portable target`)
  }
  const base = kind === "package.json imports" ? config.root : config.baseDir!
  const resolved = resolveFromBase(base, target)
  return assertAliasBoundary(specifier, resolved, config)
}
function portableRelative(from: string, target: string): string {
  let relative = path.relative(path.dirname(from), target).split(path.sep).join("/")
  if (SOURCE_EXTENSIONS.includes(path.extname(relative))) relative = relative.slice(0, -path.extname(relative).length)
  if (!relative.startsWith(".")) relative = `./${relative}`
  return relative
}
function rewriteModuleSources(source: string, references: ModuleSource[], replacements: Map<string, string>): string {
  const edits = references.filter(ref => replacements.has(`${ref.start}:${ref.end}`)).sort((a, b) => b.start - a.start)
  let result = source
  for (const ref of edits) result = result.slice(0, ref.start) + JSON.stringify(replacements.get(`${ref.start}:${ref.end}`)) + result.slice(ref.end)
  return result
}
function barePackage(specifier: string): string {
  const parts = specifier.split("/")
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}
function stylesheetSources(source: string): string[] {
  // Follow quoted stylesheet module edges without pretending arbitrary url()
  // assets are UTF-8 source. This covers CSS imports, Sass use/forward, Less
  // imports, and CSS Modules composition.
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, "")
  const found = new Set<string>()
  const directives = /@(import|use|forward)\s+(?:url\(\s*)?["']([^"']+)["']/g
  const composes = /\bcomposes\s*:[^;]*?\bfrom\s+["']([^"']+)["']/g
  for (const pattern of [directives, composes]) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(clean))) found.add(match[2] ?? match[1])
  }
  return [...found]
}
function resolveLocalWithReason(from: string, specifier: string): { path: string; reason: "exact" | "extension" | "directory-index" } {
  const base = path.resolve(path.dirname(from), specifier)
  const options: Array<{ path: string; reason: "exact" | "extension" | "directory-index" }> = [
    { path: base, reason: "exact" },
    ...TEXT_EXTENSIONS.map(extension => ({ path: base + extension, reason: "extension" as const })),
    ...TEXT_EXTENSIONS.map(extension => ({ path: path.join(base, `index${extension}`), reason: "directory-index" as const })),
  ]
  const hit = options.find(candidate => fs.existsSync(candidate.path) && fs.statSync(candidate.path).isFile())
  if (!hit) throw new Error(`Could not resolve local import ${JSON.stringify(specifier)} from ${from}`)
  const real = fs.realpathSync(hit.path)
  // A registry JSON cannot reproduce filesystem symlinks. Bundling the real
  // target while retaining the source import would create a broken artifact;
  // this also catches case-only import mismatches on case-insensitive hosts.
  if (path.resolve(hit.path) !== real) throw new Error(`Local import escapes the package root through a symlink or has mismatched path casing: ${specifier}`)
  return { path: real, reason: hit.reason }
}
function resolveLocal(from: string, specifier: string): string {
  return resolveLocalWithReason(from, specifier).path
}
function sourceMediaKind(filename: string): SourceMediaKind {
  const extension = path.extname(filename).toLowerCase()
  if ([".ts", ".tsx"].includes(extension)) return "typescript"
  if ([".js", ".jsx", ".mjs", ".cjs"].includes(extension)) return "javascript"
  if ([".css", ".scss", ".sass", ".less"].includes(extension)) return "stylesheet"
  if (extension === ".json") return "json"
  if (extension === ".svg") return "svg"
  if (extension === ".md") return "markdown"
  return "text"
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
export interface BuildStoryOptions { cwd?: string; name?: string; publishingName?: string; description?: string; visibility?: "public" | "private" | "unlisted"; componentEntry?: string; story?: string }
export function buildStoryBundle(input?: string, options: BuildStoryOptions = {}): StoryBundle {
  const storyPath = resolveStoryEntry(input, options.cwd)
  const root = findPackageRoot(storyPath)
  if (!contained(root, storyPath)) throw new Error("Story entry escapes its package root")
  const storyRel = posixRelative(root, storyPath)
  const storyRaw = fs.readFileSync(storyPath); assertSafeText(storyRel, storyRaw)
  if (storyRaw.byteLength > MAX_FILE_BYTES) throw new Error(`Story entry exceeds ${MAX_FILE_BYTES} byte limit: ${storyRel}`)
  const storySource = storyRaw.toString("utf8").replace(/\r\n?/g, "\n")
  const storyAst = parseSource(storySource, storyRel)
  const diagnostics: PortabilityDiagnostic[] = []
  const inspectedStories = inspectStories(storyAst, storyRel, diagnostics)
  let stories = inspectedStories
  if (options.story) {
    const selected = inspectedStories.find(story => story.exportName === options.story)
    if (!selected) throw new Error(`Story export not found: ${options.story}`)
    stories = [selected]
    // Story-scoped portability diagnostics from unselected exports must not
    // prevent exporting an explicitly selected portable story.
    for (let index = diagnostics.length - 1; index >= 0; index--) {
      if (diagnostics[index].exportName && diagnostics[index].exportName !== options.story) diagnostics.splice(index, 1)
    }
  }

  const pkg = parseJsonConfig(path.join(root, "package.json"))
  const aliases = loadAliasConfig(storyPath, root, pkg)
  let componentPath: string | undefined
  if (options.componentEntry) {
    const requested = path.resolve(options.cwd || process.cwd(), options.componentEntry)
    if (!fs.existsSync(requested) || !fs.statSync(requested).isFile()) throw new Error(`Component entry does not exist: ${options.componentEntry}`)
    componentPath = fs.realpathSync(requested)
    if (!contained(root, componentPath)) throw new Error("Component entry escapes the story package root (including through a symlink)")
  } else {
    const specifier = inferComponentSpecifier(storyAst)
    if (specifier) {
      try {
        componentPath = specifier.startsWith(".") ? resolveLocal(storyPath, specifier) : configuredLocal(specifier, aliases)
        if (!componentPath) diagnostics.push({ severity: "error", code: "COMPONENT_ENTRY_UNRESOLVED", file: storyRel, message: `CSF meta component resolves to non-local import ${JSON.stringify(specifier)}; pass --component-entry <path>` })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        // Missing entries are inspectable portability diagnostics; unsafe or
        // ambiguous alias configuration must fail closed.
        if (!specifier.startsWith(".") || !message.startsWith("Could not resolve local import")) throw error
        diagnostics.push({ severity: "error", code: "COMPONENT_ENTRY_UNRESOLVED", message, file: storyRel })
      }
    } else diagnostics.push({ severity: "error", code: "COMPONENT_ENTRY_UNRESOLVED", file: storyRel, message: "Could not infer a local component source from default meta.component; pass --component-entry <path>" })
  }
  if (componentPath && !contained(root, componentPath)) throw new Error("Inferred component entry escapes the package root (including through a symlink)")
  if (componentPath && (!SOURCE_EXTENSIONS.includes(path.extname(componentPath)) || /\.stories\./.test(path.basename(componentPath)))) {
    diagnostics.push({ severity: "error", code: "INVALID_COMPONENT_ENTRY", message: "Component entry must be a non-story JavaScript/TypeScript source file", file: posixRelative(root, componentPath) })
    componentPath = undefined
  }

  const versions = { ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies, ...pkg.dependencies }
  const files = new Map<string, string>()
  const dependencyNames = new Set<string>()
  const graphEdges: SourceImportEdge[] = []
  const queue = componentPath ? [componentPath] : []
  let total = 0
  while (queue.length) {
    const current = queue.shift()!; const rel = posixRelative(root, current)
    if (files.has(rel)) continue
    if (!contained(root, current)) throw new Error(`Local import escapes package root: ${current}`)
    const raw = fs.readFileSync(current); assertSafeText(rel, raw)
    let normalized = raw.toString("utf8").replace(/\r\n?/g, "\n")
    const extension = path.extname(current).toLowerCase()
    let references: ModuleSource[] = []
    if (SOURCE_EXTENSIONS.includes(extension)) {
      const ast = parseSource(normalized, rel)
      references = importSources(ast, rel, diagnostics)
    } else if ([".css", ".scss", ".sass", ".less"].includes(extension)) {
      references = stylesheetSources(normalized).map(specifier => ({ specifier, start: -1, end: -1 }))
    }
    const replacements = new Map<string, string>()
    for (const reference of [...references].sort((a, b) => a.specifier.localeCompare(b.specifier))) {
      const source = reference.specifier
      if (source.startsWith("/")) {
        graphEdges.push({ from: rel, to: null, specifier: source, resolutionReason: "absolute-local" })
        diagnostics.push({ severity: "error", code: "ABSOLUTE_LOCAL_IMPORT", message: `Absolute local import is not portable: ${source}`, file: rel })
      } else if (source.startsWith(".")) {
        try {
          const resolved = resolveLocalWithReason(current, source)
          if (!contained(root, resolved.path)) throw new Error(`Local import escapes package root (including through a symlink): ${source}`)
          const to = posixRelative(root, resolved.path)
          graphEdges.push({ from: rel, to, specifier: source, resolutionReason: resolved.reason })
          queue.push(resolved.path)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          if (!message.startsWith("Could not resolve local import")) throw error
          graphEdges.push({ from: rel, to: null, specifier: source, resolutionReason: "unresolved-local" })
          diagnostics.push({ severity: "error", code: "LOCAL_IMPORT_UNRESOLVED", message, file: rel })
        }
      } else if (source.startsWith("node:")) {
        graphEdges.push({ from: rel, to: source, specifier: source, resolutionReason: "node-builtin" })
      } else if (/^(?:data:|https?:|sass:)/.test(source)) {
        graphEdges.push({ from: rel, to: source, specifier: source, resolutionReason: "external-url" })
      } else {
        const resolved = configuredLocal(source, aliases)
        if (resolved) {
          const to = posixRelative(root, resolved)
          graphEdges.push({ from: rel, to, specifier: source, resolutionReason: "alias" })
          queue.push(resolved)
          if (reference.start >= 0) replacements.set(`${reference.start}:${reference.end}`, portableRelative(current, resolved))
          else throw new Error(`Aliases in stylesheets are not supported because they cannot be rewritten safely: ${source}`)
        } else if (source.startsWith("#")) {
          graphEdges.push({ from: rel, to: source, specifier: source, resolutionReason: "package-import" })
        } else {
          const dependency = barePackage(source)
          graphEdges.push({ from: rel, to: dependency, specifier: source, resolutionReason: "package" })
          dependencyNames.add(dependency)
        }
      }
    }
    normalized = rewriteModuleSources(normalized, references, replacements)
    const fileBytes = Buffer.byteLength(normalized, "utf8")
    if (fileBytes > MAX_FILE_BYTES) throw new Error(`File exceeds ${MAX_FILE_BYTES} byte limit: ${rel}`)
    total += fileBytes
    if (total > MAX_TOTAL_BYTES) throw new Error(`Component bundle exceeds ${MAX_TOTAL_BYTES} byte limit`)
    files.set(rel, normalized)
    if (files.size > MAX_FILES) throw new Error(`Component bundle exceeds ${MAX_FILES} file limit`)
  }

  const sortedFiles = Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)))
  const lower = new Map<string, string>(); for (const key of Object.keys(sortedFiles)) { const old = lower.get(key.toLowerCase()); if (old && old !== key) throw new Error(`Case-colliding paths are not portable: ${old} and ${key}`); lower.set(key.toLowerCase(), key) }
  const dependencies: Record<string, string> = {}
  for (const dep of [...dependencyNames].sort()) {
    const version = versions[dep]
    if (typeof version !== "string") {
      diagnostics.push({ severity: "error", code: "UNDECLARED_DEPENDENCY", message: `Bare import ${dep} is not declared in package.json` })
      continue
    }
    const normalizedVersion = version.trim()
    // Registry items must not transfer workspace paths, arbitrary URLs, VCS
    // sources, package-manager protocols, or other machine-local specifiers to
    // a consumer. Standard npm versions/ranges/tags contain none of these.
    if (!normalizedVersion || /^[a-z][a-z0-9+.-]*:/i.test(normalizedVersion) || /^git@/i.test(normalizedVersion) || /[\/#]/.test(normalizedVersion)) {
      diagnostics.push({ severity: "error", code: "NONPORTABLE_DEPENDENCY_SPEC", message: `Bare import ${dep} uses a nonportable dependency specifier: ${version}` })
      continue
    }
    dependencies[dep] = normalizedVersion
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
  const evidenceFiles: Record<string, SourceFileEvidence> = {}
  for (const [filePath, content] of Object.entries(sortedFiles)) {
    evidenceFiles[filePath] = {
      sha256: crypto.createHash("sha256").update(content, "utf8").digest("hex"),
      mediaKind: sourceMediaKind(filePath),
    }
  }
  graphEdges.sort((a, b) => canonical(a) < canonical(b) ? -1 : canonical(a) > canonical(b) ? 1 : 0)
  const sourceGraph = { files: evidenceFiles, imports: graphEdges }
  const styleContract = inspectStyleContract(sortedFiles)
  // sourceGraph and styleContract are inspection evidence, not publish content. Keeping them out of
  // unsigned preserves the established wire digest semantics deliberately.
  return { ...unsigned, digest, diagnostics, sourceGraph, styleContract }
}

/** Return the deterministic local-import chain from the component entry to a
 * bundled path. An empty chain means the requested path is the entry. */
export function explainInclusion(bundle: StoryBundle, requestedPath: string): SourceImportEdge[] | undefined {
  const target = requestedPath.replace(/\\/g, "/").replace(/^\.\//, "")
  if (!target || target === bundle.entry) return target === bundle.entry ? [] : undefined
  if (!Object.prototype.hasOwnProperty.call(bundle.sourceGraph.files, target)) return undefined
  const local = bundle.sourceGraph.imports.filter(edge => edge.to !== null && Object.prototype.hasOwnProperty.call(bundle.sourceGraph.files, edge.to))
  const queue: Array<{ file: string; chain: SourceImportEdge[] }> = [{ file: bundle.entry, chain: [] }]
  const visited = new Set<string>([bundle.entry])
  while (queue.length) {
    const current = queue.shift()!
    for (const edge of local.filter(candidate => candidate.from === current.file)) {
      if (edge.to === target) return [...current.chain, edge]
      if (edge.to && !visited.has(edge.to)) {
        visited.add(edge.to)
        queue.push({ file: edge.to, chain: [...current.chain, edge] })
      }
    }
  }
  return undefined
}

function registryFileType(entry: string, filePath: string): "registry:component" | "registry:lib" | "registry:hook" | "registry:ui" {
  if (filePath === entry) return "registry:component"
  const normalized = `/${filePath.replace(/^\/+/, "")}`
  if (/\/components\/ui\//.test(normalized)) return "registry:ui"
  if (/\/hooks?\//.test(normalized)) return "registry:hook"
  if (/\/lib\//.test(normalized)) return "registry:lib"
  return "registry:component"
}

export function toRegistryItem(bundle: StoryBundle) {
  return {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    name: bundle.name,
    type: "registry:component",
    ...(bundle.description ? { description: bundle.description } : {}),
    dependencies: Object.entries(bundle.dependencies).map(([name, version]) => `${name}@${version}`),
    files: Object.entries(bundle.files).map(([filePath, content]) => ({
      path: filePath,
      type: registryFileType(bundle.entry, filePath),
      content,
    })),
    meta: { compify: { schemaVersion: 1, entry: bundle.entry, stories: bundle.stories, provenance: bundle.provenance, digest: bundle.digest, dependencyVersions: bundle.dependencies } },
  }
}

/** Build the v2 publish envelope. The registry item is the source of truth so
 * every shadcn field survives API storage and registry reads without lossy
 * reconstruction. Registry-item files are deliberately text-only: binary
 * assets must be hosted externally and referenced by source. */
export function publishPayload(bundle: StoryBundle) {
  const unsigned = {
    schemaVersion: 2 as const,
    publishingName: bundle.publishingName,
    visibility: bundle.visibility,
    language: bundle.language,
    entry: bundle.entry,
    dependencyVersions: bundle.dependencies,
    stories: bundle.stories,
    provenance: bundle.provenance,
    registryItem: toRegistryItem(bundle),
  }
  const digest = crypto.createHash("sha256").update(canonical(unsigned), "utf8").digest("hex")
  return { ...unsigned, digest }
}
