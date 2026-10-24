"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import {
  revealCard,
  revealItem,
  revealStagger,
  revealTransition,
  revealViewport,
} from "@/components/sections/motion";

const items = [
  {
    theme: "Overthinking",
    text: "You overthink everything, constantly analyzing your own thoughts and emotions.",
  },
  {
    theme: "Inner Friction",
    text: "You feel stuck or uninspired, but you can’t pinpoint the exact reason why.",
  },
  {
    theme: "Direction",
    text: "You want to grow and evolve, but feel overwhelmed by conflicting paths and options.",
  },
  {
    theme: "Depth",
    text: "You are tired of surface-level motivation and want grounded, practical frameworks.",
  },
  {
    theme: "Self-Awareness",
    text: "You are deeply self-aware, yet you still find yourself trapped in the same repetitive cycles.",
  },
  {
    theme: "Real Clarity",
    text: "You don't need a temporary hype boost. You want clarity, peace of mind, and calm momentum.",
  },
];

export default function WhoThisIsFor() {
  return (
    <section className="py-24 sm:py-28">
      <PageWrapper>
        <div className="mx-auto max-w-5xl space-y-12">
          
          {/* Heading */}
          <div className="text-center max-w-xl mx-auto space-y-3">
            <motion.p
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={revealTransition}
              className="text-xs font-semibold uppercase tracking-wider text-foreground/50"
            >
              Quiet Resonance
            </motion.p>
            <motion.h2
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={revealTransition}
              className="motion-surface text-3xl sm:text-4xl font-semibold tracking-tight"
            >
              This space is for you if...
            </motion.h2>
            <motion.p
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={{ ...revealTransition, delay: 0.04 }}
              className="text-sm sm:text-base text-foreground/70"
            >
              If any of these sound like your inner monologue, you are not alone.
            </motion.p>
          </div>

          {/* Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealStagger}
            viewport={revealViewport}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((item, i) => (
              <motion.div
                key={item.theme}
                variants={revealCard}
                transition={{ ...revealTransition, delay: i * 0.02 }}
                className="motion-surface rounded-2xl border border-border/80 bg-surface/50 p-6 text-left transition duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-accent bg-surface-muted px-2.5 py-0.5 rounded-full border border-border/60">
                      {item.theme}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                  </div>
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-medium">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </PageWrapper>
    </section>
  );
}