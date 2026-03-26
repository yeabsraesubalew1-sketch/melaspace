"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";

export default function WhatIsMela() {
  return (
    <section className="py-28">
      <PageWrapper>
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-sm text-foreground/50 tracking-wide uppercase"
          >
            What is Mela?
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            More than a word. A way forward.
          </motion.h2>

          <div className="mt-6 space-y-5 text-base sm:text-lg text-foreground/70 leading-relaxed">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
              <span className="font-semibold italic text-foreground">“Mela”</span> (መላ) is an
              Amharic word that means solution, but it carries more than a
              definition. It’s a quiet sense that things can be figured out, even
              when they feel unclear.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            >
              It lives in everyday conversations, in music, and in the way people
              remind each other that there’s always a way forward.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              Mela Space is built on that idea, a calm space where you can slow
              down, reflect, and actually understand yourself.
            </motion.p>
          </div>
        </div>
      </PageWrapper>
    </section>
  );
}