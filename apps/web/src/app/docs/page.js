import { BlogShell, P, H2, Code, A } from '../blog/BlogShell';

export const metadata = {
    title: 'Docs',
    description: 'How compify works: the live editor, publishing, visibility, the registry, CLI, agents and limits.',
    alternates: { canonical: 'https://compify.app/docs' },
};

const SECTIONS = [
    ['#how-it-works', 'How it works'],
    ['#editor', 'The editor'],
    ['#publishing', 'Publishing'],
    ['#visibility', 'Visibility'],
    ['#install', 'Installing'],
    ['#registry', 'shadcn registry'],
    ['#cli', 'CLI'],
    ['#mcp', 'Agents / MCP'],
    ['#templates', 'Templates'],
    ['#accounts', 'Accounts & limits'],
];

export default function Docs() {
    return (
        <BlogShell>
            <header className="mb-10">
                <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">Docs</h1>
                <p className="mt-3 text-gray-400">
                    Everything about compify: build components in the browser, publish them under
                    your handle, install them anywhere.
                </p>
                <nav className="mt-5 flex flex-wrap gap-2 text-sm">
                    {SECTIONS.map(([href, label]) => (
                        <a key={href} href={href} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-gray-300 hover:border-purple-400/40 hover:text-white">
                            {label}
                        </a>
                    ))}
                </nav>
            </header>

            <H2 id="how-it-works">How it works</H2>
            <P>Compify is a live component editor with a registry behind it. The whole product is one loop:</P>
            <Code>{`build          in the browser editor, with a live sandboxed preview
   ↓
publish        pick a visibility + a permanent address: @you/component-name
   ↓
install        from any project — shadcn CLI, compify CLI, or a coding agent`}</Code>
            <P>
                Every published component gets: a public preview page at{' '}
                <code>/view/@you/name</code> (code + running component, no login needed), a detail
                page with install commands, a shadcn-format registry item, an auto-generated
                preview image, and an OG image for link sharing.
            </P>

            <H2 id="editor">The editor</H2>
            <P>
                <A href="https://compify.app/create">compify.app/create</A> runs your component in
                a sandboxed bundler while you type. What works out of the box:
            </P>
            <P>
                <strong className="text-white">Languages & frameworks.</strong> React and React +
                TypeScript. Tailwind v3 (with config file) and v4, Material UI, shadcn/ui (the full
                component set is injected when you pick it), daisyUI, Bootstrap.
            </P>
            <P>
                <strong className="text-white">npm dependencies.</strong> Imports are detected from
                your code and installed in the preview automatically — framer-motion, Three.js,
                react-three-fiber, lucide and friends all work.
            </P>
            <P>
                <strong className="text-white">AI assist.</strong> Describe what you want
                (&quot;create an info card with a blur effect&quot;) and the assistant generates or
                edits component code in place.
            </P>
            <P>
                <strong className="text-white">Page settings & themes.</strong> Control the preview
                canvas (background, layout, fonts, zoom) and extract design tokens into reusable
                themes on the <A href="https://compify.app/theme">theme editor</A>.
            </P>
            <P>
                <strong className="text-white">Multi-file components.</strong> Add files with the +
                tab — helpers, css, config. One file is the main entry; everything ships together.
            </P>

            <H2 id="publishing">Publishing</H2>
            <P>Hit <strong className="text-white">Publish</strong> in the editor. You choose:</P>
            <P>
                <strong className="text-white">Name & description</strong> — shown on the component
                page and in search (the AI can draft these for you).{' '}
                <strong className="text-white">Visibility</strong> — see below.{' '}
                <strong className="text-white">Publishing domain</strong> — your component&apos;s
                permanent address, <code>@your-handle/component-name</code>, checked for
                availability as you type. Addresses are forever; pick deliberately.
            </P>
            <P>
                Preview and social images are generated automatically at publish time — no
                screenshots needed.
            </P>

            <H2 id="visibility">Visibility levels</H2>
            <Code>{`draft     work in progress, only you
private   finished, only you
public    listed in Browse and the gallery, installable by anyone
free      installable by anyone, not featured in the gallery`}</Code>
            <P>
                Public and free components are viewable without an account, appear in the registry
                index, and can be forked (&quot;Customize&quot;) by signed-in users into their own
                library.
            </P>

            <H2 id="install">Installing a component</H2>
            <P>
                Official components are addressed as <code>@compify/&lt;name&gt;</code>; community
                ones as <code>@compify/&lt;user&gt;/&lt;name&gt;</code>. Three ways in:
            </P>
            <Code>{`# shadcn CLI — no compify account needed
npx shadcn@latest add https://api.compify.app/r/morphing-switch.json

# compify CLI — tracks installs, supports diff & migrate
compify add @compify/morphing-switch

# your coding agent — via MCP, see below`}</Code>
            <P>
                Install brings the source files into your project (generic filenames are renamed to
                the component slug) plus its npm dependencies, unpinned so your project resolves
                versions compatible with your React.
            </P>

            <H2 id="registry">Using compify as a shadcn registry</H2>
            <P>Add the namespace once to your project&apos;s <code>components.json</code>:</P>
            <Code>{`{
  "registries": {
    "@compify": "https://api.compify.app/r/{name}.json"
  }
}`}</Code>
            <P>
                Then <code>npx shadcn@latest add @compify/&lt;name&gt;</code> works, and the
                official shadcn MCP server can search and install compify components for your
                agent. The public index lives at{' '}
                <A href="https://api.compify.app/r/registry.json">/r/registry.json</A>.
            </P>

            <H2 id="cli">The compify CLI</H2>
            <Code>{`npm install -g @compify/cli

compify login              # paste an API token from your profile
compify init               # create compify.json in a project
compify add @compify/prompt-composer
compify list               # your library
compify diff               # upstream changes for installed components
compify migrate            # pull updates (backs up replaced files)
compify remove <name>      # uninstall
compify info --json        # machine-readable project state`}</Code>
            <P>
                The CLI keeps a manifest (<code>compify.json</code>) of what&apos;s installed, so
                updates and diffs are tracked per project. Tokens are generated on your{' '}
                <A href="https://compify.app/profile">profile</A>.
            </P>

            <H2 id="mcp">Agents / MCP</H2>
            <P>
                The CLI ships an MCP server over stdio — three tools
                (<code>search_components</code>, <code>get_component</code>,{' '}
                <code>get_install_commands</code>), no auth needed for public components:
            </P>
            <Code>{`claude mcp add compify -- npx -y @compify/cli mcp`}</Code>
            <P>
                A typical agent run: search → fetch the registry item → write the files → add the
                dependencies. Four tool calls, no copy-paste. Agents that read the web can start
                from <A href="https://compify.app/llms.txt">compify.app/llms.txt</A>.
            </P>

            <H2 id="templates">Templates</H2>
            <P>
                Templates are full starter projects (not single components) that live in the
                monorepo under <code>packages/templates</code>. Each is a complete, buildable app
                you clone and run:
            </P>
            <Code>{`git clone https://github.com/kubet/compify
cd compify/packages/templates/dark-solar-saas
npm install
npm run dev`}</Code>
            <P>
                Browse them on the <A href="https://compify.app/templates">templates page</A>.
                Contributions welcome — open a PR adding a folder under{' '}
                <code>packages/templates</code>.
            </P>

            <H2 id="accounts">Accounts, handles & limits</H2>
            <P>
                Sign up with email or Google — you get a unique handle (change it on your profile)
                that namespaces everything you publish. <strong className="text-white">Free
                accounts</strong> keep up to 50 components (1&nbsp;MB each) with AI credits
                included; paid plans raise components, size and credits.
            </P>
            <P>
                Questions or something broken? <A href="mailto:hello@compify.app">hello@compify.app</A>.
            </P>
        </BlogShell>
    );
}
