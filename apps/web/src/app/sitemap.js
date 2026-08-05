import { fetchAllComponentsForSitemap } from "@/lib/api";

export default async function sitemap() {
    // Base URLs that are always present
    const routes = [
        {
            url: 'https://compify.app',
            changeFrequency: 'daily',
            priority: 1.0
        },
        { url: 'https://compify.app/blog', changeFrequency: 'weekly', priority: 0.6 },
        { url: 'https://compify.app/blog/shadcn-compatible-registry', changeFrequency: 'monthly', priority: 0.5 },
        { url: 'https://compify.app/blog/publish-and-install', changeFrequency: 'monthly', priority: 0.5 },
        { url: 'https://compify.app/blog/agent-ready-components', changeFrequency: 'monthly', priority: 0.5 },
    ];

    try {
        // Fetch recently created components
        const response = await fetchAllComponentsForSitemap({ token: process.env.INTERNAL_API_TOKEN });

        if (response.status === 200 && response.data) {
            // Add component URLs to sitemap with default priority and changeFreq
            const componentRoutes = response.data.map(component => ({
                url: `https://compify.app/c/${component?.id}/${component?.slug}`,
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