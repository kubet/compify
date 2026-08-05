// Blog post type
export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    imageSrc: string;
    publishedAt: string;
    readingTime: string;
}

// Import Notion service functions
import { getAllNotionPosts, getNotionPostBySlug, getAllNotionPostSlugs } from './notion-service';

/**
 * Get all blog posts with basic information
 */
const blogPosts: BlogPost[] = [];
export async function getAllPosts(): Promise<BlogPost[]> {
    try {
        // Try to get posts from Notion
        const notionPosts = await getAllNotionPosts();
        
        // If we successfully got posts from Notion, return them
        if (notionPosts && notionPosts.length > 0) {
            return notionPosts;
        }
        
        return blogPosts;
    } catch (error) {
        console.error('Error fetching posts from Notion, using fallback data:', error);
        return blogPosts;
    }
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        // Try to get the post from Notion
        const notionPost = await getNotionPostBySlug(slug);
        // If we successfully got the post from Notion, return it
        if (notionPost) {
            return notionPost;
        }
        return  null;
    } catch (error) {
        console.error('Error fetching post from Notion:', error);
        return null;
    }
}

/**
 * Get all blog post slugs for generating static paths
 */
export async function getAllPostSlugs(): Promise<string[]> {
    try {
        // Try to get slugs from Notion
        const notionSlugs = await getAllNotionPostSlugs();
        
        // If we successfully got slugs from Notion, return them
        if (notionSlugs && notionSlugs.length > 0) {
            return notionSlugs;
        }
        
        return blogPosts.map(post => post.slug);
    } catch (error) {
        console.error('Error fetching slugs from Notion, using fallback data:', error);
        return blogPosts.map(post => post.slug);
    }
} 