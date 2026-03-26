"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";

const resources = [
  {
    title: "Clarity Compass",
    description:
      "Sort your thoughts, reduce overwhelm, and focus on what actually matters.",
  },
  {
    title: "Daily Check-in",
    description:
      "A simple reflection to reconnect with your values and direction.",
  },
  {
    title: "Mood Tracker",
    description:
      "Understand emotional patterns and what drives them.",
  },
  {
    title: "Weekly Reset",
    description:
      "Reflect, reset, and plan your next steps with intention.",
  },
];

export default function ResourcesSection() {
  return (
    <section className="py-24 bg-surface-muted/35">
      <PageWrapper>
        <div className="max-w-2xl">
          
          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
          >
            Tools for deeper self-work
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.38, delay: 0.06 }}
            className="mt-4 text-base sm:text-lg text-foreground/70"
          >
            Practical tools designed to help you reflect, understand, and move
            forward at your own pace.
          </motion.p>
        </div>

        {/* Stacked Timeline */}
        <div className="mt-12">
          <div className="relative border-l border-border pl-6 sm:pl-8 space-y-5">
            {resources.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.34,
                  delay: i * 0.08,
                }}
                className="relative card p-5 transition duration-200 hover:-translate-y-1 hover:shadow-sm"
              >
                <span className="absolute -left-8.5 sm:-left-10.5 top-6 h-3 w-3 rounded-full border border-border bg-background" />

                <span className="absolute top-3 right-3 text-[10px] uppercase text-foreground/50">
                  Coming Soon
                </span>

                <h3 className="text-lg font-semibold">{item.title}</h3>

                <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
        {/* <p className="text-sm text-foreground/50 mt-6">
          Scroll →
        </p> */}
      </PageWrapper>
    </section>
  );
}