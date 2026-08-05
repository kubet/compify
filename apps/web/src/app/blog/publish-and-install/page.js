import { BlogShell, PostHeader, P, H2, Code, A } from '../BlogShell';

export const metadata = {
    title: 'Publish a component, install it anywhere',
    description:
        'The full compify loop: build in the live editor, publish as @you/name, pull it into any project.',
    alternates: { canonical: 'https://compify.app/blog/publish-and-install' },
};

export default function Post() {
    return (
        <BlogShell>
            <PostHeader title="Publish a component, install it anywhere" date="August 5, 2026" />

            <P>
                Compify&apos;s core loop is three steps. Here is the whole thing, honestly, with
                nothing skipped.
            </P>

            <H2>1. Build it in the editor</H2>
            <P>
                <A href="https://compify.app/create">compify.app/create</A> gives you a code editor
                with a live sandboxed preview. Plain React works; so do Tailwind (v3 and v4),
                TypeScript, framer-motion, Three.js and shadcn/ui — dependencies are detected from
                your imports and installed in the preview automatically.
            </P>

            <H2>2. Publish it with a name</H2>
            <P>
                Hit Publish, make it public, and set a publishing domain. That becomes the
                component&apos;s permanent address: <code>@you/component-name</code>. It gets a
                public preview page at <code>compify.app/view/@you/component-name</code> — code on
                the left, running component on the right.
            </P>

            <H2>3. Install it in any project</H2>
            <P>Three ways, pick whatever fits the project:</P>
            <Code>{`# shadcn CLI — no compify account needed
npx shadcn@latest add https://api.compify.app/r/you/component-name.json

# compify CLI — tracks installs in compify.json, supports diff/migrate
compify add @you/component-name

# your coding agent — via MCP (see the agent-ready post)`}</Code>
            <P>
                The compify CLI keeps a manifest of what you installed, so{' '}
                <code>compify diff</code> shows upstream changes and <code>compify migrate</code>{' '}
                pulls updates with automatic backups.
            </P>

            <H2>That&apos;s it</H2>
            <P>
                One place to build and preview, one permanent name, and the component follows you
                into every project — whichever installer you or your tools prefer.
            </P>
        </BlogShell>
    );
}
