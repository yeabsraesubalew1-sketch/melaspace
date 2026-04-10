"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import Link from "next/link";
import { revealItem, revealTransition, revealViewport } from "@/components/sections/motion";

export default function BlogCTASection() {
  return (
    <section className="py-24">
      <PageWrapper>
        <div className="mx-auto max-w-3xl text-center">
          
          {/* Heading */}
          <motion.h2
            initial="hidden"
            whileInView="visible"
            variants={revealItem}
            viewport={revealViewport}
            transition={revealTransition}
            className="motion-surface text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            Go deeper than surface-level advice
          </motion.h2>

          {/* Text */}
          <motion.p
            initial="hidden"
            whileInView="visible"
            variants={revealItem}
            viewport={revealViewport}
            transition={{ ...revealTransition, delay: 0.04 }}
            className="motion-surface mt-5 text-base sm:text-lg text-foreground/70 leading-relaxed"
          >
            Explore ideas, reflections, and frameworks designed to help you
            understand yourself, not just temporarily feel better.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealItem}
            viewport={revealViewport}
            transition={{ ...revealTransition, delay: 0.08 }}
            className="motion-surface mt-8"
          >
            <Link
              href="/blogs"
              className="btn btn-primary px-6 py-2.5"
            >
              Explore the Blog
            </Link>
          </motion.div>

        </div>
      </PageWrapper>
    </section>
  );
}