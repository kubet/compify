export const locales = ["en", "sr", "de"];

// Fail closed to local development. Hosted and self-hosted production builds
// must provide their own public API and CDN origins explicitly.
export const baseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009"
).replace(/\/$/, "");
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");
export const cdnUrl = (
  process.env.NEXT_PUBLIC_CDN_URL || "http://localhost:9000/public"
).replace(/\/$/, "");
// Compify does not ship a Sandpack bundler. Keep the editor disabled until an
// operator explicitly configures a compatible service.
export const bundlerUrl = (process.env.NEXT_PUBLIC_BUNDLER_URL || "").replace(
  /\/$/,
  "",
);

export const turnstileSiteKey = (
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
).trim();
export const googleOAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
export const turnstileEnabled =
  process.env.NEXT_PUBLIC_TURNSTILE_ENABLED === "true";
