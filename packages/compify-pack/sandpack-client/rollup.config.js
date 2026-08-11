const path = require("node:path");
const commonjs = require("@rollup/plugin-commonjs");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const replace = require("@rollup/plugin-replace");
const typescript = require("@rollup/plugin-typescript");

const pkg = require("./package.json");
const root = __dirname;
const fromRoot = (...parts) => path.join(root, ...parts);
const banner =
  "/* Compify browser-only derivative of CodeSandbox Sandpack v2.19.8, Apache-2.0; see PROVENANCE.md. */";

const sourceAsString = () => ({
  name: "source-as-string",
  transform(code, id) {
    if (id === fromRoot("src/inject-scripts/dist/consoleHook.js")) {
      return { code: `export default ${JSON.stringify(code)};`, map: null };
    }
    return null;
  },
});

module.exports = [
  {
    input: fromRoot("src/inject-scripts/consoleHook.ts"),
    output: {
      file: fromRoot("src/inject-scripts/dist/consoleHook.js"),
      format: "es",
    },
    plugins: [
      typescript({
        filterRoot: false,
        include: [fromRoot("src/**/*.ts")],
        tsconfig: fromRoot("tsconfig.json"),
        compilerOptions: {
          declaration: false,
          emitDeclarationOnly: false,
          outDir: fromRoot("src/inject-scripts/dist"),
        },
      }),
      commonjs(),
      nodeResolve(),
    ],
  },
  {
    input: {
      index: fromRoot("src/index.ts"),
      "clients/runtime/index": fromRoot("src/clients/runtime/index.ts"),
      "clients/static/index": fromRoot("src/clients/static/index.ts"),
    },
    output: [
      { dir: fromRoot("dist"), format: "cjs", banner },
      {
        dir: fromRoot("dist"),
        chunkFileNames: "[name]-[hash].mjs",
        entryFileNames: "[name].mjs",
        format: "es",
        banner,
      },
    ],
    plugins: [
      typescript({
        filterRoot: false,
        include: [fromRoot("src/**/*.ts")],
        tsconfig: fromRoot("tsconfig.json"),
        compilerOptions: { emitDeclarationOnly: false },
      }),
      sourceAsString(),
      replace({
        preventAssignment: true,
        values: {
          global: "globalThis",
          "process.env.CODESANDBOX_ENV": '"production"',
          "process.env.PACKAGE_VERSION": JSON.stringify(pkg.version),
        },
      }),
    ],
    external: Object.keys(pkg.dependencies || {}),
  },
];
