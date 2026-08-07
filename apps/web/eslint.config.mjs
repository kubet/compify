import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    // The existing editor predates React Compiler lint rules. Keep legacy
    // behavior buildable while exhaustive dependency and Next.js diagnostics
    // remain visible; migrate these patterns incrementally instead of hiding
    // them with file-level suppressions.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "@next/next/no-css-tags": "off",
      "@next/next/no-location-assign-relative-destination": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-children-prop": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "public/fumadocs.css",
    "public/tailwindv4.js",
    "src/utils/tailwindv4.js",
  ]),
]);
