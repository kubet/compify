/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [384, 768, 1024, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },
    // experimental: {
    //     optimizeServerReact: true,
    //     scrollRestoration: true,
    // },
    // compiler: {
    //     removeConsole: process.env.NODE_ENV === 'production',
    // },
    webpack: (config, { dev, isServer }) => {
        // Optimize CSS
        if (!dev && !isServer) {
            config.optimization.splitChunks.cacheGroups.styles = {
                name: 'styles',
                test: /\.css$/,
                chunks: 'all',
                enforce: true,
                priority: 10,
            };
        }
        return config;
    }
}

module.exports = nextConfig 