/** @type {import('next').NextConfig} */
const nextConfig = {
    // The web app consumes compify-pack from the repository. Bun links local
    // file dependencies to their source directory, so Turbopack must treat the
    // repository (not only apps/web) as its filesystem root.
    turbopack: {
        root: require('path').join(__dirname, '../..'),
        // Turbopack cannot parse Bun's per-file symlink used for a local
        // package.json. Resolve the package directly to its tracked build.
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
        // Strip console.* from production bundles, keep errors visible.
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
    },
}

module.exports = nextConfig
