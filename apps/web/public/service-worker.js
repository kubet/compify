const CACHE_CONFIG = {
    'shadcn': {
        url: 'https://cdn.compify.app/sui-content',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    'fonts': {
        url: 'https://cdn.compify.app/font-list.json',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
};

const CACHE_NAME = 'compify-cache-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Precache both resources
            for (const [key, config] of Object.entries(CACHE_CONFIG)) {
                try {
                    const response = await fetch(config.url);
                    const data = await response.json();
                    await cache.put(config.url, new Response(JSON.stringify({
                        data,
                        timestamp: Date.now(),
                        type: key
                    })));
                } catch (error) {
                    console.error(`Failed to cache ${key}:`, error);
                }
            }
        })
    );
});

self.addEventListener('fetch', (event) => {
    const config = Object.values(CACHE_CONFIG).find(config => config.url === event.request.url);

    if (config) {
        event.respondWith(
            caches.match(event.request).then(async (response) => {
                // Check cache first
                if (response) {
                    const { data, timestamp } = await response.json();
                    const age = Date.now() - timestamp;

                    // Return cached data if not expired
                    if (age < config.maxAge) {
                        return new Response(JSON.stringify(data));
                    }
                }

                // Fetch fresh data
                try {
                    const networkResponse = await fetch(event.request);
                    const cache = await caches.open(CACHE_NAME);
                    const clonedResponse = networkResponse.clone();
                    const data = await clonedResponse.json();

                    // Update cache
                    await cache.put(event.request, new Response(JSON.stringify({
                        data,
                        timestamp: Date.now()
                    })));

                    return networkResponse;
                } catch (error) {
                    // Return expired cache as fallback
                    if (response) {
                        const { data } = await response.json();
                        return new Response(JSON.stringify(data));
                    }
                    throw error;
                }
            })
        );
    }
});

// Listen for cache cleanup message
self.addEventListener('message', (event) => {
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME)
        );
    }
});