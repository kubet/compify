import { BlogShell, PostHeader, P, H2, Code, A } from '../BlogShell';

export const metadata = {
    title: 'Storybook context, approved source, native installation',
    description: 'Where Storybook AI, Compify and shadcn each fit in an agent-assisted component handoff.',
    alternates: { canonical: 'https://compify.app/blog/agent-ready-components' },
};

export default function Post() {
    return <BlogShell>
        <PostHeader title="Storybook context, approved source, native installation" date="August 8, 2026" />
        <P>Agent access to component documentation is not authorization to distribute source. A trustworthy workflow keeps three responsibilities separate.</P>
        <H2>1. Storybook owns understanding and tests</H2>
        <P>The official <A href="https://storybook.js.org/docs/ai/mcp">Storybook MCP/tools</A> expose docs, stories, previews and tests. Its React manifests and MCP APIs are still moving quickly. Compify does not proxy or reproduce them.</P>
        <H2>2. Compify owns explicit source review</H2>
        <P>A maintainer selects a local CSF boundary. The CLI statically analyzes the component graph without executing the story, reports unsupported behavior, and emits reviewable registry JSON with a digest and provenance.</P>
        <Code>compify storybook inspect src/Button.stories.tsx --story Primary</Code>
        <H2>3. shadcn owns installation</H2>
        <P>Configure the registry in <code>components.json</code>, then use the official shadcn CLI or MCP so target aliases, dependencies and authentication follow native semantics.</P>
        <Code>{`"registries": { "@compify": "https://registry.example/r/{name}.json" }`}</Code>
        <P>The existing <code>compify mcp</code> registry browser is deprecated compatibility surface. The useful future agent capability is approval and verification evidence—not another raw component search tool or an automatic publish button.</P>
    </BlogShell>;
}
