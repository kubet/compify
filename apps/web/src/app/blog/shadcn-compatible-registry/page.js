import { BlogShell, PostHeader, P, H2, Code, A } from '../BlogShell';

export const metadata = {
    title: 'Compify emits shadcn-consumable registry items',
    description: 'What protocol compatibility proves, what it does not, and how private namespace authentication works.',
    alternates: { canonical: 'https://compify.app/blog/shadcn-compatible-registry' },
};

export default function Post() {
    return <BlogShell>
        <PostHeader title="Compify emits shadcn-consumable registry items" date="August 8, 2026" />
        <P>Compify exports the open <A href="https://ui.shadcn.com/docs/registry">shadcn registry-item format</A> rather than a proprietary installation protocol. A pinned shadcn 4.16.2 client accepts the repository&apos;s golden item, writes both source files, and the clean Next.js fixture builds.</P>
        <Code>bunx shadcn@4.16.2 add ./button.registry.json</Code>
        <H2>Compatibility is scoped evidence</H2>
        <P>One passing fixture does not mean every component installs everywhere. Consumer aliases, file targets, monorepos, styles, assets, runtime providers and dependency ranges can change the result. Pin the client, use <code>view</code>/<code>add --dry-run</code>, inspect the diff and build the target application.</P>
        <H2>Public and private namespaces</H2>
        <Code>{`{
  "registries": {
    "@compify": {
      "url": "https://registry.example/r/{name}.json",
      "headers": { "Authorization": "Bearer \${COMPIFY_TOKEN}" }
    }
  }
}`}</Code>
        <P>Public and unlisted items can be fetched anonymously. Private items are absent from the public index and require the owner&apos;s CLI token through the standard Bearer header. The current token is account-wide, not a scoped enterprise credential.</P>
        <H2>Why native tooling stays downstream</H2>
        <P>The official shadcn CLI/MCP owns registry dependencies, targets, aliases and installation. Compify&apos;s differentiated job is the preceding source selection, static graph explanation, safety checks and provenance.</P>
    </BlogShell>;
}
