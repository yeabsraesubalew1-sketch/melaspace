"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import {
  revealItem,
  revealStagger,
  revealTransition,
  revealViewport,
} from "@/components/sections/motion";

export default function WhatIsMela() {
  return (
    <section className="py-28">
      <PageWrapper>
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealStagger}
            viewport={revealViewport}
            className="motion-surface"
          >
            <motion.p
              variants={revealItem}
              transition={revealTransition}
              className="text-sm text-foreground/50 tracking-wide uppercase"
            >
              What is Mela?
            </motion.p>

            <motion.h2
              variants={revealItem}
              transition={revealTransition}
              className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight"
            >
              More than a word. A way forward.
            </motion.h2>

            <div className="mt-6 space-y-5 text-base sm:text-lg text-foreground/70 leading-relaxed">
              <motion.p variants={revealItem} transition={revealTransition}>
                <span className="font-semibold italic text-foreground">&ldquo;Mela&rdquo;</span> (መላ) is an
                Amharic word that means solution, but it carries more than a
                definition. It is a quiet sense that things can be figured out, even
                when they feel unclear.
              </motion.p>

              <motion.p variants={revealItem} transition={revealTransition}>
                It lives in everyday conversations, in music, and in the way people
                remind each other that there is always a way forward.
              </motion.p>

              <motion.p variants={revealItem} transition={revealTransition}>
                Mela Space is built on that idea, a calm space where you can slow
                down, reflect, and actually understand yourself.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </PageWrapper>
    </section>
  );
}