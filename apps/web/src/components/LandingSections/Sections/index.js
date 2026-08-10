'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';

const workflow = [
    {
        number: '01',
        title: 'Select an explicit React CSF boundary',
        description: 'Point the CLI at one supported story file and, when needed, one exact named story export. Storybook remains the source of truth for authoring, docs, and tests.',
    },
    {
        number: '02',
        title: 'Inspect the source graph statically',
        description: 'Compify parses supported source and reports files, imports, dependencies, provenance, and diagnostics without importing or executing the story module.',
    },
    {
        number: '03',
        title: 'Review, then hand off',
        description: 'Export deterministic shadcn registry JSON, inspect the derived files, and verify the result in a separate consumer before choosing whether to publish it.',
    },
];

const limits = [
    'React CSF and bounded static source graphs are the supported wedge—not general Storybook or framework conversion.',
    'Decorators, loaders, play functions, arbitrary render functions, preview providers, and runtime behavior are not reproduced.',
    'Cross-workspace source, broad alias patterns, binary assets, and cross-file story catalogs remain unsupported or unproven.',
    'A successful static export does not prove runtime, visual, behavioral, accessibility, or dependency-range fidelity.',
];

const linkClass = 'font-medium text-purple-300 underline decoration-purple-400/40 underline-offset-4 hover:text-purple-200';

const VideoPlayer = React.memo(() => {
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { rootMargin: '100px', threshold: 0 },
        );
        const container = containerRef.current;
        if (container) observer.observe(container);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className="group relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center" aria-label="Loading video">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent motion-reduce:animate-none" />
                </div>
            )}
            <p id="editor-recording-description" className="sr-only">
                Silent recording of the optional browser theme editor; it is not the Storybook handoff workflow.
            </p>
            {isVisible && (
                <video
                    ref={videoRef}
                    aria-describedby="editor-recording-description"
                    className="h-full w-full rounded-2xl object-cover"
                    src="/demo-video.mp4"
                    poster="/og-image.png"
                    autoPlay={!shouldReduceMotion}
                    loop={!shouldReduceMotion}
                    muted
                    controls
                    playsInline
                    preload="metadata"
                    onLoadStart={() => setIsLoading(true)}
                    onCanPlay={() => {
                        setIsLoading(false);
                        if (!shouldReduceMotion) videoRef.current?.play().catch(() => {});
                    }}
                >
                    Your browser does not support the video element. The optional legacy editor is documented above.
                </video>
            )}
        </div>
    );
});
VideoPlayer.displayName = 'VideoPlayer';

