"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";

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
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            This space is for you if…
          </motion.h2>

          {/* Grid */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                  delay: i * 0.05,
                }}
                className="card p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-sm"
              >
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </PageWrapper>
    </section>
  );
}