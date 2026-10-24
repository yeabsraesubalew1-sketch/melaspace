"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  revealItem,
  revealStagger,
  revealTransition,
  revealViewport,
} from "@/components/sections/motion";

export default function WhatIsMela() {
  return (
    <section className="py-24 sm:py-28">
      <PageWrapper>
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealStagger}
            viewport={revealViewport}
            className="motion-surface relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface/50 via-background to-surface/70 p-8 sm:p-14 shadow-xs"
          >
            {/* Subtle Ethiopic Calligraphy Watermark */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 -bottom-8 select-none text-9xl sm:text-[14rem] font-bold opacity-[0.04] text-foreground font-amharic"
            >
              መላ
            </div>

            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
              <motion.span
                variants={revealItem}
                transition={revealTransition}
                className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-surface-muted px-3 py-1 rounded-full border border-border/70"
              >
                The Meaning of Mela
              </motion.span>

              <motion.h2
                variants={revealItem}
                transition={revealTransition}
                className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight"
              >
                More than a word. A way forward.
              </motion.h2>

              <div className="space-y-4 text-base sm:text-lg text-foreground/80 leading-relaxed">
                <motion.p variants={revealItem} transition={revealTransition}>
                  <span className="font-semibold italic text-foreground font-serif">&ldquo;Mela&rdquo;</span> (መላ) is an Amharic word meaning solution, but it carries a much deeper reassurance: the quiet conviction that even when life feels noisy, uncertain, or stuck, things can be figured out.
                </motion.p>

                <motion.p variants={revealItem} transition={revealTransition}>
                  It lives in everyday Ethiopian conversations, in poetry, and in the way people remind one another: <em className="text-foreground/90 font-medium">“መላ ይኖረዋል”</em> (there is a way).
                </motion.p>

                <motion.p variants={revealItem} transition={revealTransition}>
                  Mela Space is built on that premise: a calm sanctuary where you can slow down, untangle your mind, and uncover your own clarity with neuroscience and care.
                </motion.p>
              </div>

              <motion.div
                variants={revealItem}
                transition={revealTransition}
                className="pt-2"
              >
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-foreground transition-colors"
                >
                  <span>Learn more about our philosophy</span>
                  <span>→</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </PageWrapper>
    </section>
  );
}