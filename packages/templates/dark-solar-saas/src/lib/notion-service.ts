import { Client } from "@notionhq/client";
import { NotionConverter } from "notion-to-md";
import { BlogPost } from "./blog-service";
import {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_SECRET,
});

// Define types for Notion properties
type NotionProperties = {
  Title?: { title: Array<{ plain_text: string }> };
  Name?: { title: Array<{ plain_text: string }> };
  Slug?:
    | { formula: { string: string } }
    | { rich_text: Array<{ plain_text: string }> };
  Excerpt?: { rich_text: Array<{ plain_text: string }> };
  Category?: { select: { name: string } };
  Published?: { checkbox: boolean; date?: { start: string } };
  Date?: { date: { start: string } };
  Image?: {
    files: Array<{
      type: string;
      file?: { url: string };
      external?: { url: string };
    }>;
  };
};

type NotionPage = PageObjectResponse & {
  properties: NotionProperties;
  cover?: {
    type: string;
    external?: { url: string };
    file?: { url: string };
  };
};

/** Escape all Notion-controlled text before inserting it into generated HTML. */
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] as string,
  );
}

/** Only allow remote image schemes understood by Next/browser image loading. */
export function safeImageUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? escapeHtml(url.toString())
      : "";
  } catch {
    return "";
  }
}

/**
 * Convert blocks to HTML content. Every interpolated value must be escaped here;
 * callers render this string with dangerouslySetInnerHTML.
 */
function blocksToHtml(blocks: BlockObjectResponse[]): string {
  let content = "";

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
        const paragraphText = escapeHtml(
          block.paragraph.rich_text.map((t) => t.plain_text).join(""),
        );
        content += paragraphText ? `<p>${paragraphText}</p>\n\n` : "";
        break;

      case "heading_1":
        const h1Text = escapeHtml(
          block.heading_1.rich_text.map((t) => t.plain_text).join(""),
        );
        content += `<h1>${h1Text}</h1>\n\n`;
        break;

      case "heading_2":
        const h2Text = escapeHtml(
          block.heading_2.rich_text.map((t) => t.plain_text).join(""),
        );
        content += `<h2>${h2Text}</h2>\n\n`;
        break;

      case "heading_3":
        const h3Text = escapeHtml(
          block.heading_3.rich_text.map((t) => t.plain_text).join(""),
        );
        content += `<h3>${h3Text}</h3>\n\n`;
        break;

      case "bulleted_list_item":
        const bulletText = escapeHtml(
          block.bulleted_list_item.rich_text.map((t) => t.plain_text).join(""),
        );
        content += `<li>${bulletText}</li>\n`;
        break;

      case "numbered_list_item":
        const numberedText = escapeHtml(
          block.numbered_list_item.rich_text.map((t) => t.plain_text).join(""),
        );
        content += `<li>${numberedText}</li>\n`;
        break;

      case "image":
        let imageUrl = "";
        if (block.image.type === "external") {
          imageUrl = block.image.external.url;
        } else if (block.image.type === "file") {
          imageUrl = block.image.file.url;
        }

        imageUrl = safeImageUrl(imageUrl);
        const caption = escapeHtml(
          block.image.caption?.map((item) => item.plain_text).join("") || "",
        );

        content += `<figure>
  <img src="${imageUrl}" alt="${caption}" />
  ${caption ? `<figcaption>${caption}</figcaption>` : ""}
</figure>\n\n`;
        break;
    }
  }

  return content;
}

/**
 * Convert a Notion page to a BlogPost object
 */
async function notionPageToBlogPost(page: NotionPage): Promise<BlogPost> {
  try {
    // Create a NotionConverter instance
    const n2m = new NotionConverter(notion);

    // For reference, convert the page to markdown (not used directly)
    await n2m.convert(page.id);

    // Get blocks directly from the Notion API
    const blocksResponse = await notion.blocks.children.list({
      block_id: page.id,
      page_size: 100,
    });

    // Convert blocks to HTML
    const content = blocksToHtml(
      blocksResponse.results as BlockObjectResponse[],
    );

    // Extract properties from the page
    const properties = page.properties;

    // Get page title
    const titleProperty = properties.Title || properties.Name;
    const title = titleProperty?.title?.[0]?.plain_text || "Untitled";

    // Get slug - different property types handling
    let slug = "";
    if (properties.Slug) {
      if ("formula" in properties.Slug) {
        slug = properties.Slug.formula.string;
      } else if ("rich_text" in properties.Slug) {
        slug = properties.Slug.rich_text[0]?.plain_text || "";
      }
    }

    // Get excerpt
    const excerpt = properties.Excerpt?.rich_text?.[0]?.plain_text || "";

    // Get category
    const category = properties.Category?.select?.name || "Uncategorized";

    // Get published date
    const publishedAt =
      properties.Published?.date?.start ||
      properties.Date?.date?.start ||
      new Date().toISOString().split("T")[0];

    // Calculate reading time based on content length
    const readingTime = `${Math.max(1, Math.ceil(content.length / 3000))} min read`;

    // Get cover image if available
    let imageSrc = "/cta-image.png"; // Default image

    if (page.cover) {
      if (page.cover.type === "external") {
        imageSrc = page.cover.external?.url || imageSrc;
      } else if (page.cover.type === "file") {
        imageSrc = page.cover.file?.url || imageSrc;
      }
    } else if (properties.Image?.files?.[0]) {
      const imageFile = properties.Image.files[0];
      imageSrc =
        imageFile.type === "external"
          ? imageFile.external?.url || imageSrc
          : imageFile.file?.url || imageSrc;
    }

    return {
      id: page.id,
      slug,
      title,
      excerpt,
      content,
      category,
      imageSrc,
      publishedAt,
      readingTime,
    };
  } catch (error) {
    console.error(`Error converting Notion page to blog post:`, error);
    throw error;
  }
}

/**
 * Get all published blog posts from Notion
 */
export async function getAllNotionPosts(): Promise<BlogPost[]> {
  const databaseId = process.env.NEXT_PUBLIC_NOTION_BLOG_PAGE_ID;

  if (!databaseId) {
    throw new Error("NOTION_BLOG_PAGE_ID environment variable is not set");
  }

  try {
    // Query the database for published posts
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Published",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
    });

    // Convert Notion pages to blog posts
    const posts = await Promise.all(
      response.results.map((page) => notionPageToBlogPost(page as NotionPage)),
    );
    return posts;
  } catch (error) {
    console.error("Failed to fetch posts from Notion:", error);
    return [];
  }
}

/**
 * Get a specific blog post by slug
 */
export async function getNotionPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const databaseId = process.env.NEXT_PUBLIC_NOTION_BLOG_PAGE_ID;

  if (!databaseId) {
    throw new Error("NOTION_BLOG_PAGE_ID environment variable is not set");
  }

  try {
    // Query the database for the specific post with the given slug
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: "Slug",
            formula: {
              string: {
                equals: slug,
              },
            },
          },
          {
            property: "Published",
            checkbox: {
              equals: true,
            },
          },
        ],
      },
    });

    // If no post found, return null
    if (response.results.length === 0) {
      return null;
    }

    // Convert Notion page to blog post
    const post = await notionPageToBlogPost(response.results[0] as NotionPage);
    return post;
  } catch (error) {
    console.error(
      `Failed to fetch post with slug "${slug}" from Notion:`,
      error,
    );
    return null;
  }
}

/**
 * Get all blog post slugs for generating static paths
 */
export async function getAllNotionPostSlugs(): Promise<string[]> {
  // Get all posts
  const posts = await getAllNotionPosts();
  // Extract slugs
  return posts.map((post) => post.slug);
}
