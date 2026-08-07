export const locales = ["en", "sr", "de"];

// Fail closed to local development. Hosted and self-hosted production builds
// must provide their own public API and CDN origins explicitly.
export const baseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009"
).replace(/\/$/, "");
export const cdnUrl = (
  process.env.NEXT_PUBLIC_CDN_URL || "http://localhost:9000/public"
).replace(/\/$/, "");
export const bundlerUrl = (
  process.env.NEXT_PUBLIC_BUNDLER_URL || "http://localhost:3000/sandpack"
).replace(/\/$/, "");
