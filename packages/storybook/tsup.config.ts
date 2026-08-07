import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { parameters: "src/index.ts", manager: "src/manager.tsx", "manager-legacy": "src/manager-legacy.tsx" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    external: ["react", "react-dom", "@storybook/manager-api", "storybook/manager-api"],
  },
  {
    entry: { preset: "src/preset.ts" },
    format: ["cjs"],
    platform: "node",
    dts: true,
    sourcemap: true,
    clean: false,
    outExtension: () => ({ js: ".cjs" }),
  },
]);
