import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllPostSlugs, getAllPosts } from '@/lib/blog-service';

// Enable ISR with 10 minute revalidation
export const revalidate = 600; // 10 minutes in seconds

// Define params interface for proper typing with Next.js 15 async params
interface BlogPostParams {
    params: Promise<{
        slug: string;
    }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
    const slugs = await getAllPostSlugs();

    return slugs.map((slug) => ({
        slug,
    }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostParams): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
            description: 'The requested blog post could not be found.',
        };
    }

    return {
        title: `${post.title} | Solar Energy Blog`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.publishedAt,
            images: [
                {
                    url: post.imageSrc,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: [post.imageSrc],
        },
    };
}

// Define the page component with proper typing
export default async function BlogPostPage({ params }: BlogPostParams) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    // Fetch all posts for related articles
    const allPosts = await getAllPosts();

    // Filter out the current post and get up to 3 related posts
    // First try to match by category, then take the most recent posts if needed
    let relatedPosts = allPosts
        .filter(p => p.id !== post.id)
        .filter(p => p.category === post.category)
        .slice(0, 3);

    // If we don't have 3 posts by category, add more recent posts
    if (relatedPosts.length < 3) {
        const otherPosts = allPosts
            .filter(p => p.id !== post.id && !relatedPosts.some(rp => rp.id === p.id))
            .slice(0, 3 - relatedPosts.length);

        relatedPosts = [...relatedPosts, ...otherPosts];
    }

    return (
        <article className="min-h-screen bg-black text-white">
            {/* Modern two-column layout for blog post */}
            <div className="container mx-auto px-4 py-12 mt-16 md:mt-0 md:py-16 lg:py-20">
                {/* Category pill - visible on both mobile and desktop */}
                <Link href="/blog" className="inline-flex items-center cursor-pointer text-primary hover:text-primary/80 transition-colors mb-6 my-6">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to all articles
                </Link>

                <div className="lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16">
                    {/* Left column: Content */}
                    <div className="lg:col-span-7 xl:col-span-7 mb-10 lg:mb-0">
                        {/* Category and meta */}
                        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-primary uppercase tracking-wide">
                                {post.category}
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-white/80">
                                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-white/80">{post.readingTime}</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                            {post.title}
                        </h1>

                        {/* Excerpt */}
                        <p className="text-lg lg:text-xl text-white/80 mb-10 leading-relaxed">
                            {post.excerpt}
                        </p>

                        {/* Mobile image - visible only on mobile */}
                        <div className="mb-10 lg:hidden">
                            <div className="rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                                <Image
                                    src={post.imageSrc}
                                    alt={post.title}
                                    width={800}
                                    height={500}
                                    priority
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </div>

                        {/* Article body with rich content */}
                        <div className="prose prose-lg prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: post.content }} />
                        </div>
                    </div>

                    {/* Right column: Sticky image and CTA - only visible on desktop */}
                    <div className="hidden lg:block lg:col-span-5 xl:col-span-5">
                        <div className="sticky top-8">
                            {/* Featured image with rounded corners and border */}
                            <div className="rounded-3xl overflow-hidden border border-white/20 shadow-xl mb-8">
                                <div className="aspect-[3/4] relative">
                                    <Image
                                        src={post.imageSrc}
                                        alt={post.title}
                                        fill
                                        priority
                                        className="object-cover"
                                    />
                                </div>
                            </div>

                            {/* Author bio - MOVED HERE */}
                            <div className="rounded-3xl overflow-hidden bg-white/5 border border-white/10 p-8">
                                <div className="flex items-start sm:items-center sm:flex-row flex-col gap-3">
                                    <div className="flex-shrink-0 mr-5">
                                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-primary">S</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Ready to make the switch to solar?</h3>
                                        <p className="text-white/70 leading-relaxed">Expert in renewable energy solutions with over 10 years of experience in the solar industry.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* More articles section */}
            <section className="py-24 bg-black/50">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-8">More articles you might like</h2>

                    {relatedPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {relatedPosts.map((relatedPost) => (
                                <Link
                                    key={relatedPost.id}
                                    href={`/blog/${relatedPost.slug}`}
                                    className="group"
                                >
                                    <div className="rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                        <div className="aspect-[3/2] relative">
                                            <Image
                                                src={relatedPost.imageSrc}
                                                alt={relatedPost.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>
                                        <div className="p-6">
                                            <div className="mb-2">
                                                <span className="text-xs text-primary uppercase tracking-wider">
                                                    {relatedPost.category}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                                                {relatedPost.title}
                                            </h3>
                                            <p className="text-white/60 text-sm mb-4 line-clamp-2">
                                                {relatedPost.excerpt}
                                            </p>
                                            <span className="text-primary text-sm flex items-center group-hover:translate-x-1 transition-transform duration-300">
                                                Read article
                                                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-white/70 py-8">
                            No related articles found.
                        </div>
                    )}
                </div>
            </section>
        </article>
    );
} 