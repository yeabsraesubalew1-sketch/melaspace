"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import Link from "next/link";

export default function BlogCTASection() {
  return (
    <section className="py-24">
      <PageWrapper>
        <div className="mx-auto max-w-3xl text-center">
          
          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            Go deeper than surface-level advice
          </motion.h2>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mt-5 text-base sm:text-lg text-foreground/70 leading-relaxed"
          >
            Explore ideas, reflections, and frameworks designed to help you
            understand yourself, not just temporarily feel better.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-8"
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