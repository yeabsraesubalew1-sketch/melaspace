"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import Link from "next/link";
import { revealItem, revealTransition, revealViewport } from "@/components/sections/motion";

export default function FinalCTASection() {
  return (
    <section className="py-32 bg-primary text-primary-foreground">
      <PageWrapper>
        <div className="mx-auto max-w-3xl text-center rounded-2xl border border-primary-foreground/20 bg-primary/70 p-8 sm:p-10">
          
          {/* Main Line */}
          <motion.h2
            initial="hidden"
            whileInView="visible"
            variants={revealItem}
            viewport={revealViewport}
            transition={revealTransition}
            className="motion-surface text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            Ready for the next step?
          </motion.h2>

          {/* Supporting Text */}
          <motion.p
            initial="hidden"
            whileInView="visible"
            variants={revealItem}
            viewport={revealViewport}
            transition={{ ...revealTransition, delay: 0.04 }}
            className="motion-surface mt-5 text-base sm:text-lg text-primary-foreground/80 leading-relaxed"
          >
            If you want direct support, start with inquiry.
            If you want updates when coaching opens, join the waitlist.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealItem}
            viewport={revealViewport}
            transition={{ ...revealTransition, delay: 0.08 }}
            className="motion-surface mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/contact#inquiry"
              className="inline-flex items-center justify-center rounded-lg border border-primary-foreground/25 bg-primary-foreground px-6 py-2.5 text-sm font-medium text-primary transition duration-200 hover:-translate-y-0.5"
            >
              Start Inquiry
            </Link>

            <Link
              href="/contact#waitlist"
              className="inline-flex items-center justify-center rounded-lg border border-primary-foreground/25 bg-transparent px-6 py-2.5 text-sm font-medium text-primary-foreground transition duration-200 hover:-translate-y-0.5 hover:bg-primary-foreground/10"
            >
              Join Waitlist
            </Link>

            <Link
              href="/blogs"
              className="text-sm font-medium text-primary-foreground/80 transition hover:text-primary-foreground"
            >
              Or keep reading
            </Link>
          </motion.div>

        </div>
      </PageWrapper>
    </section>
  );
}