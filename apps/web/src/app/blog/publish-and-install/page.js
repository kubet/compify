import { BlogShell, PostHeader, P, H2, Code, A } from '../BlogShell';

export const metadata = {
    title: 'Review a Storybook component, then install the artifact',
    description: 'The bounded Compify workflow from static inspection to a pinned clean-consumer build.',
    alternates: { canonical: 'https://compify.app/blog/publish-and-install' },
};

export default function Post() {
    return <BlogShell>
        <PostHeader title="Review a Storybook component, then install the artifact" date="August 8, 2026" />
        <P>Compify keeps Storybook upstream and makes distribution an explicit, reviewable step. Local inspection and export require no account or server.</P>
        <H2>1. Select and inspect</H2>
        <Code>{`compify storybook inspect src/components/Button.stories.tsx --story Primary
compify storybook export src/components/Button.stories.tsx --story Primary \
  --output .compify/button.registry.json`}</Code>
        <P>The story module is parsed, never imported. Review every included file, dependency, diagnostic and provenance field. Static acceptance is not visual or behavioral equivalence.</P>
        <H2>2. Verify in a different application</H2>
        <P>Use a pinned shadcn version to view and install the JSON, then typecheck and production-build the untouched consumer. The repository currently proves one exact shadcn 4.16.2 and Next.js 15.5.23 fixture; see the <A href="/docs/compatibility">compatibility matrix</A>.</P>
        <H2>3. Publish only if distribution is needed</H2>
        <P>A self-hosted API can serve public, unlisted or owner-authenticated private items. Public source is irreversible disclosure; private publication still transfers confidential source to infrastructure you operate.</P>
        <Code>{`COMPIFY_API_URL=https://registry.example compify storybook publish \
  src/components/Button.stories.tsx --story Primary --visibility private`}</Code>
        <P>Compify does not yet promise general aliases, workspaces, binary assets, runtime fidelity or package-style updates. Those claims require dedicated fixtures and revision/receipt semantics.</P>
    </BlogShell>;
}
