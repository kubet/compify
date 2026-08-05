import { defineConfig } from "tsup"

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  minify: false,
  target: "esnext",
  outDir: "dist",
  splitting: false,
  shims: true,
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
})
