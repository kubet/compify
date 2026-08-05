import { baseUrl } from '@/constains';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/terms', '/create/*']
            }],
        sitemap: `https://compify.app/sitemap.xml`,
    }
}