const Sections = () => (
    <div className="w-full bg-black text-white">
        <section className="relative py-24" id="workflow">
            <div className="mb-14 max-w-3xl">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Workflow</p>
                <h2 className="mb-5 text-4xl font-bold">A narrow boundary between Storybook and installation</h2>
                <p className="text-lg leading-8 text-gray-400">
                    Compify packages selected source; it does not replace the component work already happening in Storybook.
                    The commands below describe the unreleased source candidate, not npm 0.1.0.
                </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {workflow.map((step) => (
                    <article key={step.number} className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
                        <p className="mb-8 font-mono text-sm text-purple-300">{step.number}</p>
                        <h3 className="mb-3 text-xl font-semibold text-gray-100">{step.title}</h3>
                        <p className="leading-7 text-gray-400">{step.description}</p>
                    </article>
                ))}
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/60 p-5 text-sm leading-7 text-gray-300">
                <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-amber-200">Unreleased source commands</p>
                <p className="font-mono"><span className="select-none text-gray-600">$ </span>compify storybook inspect src/components/Button.stories.tsx --story Primary</p>
                <p className="font-mono"><span className="select-none text-gray-600">$ </span>compify storybook export src/components/Button.stories.tsx --story Primary --output .compify/button.registry.json</p>
                <p className="mt-3 font-sans text-gray-400">
                    For cross-app proof, use <code className="text-gray-200">compify storybook handoff --consumer &lt;directory&gt;</code>; it runs pinned native shadcn, can run an explicit build, and writes a digest-verifiable receipt.
                </p>
            </div>
        </section>

        <section className="relative py-24" id="installation">
            <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-3xl border border-purple-400/20 bg-purple-500/[0.06] p-7 sm:p-9">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Local review first</p>
                    <h2 className="mb-4 text-3xl font-bold">Verify the exported artifact with pinned tooling</h2>
                    <p className="mb-6 leading-7 text-gray-300">
                        The repository currently proves an exact shadcn 4.16.2 and Next.js 15.5.23 clean-consumer fixture. That is evidence for that fixture, not universal compatibility.
                    </p>
                    <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-gray-200"><code>bunx shadcn@4.16.2 add .compify/button.registry.json</code></pre>
                    <p className="mt-5 text-sm leading-6 text-gray-400">
                        A successful add is <em>installed</em> evidence only. Review the diff and build the target application—or use <code>storybook handoff</code> with a build command—for <em>built</em> evidence. See the{' '}
                        <Link className={linkClass} href="/docs/compatibility">exact compatibility matrix</Link>.
                    </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7 sm:p-9">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Configured registries</p>
                    <h2 className="mb-4 text-3xl font-bold">A namespace is target-project configuration</h2>
                    <p className="mb-6 leading-7 text-gray-400">
                        An <code className="text-gray-200">@compify/name</code> command only resolves after the target project maps that namespace in <code className="text-gray-200">components.json</code>. Use the origin of the Compify API you operate.
                    </p>
                    <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/70 p-4 text-sm leading-6 text-gray-200"><code>{`{
  "registries": {
    "@compify": "https://registry.example.com/r/{name}.json"
  }
}`}</code></pre>
                    <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/70 p-4 text-sm text-gray-200"><code>bunx shadcn@4.16.2 add @compify/button</code></pre>
                    <p className="mt-5 text-sm leading-6 text-gray-400">
                        Optional authenticated publication is a separate, operator-controlled step. Follow the <Link className={linkClass} href="/docs/registry">registry and private-header configuration guide</Link> before publishing or using a namespace.
                    </p>
                </div>
            </div>
        </section>

        <section className="relative py-24" id="limits">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Evidence boundary</p>
                    <h2 className="mb-5 text-4xl font-bold">Static packaging is not faithful conversion</h2>
                    <p className="leading-8 text-gray-400">
                        Detected unsupported or dynamic selected source is reported. Review the documented omissions and limits because uninspected Storybook context is not guaranteed to produce a diagnostic.
                    </p>
                </div>
                <ul className="space-y-4">
                    {limits.map((item) => (
                        <li key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-gray-300">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-purple-400" aria-hidden="true" />
                            <span className="leading-7">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-400">
                <Link className={linkClass} href="/docs/storybook">Storybook translation details</Link>
                <Link className={linkClass} href="/docs/compatibility">Supported and unsupported shapes</Link>
                <Link className={linkClass} href="/blog/publish-and-install">Review-and-install walkthrough</Link>
            </div>
        </section>

        <section className="relative py-24" id="demo">
            <div className="mx-auto mb-10 max-w-3xl text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Optional legacy surface</p>
                <h2 className="mb-4 text-3xl font-bold text-gray-100">Browser editor recording</h2>
                <p className="leading-7 text-gray-400">
                    The maintained editor is not the primary Storybook handoff. Interactive preview requires an operator-configured Sandpack-compatible bundler and is disabled by default on a fresh self-host.
                </p>
            </div>
            <VideoPlayer />
        </section>

        <section className="py-20 text-center">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-6 py-14">
                <h2 className="mb-4 text-3xl font-bold">Start with inspection, not migration</h2>
                <p className="mx-auto mb-7 max-w-2xl leading-7 text-gray-400">
                    Keep Storybook unchanged, select one qualified component boundary, and review the generated source artifact locally.
                </p>
                <Link
                    href="/docs/getting-started"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 font-medium text-white hover:bg-white/[0.1]"
                >
                    Read the source-candidate setup
                </Link>
            </div>
        </section>
    </div>
);

export default Sections;
