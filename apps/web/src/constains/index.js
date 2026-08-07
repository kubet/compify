export const locales = ['en', 'sr', 'de'];

const urlMap = {
    'development': 'http://localhost:3009',
    'production': 'https://api.compify.app'
}
export const baseUrl = process.env.NEXT_PUBLIC_API_URL || urlMap[process.env.NODE_ENV] || urlMap['development'];
export const cdnUrl = (process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.compify.app').replace(/\/$/, '');
