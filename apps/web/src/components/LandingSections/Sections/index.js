"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bot, Boxes, FileCheck2, LockKeyhole, SearchCode, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import PublicCard from "@/components/Product/PublicCard";
import { Button } from "@/components/Elements";


export function PricingCard({ name, price, features = [], bestFor, colors = [], period = "month", current, buttonText = "Choose Plan", onClick }) {
  const accent = colors[0] || "rgb(168, 85, 247)";
  return (
    <article className="relative w-full min-w-[280px] overflow-hidden rounded-3xl border border-white/10 bg-black p-8 shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      {bestFor && <span className="absolute right-6 top-6 rounded-full bg-purple-500 px-3 py-1 text-xs font-bold text-white">{bestFor}</span>}
      <h3 className="text-2xl font-bold text-white">{name}</h3>
      <div className="my-6"><span className="text-4xl font-bold text-white">{Number(price) > 0 ? `$${Number(price).toLocaleString()}` : "Free"}</span>{Number(price) > 0 && <span className="text-gray-400">/{period}</span>}</div>
      <ul className="mb-8 space-y-3">{features.map((feature) => <li key={feature} className="flex gap-2 text-gray-300"><span className="text-green-400" aria-hidden="true">✓</span>{feature}</li>)}</ul>
      <Button text={current ? "Current Plan" : buttonText} variant="full" onClick={onClick} disabled={current} showIcon={!current} />
    </article>
  );
}

const steps = [
  {
    number: "01",
    title: "Inspect locally",
    description: "Select a React CSF file. Compify parses static metadata, follows local text imports, detects undeclared dependencies, and reports unsupported behavior without importing the module.",
    icon: SearchCode,
  },
  {
    number: "02",
    title: "Review the artifact",
    description: "Export deterministic registry-item JSON. Maintainers can inspect every included file, dependency, story, provenance field, diagnostic, and digest before approving distribution.",
    icon: FileCheck2,
  },
  {
    number: "03",
    title: "Install familiar source",
    description: "Publish to a self-hosted Compify registry or serve the item through a shadcn-compatible registry. Consumers receive source they can diff, customize, test, and own.",
    icon: Boxes,
  },
];

const users = [
  [ShieldCheck, "Design-system maintainer", "Define and approve the supported component surface instead of maintaining a second hand-copy workflow."],
  [Boxes, "Application engineer", "Install reviewed house components through familiar shadcn registry tooling and see the source entering the app."],
  [LockKeyhole, "Platform or security engineer", "Run deterministic checks in CI and evaluate an explicit source, credential, and provenance boundary."],
  [Bot, "Coding-agent user", "Use Storybook MCP for upstream context and registry tooling for installation without confusing context with authorization."],
];

export default function Sections({ topComponents = [] }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const visibleComponents = (topComponents || []).slice(0, 6);

  return (
    <div className="w-full bg-black text-white">
      <section id="workflow" className="py-20">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">The narrow workflow</p>
          <h2 className="text-3xl font-bold sm:text-5xl">Keep Storybook upstream. Add a reviewable distribution path.</h2>
          <p className="mt-5 text-lg leading-8 text-gray-400">Compify is not another component authoring system, visual test service, or package manager. It translates an intentionally selected source boundary into the open shadcn registry format.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {steps.map(({ number, title, description, icon: Icon }, index) => (
            <motion.article key={title} initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
              <div className="flex items-center justify-between"><Icon className="h-7 w-7 text-purple-300" aria-hidden="true" /><span className="font-mono text-sm text-gray-600">{number}</span></div>
              <h3 className="mt-8 text-2xl font-semibold">{title}</h3>
              <p className="mt-4 leading-7 text-gray-400">{description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="users" className="border-y border-white/10 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Built around real handoffs</p>
            <h2 className="text-3xl font-bold sm:text-4xl">One artifact, four clear roles.</h2>
            <p className="mt-5 leading-7 text-gray-400">The maintainer authorizes distribution. The consumer owns copied source. Platform teams enforce policy. Agent tools remain consumers of approved context and artifacts.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {users.map(([Icon, title, description]) => <article key={title} className="rounded-2xl border border-white/10 p-5"><Icon className="h-5 w-5 text-purple-300" aria-hidden="true" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-400">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="limits" className="py-20">
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.04] p-7 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Trust starts with limits</p>
          <h2 className="mt-3 text-3xl font-bold">React CSF and static source first.</h2>
          <p className="mt-5 max-w-4xl leading-7 text-gray-300">Dynamic configuration, arbitrary render functions, decorators, loaders, play functions, runtime globals, binary assets, and framework-specific behavior are not promised as faithful conversions. Inspection is not a visual or behavioral equivalence test. Pin your Storybook and shadcn versions, review the artifact, and test it in a separate consumer application.</p>
          <button onClick={() => router.push("/docs/storybook")} className="mt-6 inline-flex items-center gap-2 text-purple-300 hover:text-purple-200">Read supported syntax and diagnostics <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </section>

      {visibleComponents.length > 0 && <section id="components" className="py-20">
        <div className="mb-10"><p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Registry output</p><h2 className="text-3xl font-bold sm:text-4xl">Explore published components</h2><p className="mt-4 text-gray-400">A live instance may expose public registry items. Availability is instance-specific and is not a promise of a managed Compify service.</p></div>
        <div className="columns-1 gap-6 md:columns-2 lg:columns-3">{visibleComponents.map((component) => <div key={component.id} className="mb-6 break-inside-avoid"><PublicCard id={component.id} name={component.name} imageUploaded={component.imageUploaded} language={component.language} upvotes={component.upvotes} upvoteDefaultStatus={false} onCopy={() => {}} viewOnly publicImage /></div>)}</div>
      </section>}

      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold sm:text-5xl">Prove the handoff locally first.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">Clone the source, inspect one real Storybook component, and review the generated JSON. No account or publishing step is required.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={() => router.push("/docs/getting-started")} className="rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500">Get started</button>
          <a href="https://github.com/kubet/compify" target="_blank" rel="noreferrer" className="rounded-xl border border-white/15 px-6 py-3 font-semibold hover:bg-white/5">View source on GitHub</a>
        </div>
      </section>
    </div>
  );
}
