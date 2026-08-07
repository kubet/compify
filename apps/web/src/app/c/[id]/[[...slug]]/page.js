import { notFound, redirect } from 'next/navigation';
import { baseUrl, siteUrl } from '@/constains';
import { getPublicComponentInfo } from '@/lib/api';
import ComponentDisplay from '../ComponentDisplay';

export async function generateMetadata(props) {
    const params = await props.params;
    const resp = await getPublicComponentInfo(params.id);

    if (resp?.status === 404) {
        notFound();
    }

    if (!resp?.data) {
        throw new Error('Failed to fetch component data');
    }

    const ogImageUrl = `${baseUrl}/c/og-image/${params.id}`;
    const title = resp.data.name || 'Compify';
    const description = resp.data.description || 'Create and share beautiful components';
    const canonicalUrl = `${siteUrl}/c/${params.id}`;

    // Simplified JSON-LD schema with only essential, verifiable information
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': `${canonicalUrl}#webpage`,
                'url': canonicalUrl,
                'name': title,
                'description': description,
                'isPartOf': {
                    '@type': 'WebSite',
                    '@id': `${siteUrl}#website`,
                    'url': siteUrl,
                    'name': 'Compify'
                }
            },
            {
                '@type': 'SoftwareSourceCode',
                '@id': `${canonicalUrl}#sourcecode`,
                'name': title,
                'description': description,
                'url': canonicalUrl,
                'programmingLanguage': resp.data.language || 'JavaScript',
                'codeSampleType': 'component'
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${canonicalUrl}#breadcrumb`,
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': 1,
                        'item': {
                            '@id': siteUrl,
                            'url': siteUrl,
                            'name': 'Home'
                        }
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'item': {
                            '@id': `${siteUrl}/c`,
                            'url': `${siteUrl}/c`,
                            'name': 'Components'
                        }
                    },
                    {
                        '@type': 'ListItem',
                        'position': 3,
                        'item': {
                            '@id': canonicalUrl,
                            'url': canonicalUrl,
                            'name': title
                        }
                    }
                ]
            }
        ]
    };

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [ogImageUrl],
            type: 'website',
            url: canonicalUrl,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
        },
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: true,
            follow: true,
        },
        other: {
            'script:ld+json': JSON.stringify(jsonLd),
        },
    };
}

const slugify = (text) => {
    if (!text) return '';

    let slug = String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, '-and-')
        .replace(/[_\s/+–—―]+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);

    return slug;
}

export default async function Page(props) {
    const params = await props.params;
    const resp = await getPublicComponentInfo(params.id);

    // Check specifically for 404 status
    if (resp?.status === 404) {
        notFound();
    }

    // Handle other error cases or missing data
    if (!resp?.data) {
        throw new Error('Failed to fetch component data');
    }

    // If there's a slug in the URL, verify it matches the expected slug
    if (params.slug?.length > 0) {
        const expectedSlug = slugify(resp.data.name);
        const actualSlug = params.slug[0];

        // If slug doesn't match, redirect to the canonical URL
        if (actualSlug !== expectedSlug) {
            redirect(`/c/${params.id}/${expectedSlug}`);
        }
    }

    return <ComponentDisplay data={{ ...resp?.data, id: params?.id }} />;
}

export async function generateImageMetadata(props) {
    const params = await props.params;
    const resp = await getPublicComponentInfo(params.id);

    // Check specifically for 404 status
    if (resp?.status === 404) {
        notFound();
    }

    // Handle other error cases or missing data
    if (!resp?.data) {
        throw new Error('Failed to fetch component data');
    }

    return [
        {
            contentType: 'image/webp',
            size: { width: 1200, height: 630 },
            id: 'og-image',
            alt: `Open Graph Image for ${params.id}`,
            url: `${baseUrl}/c/image/${params.id}`,
        },
    ];
} 