This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Notion Blog Integration

This project includes a blog that can be powered by Notion. This allows you to manage your blog content directly in Notion without having to redeploy your site for content updates.

### Setup

1. Create a Notion integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create a database in Notion for your blog posts with the following properties:
   - `Title` (Title property) - Required
   - `Published` (Checkbox property) - Required
   - `Excerpt` (Text property) - Optional
   - `Slug` (Text property) - Optional (will be generated from title if not provided)
   - `Category` (Select property) - Optional
   - `Date` (Date property) - Optional
   - `Image` (Files & Media property) - Optional (for post cover image)
   - `Reading Time` (Text property) - Optional (will be estimated if not provided)

3. Share your database with your integration by clicking "Share" in the top right of your database and adding your integration

4. Create a `.env.local` file in the root of your project with the following variables:
   ```
   NOTION_SECRET=your_notion_integration_secret
   NEXT_PUBLIC_NOTION_BLOG_PAGE_ID=your_notion_database_id
   ```

5. The database ID can be found in the URL when viewing your database in Notion:
   ```
   https://www.notion.so/workspace/your-database-1b3809b3327e8055...
                                                  ^^^^^^^^^^^^^^^^
                                                  This is your database ID
   ```

6. Visit `/blog/notion` to see a test page that displays your Notion blog posts

### How It Works

- The integration uses the Notion API and notion-to-md library to fetch blog content
- Blog posts must have the "Published" checkbox enabled to appear on your site
- Content is fetched at build time and can be revalidated at runtime (ISR)
- If Notion API calls fail, the site will fall back to sample blog data

### Customization

The Notion integration is implemented in:
- `src/lib/notion-service.ts` - Handles fetching and converting content from Notion
- `src/lib/blog-service.ts` - Provides a consistent interface for blog content with fallbacks

### Troubleshooting

If you encounter the error "Cannot read properties of null (reading 'useContext')" or other React context issues:
1. Make sure your environment variables are correctly set
2. Check that your Notion database has the required properties
3. Ensure your Notion integration has access to the database

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
