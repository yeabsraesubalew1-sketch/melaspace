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
  "You feel stuck, but you can’t explain why.",
  "You overthink everything, especially yourself.",
  "You want to grow, but don’t know where to start.",
  "You’re tired of surface-level advice.",
  "You’re self-aware… but still feel lost sometimes.",
  "You want clarity, not just motivation.",
];

export default function WhoThisIsFor() {
  return (
    <section className="py-24">
      <PageWrapper>
        <div className="mx-auto max-w-5xl">
          
          {/* Heading */}
          <motion.h2
            initial="hidden"
            whileInView="visible"
            variants={revealItem}
            viewport={revealViewport}
            transition={revealTransition}
            className="motion-surface text-center text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            This space is for you if…
          </motion.h2>

          {/* Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealStagger}
            viewport={revealViewport}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((text, i) => (
              <motion.div
                key={i}
                variants={revealCard}
                transition={{ ...revealTransition, delay: i * 0.02 }}
                className="motion-surface card p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-sm"
              >
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                  {text}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </PageWrapper>
    </section>
  );
}