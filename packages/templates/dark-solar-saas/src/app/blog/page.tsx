import Image from 'next/image';
import { getAllPosts } from '@/lib/blog-service';

// Define metadata for SEO
export const metadata = {
    title: 'Blog | Solar Energy Solutions',
    description: 'Explore the latest news, insights, and developments in renewable energy, sustainability, and solar technology.',
}

// Enable ISR with 10 minute revalidation
export const revalidate = 600; // 10 minutes in seconds

export default async function BlogPage() {
    // Fetch blog posts
    const posts = await getAllPosts();

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Minimalistic header section */}
            <section className="pt-36 pb-12 px-4 border-b border-white/5">
                <div className="container">
                    <div className="">
                        <div className="mb-3 text-xs font-medium tracking-widest uppercase text-primary">Articles</div>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                            Latest from our journal
                        </h1>
                        <div className="w-24 h-1 bg-primary/70 mb-8"></div>
                        <p className="text-white/60 text-lg max-w-2xl">
                            Insights on solar energy, sustainability, and the future of renewable technologies.
                        </p>
                    </div>
                </div>
            </section>

            {/* Featured post */}
            {posts.length > 0 && (
                <section className="py-8 px-4">
                    <div className="container mx-auto">
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black hover:border-primary/30 transition-all duration-300 group">
                            <a href={`/blog/${posts[0].slug}`} className="block">
                                <div className="grid md:grid-cols-5 gap-6">
                                    {/* Image */}
                                    <div className="md:col-span-2 aspect-video md:aspect-auto relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gray-900/30 group-hover:bg-gray-900/10 transition-all duration-300 z-10"></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent md:bg-gradient-to-r md:from-black md:via-black/40 md:to-transparent opacity-70 group-hover:opacity-60 transition-all duration-300 z-20"></div>
                                        <div className="w-full h-full relative">
                                            <Image
                                                src={posts[0].imageSrc}
                                                alt={posts[0].title}
                                                className="object-cover group-hover:scale-105 transition-all duration-500"
                                                fill
                                                priority
                                            />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="md:col-span-3 p-6 md:p-10 flex flex-col justify-center">
                                        <div className="mb-4">
                                            <span className="text-xs text-primary uppercase tracking-wider font-medium">
                                                {posts[0].category}
                                            </span>
                                            <span className="mx-2 text-white/30">•</span>
                                            <span className="text-sm text-white/60">
                                                {new Date(posts[0].publishedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                            <span className="mx-2 text-white/30">•</span>
                                            <span className="text-sm text-white/60">{posts[0].readingTime}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-white/90 transition-colors">
                                            {posts[0].title}
                                        </h2>
                                        <p className="text-white/70 text-lg mb-6 line-clamp-2 md:line-clamp-3 group-hover:text-white/80 transition-colors">
                                            {posts[0].excerpt}
                                        </p>
                                        <div className="mt-auto">
                                            <span className="inline-flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
                                                Read article
                                                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {/* Blog grid */}
            <section className="py-16 px-4">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.slice(1).map((post) => (
                            <div key={post.id} className="group">
                                <a href={`/blog/${post.slug}`} className="flex flex-col h-full">
                                    <div className="rounded-xl overflow-hidden border border-white/5 bg-black h-full transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.15)] transform-gpu group-hover:-translate-y-1">
                                        {/* Post image */}
                                        <div className="relative aspect-[16/9] overflow-hidden">
                                            <div className="absolute inset-0 bg-gray-900/20 group-hover:bg-gray-900/0 transition-all duration-300 z-10"></div>
                                            <Image
                                                src={post.imageSrc}
                                                alt={post.title}
                                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                                width={600}
                                                height={338}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="mb-3">
                                                <span className="text-xs text-primary uppercase tracking-wider font-medium">
                                                    {post.category}
                                                </span>
                                                <span className="mx-2 text-white/30">•</span>
                                                <span className="text-xs text-white/60">{post.readingTime}</span>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-3 group-hover:text-white/90 transition-colors">
                                                {post.title}
                                            </h3>
                                            <p className="text-white/60 text-sm mb-4 flex-grow line-clamp-3 group-hover:text-white/70 transition-colors">
                                                {post.excerpt}
                                            </p>

                                            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                                <span className="text-xs text-white/60">
                                                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <span className="text-primary text-sm flex items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                                    Read more
                                                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
} 