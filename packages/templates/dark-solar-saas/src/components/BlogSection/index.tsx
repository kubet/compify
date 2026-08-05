"use client"
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/lib/blog-service';

export interface BlogSectionProps {
    blogPosts: BlogPost[];
}

export function BlogSection({ blogPosts: initialBlogPosts }: BlogSectionProps) {
    // Process the blog posts for scrolling
    let blogPosts: BlogPost[] = [];

    try {
        // We need at least 5 posts for a good scrolling effect
        // If less, we'll duplicate to ensure smooth scrolling
        let processedPosts = initialBlogPosts;
        if (initialBlogPosts.length < 5) {
            // Duplicate posts if we have less than 5
            processedPosts = [...initialBlogPosts, ...initialBlogPosts];
        }

        // We need a complete loop for seamless scrolling
        // This approach ensures there's no jump at the end by fully repeating the posts
        blogPosts = [...processedPosts, ...processedPosts];
    } catch (error) {
        console.error('Error processing blog posts:', error);
        // Fallback to sample data in case of error
        const fallbackPosts = getFallbackPosts();
        blogPosts = [...fallbackPosts, ...fallbackPosts];
    }

    // Define constants for card dimensions
    const cardWidth = 240; // Card width
    const cardMargin = 16; // Gap between cards
    const cardHeight = Math.round(cardWidth * (4 / 3)); // Exactly 3:4 ratio

    // Fallback sample blog data
    function getFallbackPosts(): BlogPost[] {
        return [
            {
                id: '1',
                slug: 'harnessing-solar-energy-for-business-growth',
                title: "Harnessing Solar Energy for Business Growth",
                excerpt: "Discover how businesses are turning to solar energy to cut costs and increase sustainability.",
                content: "",
                category: "Energy",
                imageSrc: "/blog-image-1.jpg",
                publishedAt: "2023-09-15",
                readingTime: "6 min read"
            },
            {
                id: '2',
                slug: 'future-of-renewable-energy-technology',
                title: "The Future of Renewable Energy Technology",
                excerpt: "Exploring upcoming innovations in renewable energy that will transform the industry.",
                content: "",
                category: "Technology",
                imageSrc: "/blog-image-2.jpg",
                publishedAt: "2023-10-25",
                readingTime: "8 min read"
            },
            {
                id: '3',
                slug: 'sustainability-practices-for-modern-businesses',
                title: "Sustainability Practices for Modern Businesses",
                excerpt: "Learn the best sustainability practices that are helping businesses thrive while reducing their carbon footprint.",
                content: "",
                category: "Sustainability",
                imageSrc: "/blog-image-3.jpg",
                publishedAt: "2023-11-12",
                readingTime: "7 min read"
            },
            {
                id: '4',
                slug: 'investment-trends-in-green-energy',
                title: "Investment Trends in Green Energy",
                excerpt: "How investors are capitalizing on the growing green energy market and what this means for the future.",
                content: "",
                category: "Finance",
                imageSrc: "/blog-image-4.jpg",
                publishedAt: "2023-12-05",
                readingTime: "9 min read"
            },
            {
                id: '5',
                slug: 'case-study-manufacturing-with-solar-power',
                title: "Case Study: Manufacturing with Solar Power",
                excerpt: "How a manufacturing company reduced costs by 45% by implementing solar energy solutions.",
                content: "",
                category: "Case Study",
                imageSrc: "/blog-image-5.jpg",
                publishedAt: "2023-12-15",
                readingTime: "5 min read"
            }
        ];
    }

    return (
        <section className="py-24 bg-black">
            {/* Header */}
            <div className="container mx-auto px-4 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                    Latest from our blog
                </h2>
                <p className="text-white/70 max-w-2xl mx-auto text-center">
                    Stay up to date with the latest trends and insights in renewable energy and sustainability.
                </p>
            </div>

            {/* Blog carousel with auto-scroll - using client-side component for animation */}
            <div className="relative py-10">
                {/* Left gradient - more subtle now */}
                <div className="absolute left-0 top-0 bottom-0 w-[18%] bg-gradient-to-r from-black via-black/60 to-transparent z-10 pointer-events-none"></div>

                {/* Right gradient - more subtle now */}
                <div className="absolute right-0 top-0 bottom-0 w-[18%] bg-gradient-to-l from-black via-black/60 to-transparent z-10 pointer-events-none"></div>

                {/* Carousel container with overflow handling */}
                <div className="overflow-hidden px-4 py-4">
                    <BlogCarousel blogPosts={blogPosts} cardWidth={cardWidth} cardHeight={cardHeight} cardMargin={cardMargin} />
                </div>
            </div>
        </section>
    );
};


