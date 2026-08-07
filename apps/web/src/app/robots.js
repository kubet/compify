import { siteUrl } from '@/constains';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/terms', '/create/*']
            }],
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
