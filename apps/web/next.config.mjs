import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bun links the local package to repository source, so Turbopack needs the
  // monorepo root (this also lets Fumadocs consume the canonical /docs files).
  turbopack: {
    root: path.join(__dirname, '../..'),
    resolveAlias: {
      'compify-pack': './packages/compify-pack/dist/index.mjs',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [384, 768, 1024, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
};

export default withMDX(nextConfig);
