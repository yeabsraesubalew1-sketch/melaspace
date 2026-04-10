"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import PageWrapper from "@/components/layout/PageWrapper";
import { revealCard, revealItem, revealTransition, revealViewport } from "@/components/sections/motion";

const highlights = [
  {
    title: "Clarity",
    description: "Name what feels tangled and turn it into something workable.",
    accent: "bg-foreground/75",
  },
  {
    title: "Reflection",
    description: "Slow down enough to notice the pattern beneath the noise.",
    accent: "bg-accent/80",
  },
  {
    title: "Action",
    description: "Leave with a next step that feels practical and real.",
    accent: "bg-mela-caramel-brown",
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-24">
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-72 bg-surface-muted/70 blur-3xl" />

      <PageWrapper>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealItem}
            viewport={revealViewport}
            transition={revealTransition}
            className="motion-surface text-center lg:text-left"
          >
            <p className="text-sm uppercase tracking-[0.16em] text-foreground/50">
              Mela Space
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              You don’t need fixing.
              <span className="block text-foreground/70">You need clarity.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg lg:mx-0 mx-auto">
              A calm space for reflection, clarity, and growth where science,
              emotional insight, and real life come together.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Link href="/contact#inquiry" className="btn btn-primary px-6 py-2.5">
                Start Inquiry
              </Link>
              <Link href="/contact#waitlist" className="btn btn-secondary px-6 py-2.5">
                Join Waitlist
              </Link>
              <Link href="/blogs" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">
                Explore Blog
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealCard}
            viewport={revealViewport}
            transition={{ ...revealTransition, delay: 0.06 }}
            className="motion-surface card overflow-hidden p-6 sm:p-7 lg:-translate-y-4 xl:-translate-y-6"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-medium text-foreground/60">What this space helps with</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/70">
                  Simple, grounded support for people who want a clearer way
                  to think, feel, and move forward.
                </p>
              </div>

              <svg
                viewBox="0 0 88 88"
                className="h-16 w-16 shrink-0 text-foreground/25"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="44" cy="44" r="33" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
                <circle cx="44" cy="44" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
                <path d="M25 49c5-9 12-13 19-13s14 4 19 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M44 16v10M72 44H62M44 72V62M16 44h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              </svg>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <div className={`h-2.5 w-2.5 rounded-full ${item.accent}`} />
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-border/70 bg-background/70 p-4 text-sm text-foreground/70">
              Start with inquiry if you want a tailored response.
              Join waitlist if you want coaching updates.
            </div>
          </motion.div>
        </div>
      </PageWrapper>
    </section>
  );
}