import { BlogShell, PostHeader, P, H2, Code, A } from '../BlogShell';

export const metadata = {
    title: 'Compify is now a shadcn-compatible registry',
    description:
        'Every public compify component is installable with bunx shadcn add — no compify account or CLI required.',
    alternates: { canonical: 'https://compify.app/blog/shadcn-compatible-registry' },
};

export default function Post() {
    return (
        <BlogShell>
            <PostHeader title="Compify is now a shadcn-compatible registry" date="August 5, 2026" />

            <P>
                Every public component on compify is now served in{' '}
                <A href="https://ui.shadcn.com/docs/registry">shadcn registry-item format</A>. That
                means you can install any of them with tooling you already have, without a compify
                account:
            </P>
            <Code>bunx shadcn@latest add https://api.compify.app/r/glass-3d-text.json</Code>
            <P>
                Or configure the namespace once in your project&apos;s <code>components.json</code>:
            </P>
            <Code>{`{
  "registries": {
    "@compify": "https://api.compify.app/r/{name}.json"
  }
}`}</Code>
            <P>and install by name from then on:</P>
            <Code>bunx shadcn@latest add @compify/morphing-switch</Code>

            <H2>What you get</H2>
            <P>
                The registry item carries the component source and its npm dependencies. When we
                tested this against a fresh project, the shadcn CLI wrote the component file,
                added <code>motion</code> to package.json, and — because the target project used
                JavaScript — transpiled the TypeScript source on the way in. No copy-paste, no
                missing imports.
            </P>

            <H2>Why we adopted the standard instead of inventing one</H2>
            <P>
                The registry protocol is how components move between tools in 2026: the shadcn CLI
                consumes it, the official shadcn MCP server exposes it to coding agents, and v0
                understands it. Serving it means every compify component is immediately usable in
                all of those places. A proprietary format would have meant none of them.
            </P>

            <H2>The full index</H2>
            <P>
                <A href="https://api.compify.app/r/registry.json">
                    api.compify.app/r/registry.json
                </A>{' '}
                lists everything public. Components you publish under your own handle are
                addressable as <code>@compify/&lt;your-handle&gt;/&lt;name&gt;</code>.
            </P>
        </BlogShell>
    );
}
