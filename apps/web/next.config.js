/** @type {import('next').NextConfig} */
const nextConfig = {
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
