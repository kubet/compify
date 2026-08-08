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
        title: 'Compify emits shadcn-consumable registry items',
        date: 'August 8, 2026',
        description:
            'What protocol compatibility proves, what it does not, and how private authentication works.',
    },
    {
        slug: 'publish-and-install',
        title: 'Review a Storybook component, then install the artifact',
        date: 'August 8, 2026',
        description:
            'The bounded workflow from static inspection to a pinned clean-consumer build.',
    },
    {
        slug: 'agent-ready-components',
        title: 'Storybook context, approved source, native installation',
        date: 'August 8, 2026',
        description:
            'Where Storybook AI, Compify and shadcn each fit in an agent-assisted component handoff.',
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
