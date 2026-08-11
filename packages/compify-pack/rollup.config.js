/* eslint-disable @typescript-eslint/no-var-requires */
const commonjs = require("@rollup/plugin-commonjs");
const replace = require("@rollup/plugin-replace");
const typescript = require("@rollup/plugin-typescript");

const pkg = require("./package.json");
const generateUnstyledTypes = require("./scripts/rollup-generate-unstyled-types");
const removeCss = require("./scripts/rollup-remove-css-transformer");

// Keep the remote browser bundler URL pinned to the reviewed client baseline.
const sandpackClientVersion = require("./sandpack-client/package.json").version;

const basePlugins = [commonjs({ requireReturnsDefault: "preferred" })];

const external = [
  "react/jsx-runtime",
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const baseConfig = { input: "src/index.ts", external };
const modificationBanner =
  "/* Modified by Compify from CodeSandbox Sandpack v2.19.8; see packages/compify-pack/PROVENANCE.md. */";

const configBase = [
  {
    ...baseConfig,
    plugins: basePlugins.concat(
      replace({
        preventAssignment: true,
        values: {
          "process.env.TEST_ENV": "false",
          "process.env.SANDPACK_UNSTYLED_COMPONENTS": `"false"`,
          "process.env.SANDPACK_CLIENT_VERSION": `"${sandpackClientVersion}"`,
        },
      }),
      typescript({ tsconfig: "./tsconfig.json" })
    ),
    output: [
      {
        dir: "dist",
        exports: "named",
        format: "cjs",
        inlineDynamicImports: true,
        interop: "auto",
        banner: `${modificationBanner}\n"use client";\n`,
        preserveModules: false,
      },
      {
        dir: "dist",
        chunkFileNames: "[name]-[hash].mjs",
        entryFileNames: "[name].mjs",
        exports: "named",
        format: "es",
        inlineDynamicImports: true,
        banner: `${modificationBanner}\n"use client";\n`,
        preserveModules: false,
      },
    ],
  },

  {
    ...baseConfig,
    treeshake: {
      preset: "smallest",
      manualPureFunctions: ["createStitches"],
    },
    plugins: basePlugins.concat(
      replace({
        preventAssignment: true,
        values: {
          "process.env.TEST_ENV": "false",
          "process.env.SANDPACK_UNSTYLED_COMPONENTS": `"true"`,
          "process.env.SANDPACK_CLIENT_VERSION": `"${sandpackClientVersion}"`,
        },
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        compilerOptions: { outDir: "dist/unstyled/" },
      }),
      removeCss(),
      generateUnstyledTypes()
    ),
    output: [
      {
        dir: "dist/unstyled",
        exports: "named",
        format: "cjs",
        inlineDynamicImports: true,
        interop: "auto",
        banner: modificationBanner,
      },
      {
        dir: "dist/unstyled",
        chunkFileNames: "[name]-[hash].mjs",
        entryFileNames: "[name].mjs",
        exports: "named",
        format: "es",
        inlineDynamicImports: true,
        banner: modificationBanner,
      },
    ],
  },
];

module.exports = configBase;
