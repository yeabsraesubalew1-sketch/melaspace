"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  revealItem,
  revealStagger,
  revealTransition,
  revealTimelineCard,
  revealViewport,
} from "@/components/sections/motion";

const resources = [
  {
    title: "The Clarity Compass",
    description:
      "A step-by-step reflection deck to untangle mental noise, reduce overwhelm, and prioritize your highest-leverage next step.",
    tag: "Reflection Deck",
  },
  {
    title: "Neuroscience Habit Reset",
    description:
      "Understand dopamine loops and cognitive friction to build lasting daily habits without relying on brute willpower.",
    tag: "Action Guide",
  },
  {
    title: "Daily Mindful Check-in",
    description:
      "A quick 5-minute morning and evening prompt system to reconnect with your emotional state and core intentions.",
    tag: "Journal Template",
  },
  {
    title: "Weekly Transition Compass",
    description:
      "Reflect on the week gone by, recalibrate your energy, and enter the coming days with calm clarity.",
    tag: "Planning Kit",
  },
];

export default function ResourcesSection() {
  return (
    <section className="py-24 sm:py-28 bg-surface-muted/30">
      <PageWrapper>
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="max-w-xl space-y-3">
              <motion.span
                initial="hidden"
                whileInView="visible"
                variants={revealItem}
                viewport={revealViewport}
                transition={revealTransition}
                className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-surface-muted px-3 py-1 rounded-full border border-border/70"
              >
                Mela Resource Hub
              </motion.span>
              <motion.h2
                initial="hidden"
                whileInView="visible"
                variants={revealItem}
                viewport={revealViewport}
                transition={revealTransition}
                className="motion-surface text-3xl sm:text-4xl font-semibold tracking-tight"
              >
                Tools for deeper self-reflection
              </motion.h2>
              <motion.p
                initial="hidden"
                whileInView="visible"
                variants={revealItem}
                viewport={revealViewport}
                transition={{ ...revealTransition, delay: 0.04 }}
                className="motion-surface text-base sm:text-lg text-foreground/75"
              >
                Curated companion decks, worksheets, and frameworks you can download and use at your own pace.
              </motion.p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={{ ...revealTransition, delay: 0.06 }}
            >
              <Link href="/resources" className="btn btn-secondary px-5 py-2.5 shadow-xs shrink-0">
                <span>View All Resources</span>
                <span className="ml-1.5">→</span>
              </Link>
            </motion.div>
          </div>

          {/* Cards Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealStagger}
            viewport={revealViewport}
            className="grid gap-5 sm:grid-cols-2"
          >
            {resources.map((item, i) => (
              <motion.div
                key={item.title}
                variants={revealTimelineCard}
                transition={{ ...revealTransition, delay: i * 0.03 }}
                className="motion-surface rounded-2xl border border-border/80 bg-background/80 p-6 transition duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-accent bg-surface-muted px-2.5 py-0.5 rounded-full border border-border/60">
                      {item.tag}
                    </span>
                    <span className="text-xs text-foreground/50">Free Download</span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>

                  <p className="text-sm text-foreground/75 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-5 border-t border-border/50 mt-4 flex items-center justify-between text-xs font-semibold text-accent">
                  <Link href="/resources" className="hover:text-foreground transition-colors flex items-center gap-1">
                    <span>Access in Resource Hub</span>
                    <span>→</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </PageWrapper>
    </section>
  );
}