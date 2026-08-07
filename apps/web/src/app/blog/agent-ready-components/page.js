import { BlogShell, PostHeader, P, H2, Code, A } from '../BlogShell';

export const metadata = {
    title: 'Making a component library your coding agent can use',
    description:
        'Agents install UI through CLIs and MCP now. What that means for how components should be distributed.',
    alternates: { canonical: 'https://compify.app/blog/agent-ready-components' },
};

export default function Post() {
    return (
        <BlogShell>
            <PostHeader
                title="Making a component library your coding agent can use"
                date="August 5, 2026"
            />

            <P>
                Most code shipped this year was written with a coding agent in the loop. Agents
                don&apos;t browse component galleries — they call tools. If your component library
                isn&apos;t addressable by a tool call, it doesn&apos;t exist for them.
            </P>

            <H2>The three layers that matter</H2>
            <P>
                <strong className="text-white">A stable address.</strong> An agent needs a name it
                can pass to an installer. Every published compify component has one:{' '}
                <code>@you/component-name</code>.
            </P>
            <P>
                <strong className="text-white">A machine-readable format.</strong> We serve the
                shadcn registry-item format — source files plus npm dependencies in one JSON
                document. An agent (or the shadcn CLI it drives) can apply it without guessing.
            </P>
            <P>
                <strong className="text-white">A discovery channel.</strong> Two, actually:{' '}
                <A href="https://compify.app/llms.txt">llms.txt</A> for agents that read the web,
                and MCP for agents that call tools.
            </P>

            <H2>Two MCP paths</H2>
            <P>
                If the project already uses the official shadcn MCP server, one line of
                configuration makes compify visible to it:
            </P>
            <Code>{`// components.json
"registries": { "@compify": "https://api.compify.app/r/{name}.json" }`}</Code>
            <P>
                If not, the compify CLI ships its own MCP server — three tools
                (search, fetch, install commands), stdio transport, no auth needed for public
                components:
            </P>
            <Code>claude mcp add compify -- bunx @compify/cli mcp</Code>

            <H2>The test that counts</H2>
            <P>
                The measure of agent-readiness isn&apos;t a feature list — it&apos;s whether a cold
                agent can go from &quot;add a pricing card&quot; to working code in one pass. With
                the registry + MCP combination, the whole flow is: search, fetch, write files,
                install deps. Four tool calls, no human copy-paste in between.
            </P>
        </BlogShell>
    );
}
