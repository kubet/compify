import { fetchAllComponentsForSitemap } from "@/lib/api";
import { source } from "@/lib/docs-source";

export default async function sitemap() {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://compify.app').replace(/\/$/, '');
    // Base URLs that are always present
    const routes = [
        {
            url: siteUrl,
            changeFrequency: 'daily',
            priority: 1.0
        },
        ...source.getPages().map((page) => ({
            url: `${siteUrl}${page.url}`,
            changeFrequency: 'weekly',
            priority: page.slugs.length === 0 ? 0.8 : 0.65,
        })),
        { url: `${siteUrl}/blog`, changeFrequency: 'weekly', priority: 0.6 },
        { url: `${siteUrl}/blog/shadcn-compatible-registry`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${siteUrl}/blog/publish-and-install`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${siteUrl}/blog/agent-ready-components`, changeFrequency: 'monthly', priority: 0.5 },
    ];

    try {
        // Fetch recently created components
        const response = await fetchAllComponentsForSitemap({ token: process.env.INTERNAL_API_TOKEN });

        if (response.status === 200 && Array.isArray(response.data)) {
            // Add component URLs to sitemap with default priority and changeFreq
            const componentRoutes = response.data.map(component => ({
                url: `${siteUrl}/c/${component?.id}/${component?.slug}`,
                changeFrequency: 'weekly', // reasonable default for components
                priority: 0.7 // good default priority for content pages
            }));

            routes.push(...componentRoutes);
        }
    } catch (error) {
        console.error('Error fetching components for sitemap:', error);
    }

    return routes;
}