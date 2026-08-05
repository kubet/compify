export const locales = ['en', 'sr', 'de'];

const urlMap = {
    'development': 'http://localhost:3009',
    'production': 'https://api.compify.app'
}
export const baseUrl = urlMap[process.env.NODE_ENV] || urlMap['development'];