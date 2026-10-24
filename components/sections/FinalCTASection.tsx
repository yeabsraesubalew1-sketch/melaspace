"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import Link from "next/link";
import { revealItem, revealTransition, revealViewport } from "@/components/sections/motion";

export default function FinalCTASection() {
  return (
    <section className="py-24 sm:py-32">
      <PageWrapper>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface via-surface-muted/50 to-surface p-10 sm:p-16 text-center shadow-xs">
          
          {/* Subtle concentric rings decorative watermark in background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 opacity-[0.06] text-foreground select-none"
          >
            <svg viewBox="0 0 100 100" fill="none" className="h-72 w-72">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <motion.span
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={revealTransition}
              className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-surface-muted px-3 py-1 rounded-full border border-border/70"
            >
              Take Your Next Step
            </motion.span>

            {/* Main Line */}
            <motion.h2
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={revealTransition}
              className="motion-surface text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight"
            >
              Ready to find clarity in the noise?
            </motion.h2>

            {/* Supporting Text */}
            <motion.p
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={{ ...revealTransition, delay: 0.04 }}
              className="motion-surface text-base sm:text-lg text-foreground/75 leading-relaxed"
            >
              Whether you need personalized 1-on-1 coaching, academic mentorship, or simply want to explore our articles, you are allowed to take your time.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={{ ...revealTransition, delay: 0.08 }}
              className="motion-surface pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/contact#inquiry"
                className="btn btn-primary px-6 py-2.5 shadow-sm w-full sm:w-auto"
              >
                Send an Inquiry
              </Link>

              <Link
                href="/contact#waitlist"
                className="btn btn-secondary px-6 py-2.5 shadow-xs w-full sm:w-auto"
              >
                Join Coaching Waitlist
              </Link>

              <Link
                href="/blogs"
                className="text-sm font-semibold text-foreground/75 hover:text-foreground transition-colors pt-2 sm:pt-0"
              >
                Explore Blog →
              </Link>
            </motion.div>
          </div>

        </div>
      </PageWrapper>
    </section>
  );
}