import Link from 'next/link';
import Wrapper from '@/components/Common/Wrapper';
import Footer from '@/components/Footer';

export const metadata = {
    title: 'Blog',
    description: 'Notes on building, publishing and distributing UI components.',
    alternates: { canonical: 'https://compify.app/blog' },
};

const posts = [
    {
        slug: 'shadcn-compatible-registry',
        title: 'Compify is now a shadcn-compatible registry',
        date: 'August 5, 2026',
        description:
            'Every public component is installable with npx shadcn add — no compify account or CLI required.',
    },
    {
        slug: 'publish-and-install',
        title: 'Publish a component, install it anywhere',
        date: 'August 5, 2026',
        description:
            'The full loop: build in the live editor, publish as @you/name, pull it into any project.',
    },
    {
        slug: 'agent-ready-components',
        title: 'Making a component library your coding agent can use',
        date: 'August 5, 2026',
        description:
            'Agents install UI through CLIs and MCP now. What that means for how components should be distributed.',
    },
];

export default function BlogIndex() {
    return (
        <Wrapper>
            <div className="mx-auto w-full max-w-2xl px-4 py-16">
                <h1 className="mb-2 text-3xl font-bold text-white">Blog</h1>
                <p className="mb-12 text-gray-400">
                    Notes on building, publishing and distributing UI components.
                </p>
                <div className="space-y-10">
                    {posts.map((post) => (
                        <article key={post.slug}>
                            <Link href={`/blog/${post.slug}`} className="group block">
                                <h2 className="text-xl font-semibold text-white group-hover:text-purple-200">
                                    {post.title}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">{post.date}</p>
                                <p className="mt-2 text-gray-400">{post.description}</p>
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
            <Footer />
        </Wrapper>
    );
}
