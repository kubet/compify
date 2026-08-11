import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withMDX = createMDX();

for (const key of [
  "NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED",
  "NEXT_PUBLIC_TURNSTILE_ENABLED",
]) {
  const value = process.env[key];
  if (value && !["true", "false"].includes(value)) {
    throw new Error(`${key} must be true or false`);
  }
}
if (
  process.env.NEXT_PUBLIC_TURNSTILE_ENABLED === "true" &&
  !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
) {
  throw new Error(
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required when NEXT_PUBLIC_TURNSTILE_ENABLED=true"
  );
}

const publicUrlVariables = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_CDN_URL",
  "NEXT_PUBLIC_BUNDLER_URL",
];
for (const variableName of publicUrlVariables) {
  const value = process.env[variableName];
  if (!value) continue;
  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${variableName} must be an absolute HTTP(S) URL`);
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(`${variableName} must be an absolute HTTP(S) URL`);
  }
}

const sourceRevision = process.env.NEXT_PUBLIC_SOURCE_REVISION?.trim();
if (
  process.env.NODE_ENV === "production" &&
  !/^[0-9a-f]{40}$/i.test(sourceRevision || "")
) {
  throw new Error(
    "NEXT_PUBLIC_SOURCE_REVISION must be the exact 40-character deployed commit for a production build"
  );
}
for (const variableName of [
  "NEXT_PUBLIC_SOURCE_URL",
  "NEXT_PUBLIC_SOURCE_REPOSITORY",
]) {
  const value = process.env[variableName]?.trim();
  if (!value) continue;
  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${variableName} must be an absolute HTTPS URL`);
  }
  if (parsedUrl.protocol !== "https:") {
    throw new Error(`${variableName} must be an absolute HTTPS URL`);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Bun links the local package to repository source, so Turbopack needs the
  // monorepo root (this also lets Fumadocs consume the canonical /docs files).
  turbopack: {
    root: path.join(__dirname, "../.."),
    resolveAlias: {
      "compify-pack": "./packages/compify-pack/dist/index.mjs",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [384, 768, 1024, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
