"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import Link from "next/link";

export default function FinalCTASection() {
  return (
    <section className="py-32 bg-primary text-primary-foreground">
      <PageWrapper>
        <div className="mx-auto max-w-3xl text-center rounded-2xl border border-primary-foreground/20 bg-primary/70 p-8 sm:p-10">
          
          {/* Main Line */}
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            Ready for the next step?
          </motion.h2>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mt-5 text-base sm:text-lg text-primary-foreground/80 leading-relaxed"
          >
            If you want direct support, start with inquiry.
            If you want updates when coaching opens, join the waitlist.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
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