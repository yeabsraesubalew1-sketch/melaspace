"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import PageWrapper from "@/components/layout/PageWrapper";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-24">
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-72 bg-surface-muted/70 blur-3xl" />

      <PageWrapper>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45 }}
            className="text-center lg:text-left"
          >
            <p className="text-sm uppercase tracking-[0.16em] text-foreground/50">
              Mela Space
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              You are not broken.
              <span className="block text-foreground/70">You are becoming.</span>
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
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="card p-6 sm:p-7"
          >
            <p className="text-sm font-medium text-foreground/60">What this space helps with</p>

            <ul className="mt-4 space-y-3 text-sm sm:text-base text-foreground/80">
              <li className="rounded-lg bg-background/70 px-3 py-2">Untangling overthinking patterns</li>
              <li className="rounded-lg bg-background/70 px-3 py-2">Building practical self-awareness</li>
              <li className="rounded-lg bg-background/70 px-3 py-2">Turning reflection into action</li>
            </ul>

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