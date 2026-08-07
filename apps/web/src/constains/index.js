export const locales = ['en', 'sr', 'de'];

const urlMap = {
    'development': 'http://localhost:3009',
    'production': 'https://api.compify.app'
}
export const baseUrl = process.env.NEXT_PUBLIC_API_URL || urlMap[process.env.NODE_ENV] || urlMap['development'];