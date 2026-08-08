"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle2, FileSearch, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../../Elements";

const proof = [
  "Static analysis — story modules are never executed",
  "Deterministic, reviewable registry-item JSON",
  "React CSF source stays upstream in Storybook",
];

export default function Hero() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] w-full items-center overflow-hidden py-16 sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(126,34,206,0.28),transparent_38%),radial-gradient(circle_at_80%_65%,rgba(37,99,235,0.18),transparent_35%)]" />
      <div className="relative z-10 grid w-full gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/10 px-3 py-1 text-sm text-purple-200">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Storybook in. shadcn registry out.
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-6xl">
            Ship selected component source as a reviewable registry artifact.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            Compify statically inspects React CSF, follows the component&apos;s local source graph, and exports a deterministic shadcn-compatible registry artifact—without replacing Storybook or executing story code.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button text="Inspect your first story" textSm="Get started" variant="full" onClick={() => router.push("/docs/getting-started")} />
            <Button text="Read the support boundary" textSm="Support boundary" variant="outline" onClick={() => router.push("/docs/storybook")} />
          </div>
          <ul className="mt-8 space-y-3 text-sm text-gray-300">
            {proof.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="rounded-3xl border border-white/10 bg-black/70 p-5 shadow-2xl shadow-purple-950/40 backdrop-blur sm:p-7"
        >
          <div className="mb-5 flex items-center gap-2 text-sm text-gray-400">
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            Local, no-account first run
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-gray-300"><code><span className="text-gray-600">$ </span>compify storybook inspect \
  src/components/Button.stories.tsx{`
`}<span className="text-gray-600">$ </span>compify storybook export \
  src/components/Button.stories.tsx \
  --story Primary \
  --output button.registry.json</code></pre>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm">
            <span className="text-gray-300">Review the exact files before publishing</span>
            <PackageCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
          </div>
          <button type="button" onClick={() => router.push("/docs/cli")} className="mt-5 inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200">
            CLI reference <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