interface BlogCarouselProps {
    blogPosts: BlogPost[];
    cardWidth: number;
    cardHeight: number;
    cardMargin: number;
}

function BlogCarousel({ blogPosts, cardWidth, cardHeight, cardMargin }: BlogCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState(0);

    // Seamless infinite scroll mechanism
    useEffect(() => {
        if (blogPosts.length === 0) return;

        const totalWidth = (blogPosts.length / 2) * (cardWidth + cardMargin);
        let rafId: number;
        let scrollPos = 0;

        const scroll = () => {
            scrollPos += 0.5; // Smooth scroll speed

            // When we reach the width of the original set, reset to beginning
            if (scrollPos >= totalWidth) {
                scrollPos = 0;

                // This is the key to seamless scrolling - immediately jump back without animation
                if (scrollRef.current) {
                    scrollRef.current.style.transition = 'none';
                    setScrollPosition(0);

                    // Force reflow to apply the immediate jump
                    void scrollRef.current.offsetHeight;

                    // Re-enable smooth transitions for subsequent scrolls
                    scrollRef.current.style.transition = 'transform 0.5s linear';
                }
            } else {
                setScrollPosition(scrollPos);
            }

            rafId = requestAnimationFrame(scroll);
        };

        // Start the animation
        rafId = requestAnimationFrame(scroll);

        // Cleanup
        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [blogPosts, cardWidth, cardMargin]);

    return (
        <div className="flex justify-center mx-auto">
            <div
                ref={scrollRef}
                className="flex w-full max-w-6xl"
                style={{
                    transform: `translateX(-${scrollPosition}px)`,
                    transition: 'transform 0.5s linear',
                    paddingLeft: '8%', // Reduced padding to account for the narrower gradients
                    paddingRight: '8%' // Reduced padding to account for the narrower gradients
                }}
            >
                {blogPosts.map((post, index) => (
                    <div
                        key={`${post.id}-${index}`}
                        className="cursor-pointer group"
                        style={{
                            width: `${cardWidth}px`,
                            marginRight: `${cardMargin}px`,
                            flexShrink: 0,
                            padding: '10px 0', // Added padding for hover effect
                        }}
                    >
                        <Link href={`/blog/${post.slug}`}>
                            <div
                                className="rounded-xl bg-black border border-white/5 overflow-hidden flex flex-col transition-all duration-300 
                                group-hover:border-primary/30 group-hover:shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)] transform-gpu group-hover:-translate-y-2"
                                style={{ height: `${cardHeight}px` }}
                            >
                                {/* Blog image */}
                                <div className="w-full relative overflow-hidden" style={{ height: `${Math.round(cardHeight * 0.6)}px` }}>
                                    <div
                                        className="h-full w-full bg-center bg-cover transition-transform duration-500 group-hover:scale-105"
                                        style={{
                                            backgroundImage: `url(${post.imageSrc})`,
                                            backgroundColor: '#111' // Fallback
                                        }}
                                    ></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-grow flex flex-col">
                                    {/* Category */}
                                    <div className="mb-2">
                                        <span className="text-xs text-primary uppercase tracking-wider group-hover:text-primary/90">{post.category}</span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-base font-medium mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-white/90">{post.title}</h3>

                                    {/* Excerpt */}
                                    <p className="text-white/70 text-xs line-clamp-3 transition-colors duration-300 group-hover:text-white/80">{post.excerpt}</p>

                                    {/* Read more indicator - only visible on hover */}
                                    <div className="mt-auto pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        <span className="text-xs text-primary flex items-center">
                                            Read more
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BlogSection; 