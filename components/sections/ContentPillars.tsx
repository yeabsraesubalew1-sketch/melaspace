"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  revealCard,
  revealItem,
  revealStagger,
  revealTransition,
  revealViewport,
} from "@/components/sections/motion";

const categories = [
  {
    title: "Coaching",
    description:
      "Practical tools and frameworks to help you navigate real-life challenges and take action.",
    slug: "coaching",
  },
  {
    title: "Neuroscience",
    description:
      "Understand how your mind works, from habits to emotions to behavior change.",
    slug: "neuroscience",
  },
  {
    title: "Personal Journals",
    description:
      "Honest reflections and real experiences, the messy, human side of growth.",
    slug: "personal-journals",
  },
  {
    title: "Book Reflections",
    description:
      "Ideas, insights, and takeaways from books that shape how we think and grow.",
    slug: "book-reflections",
  },
];

export default function ContentPillars() {
  return (
    <section className="py-24">
      <PageWrapper>
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-10 lg:items-start">
          <div className="text-center lg:text-left">
            <p className="text-sm uppercase tracking-[0.16em] text-foreground/50">
              Content pillars
            </p>

            <motion.h2
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={revealTransition}
              className="motion-surface mt-3 text-3xl sm:text-4xl font-semibold tracking-tight"
            >
              Explore what speaks to you
            </motion.h2>

            <motion.p
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={{ ...revealTransition, delay: 0.04 }}
              className="motion-surface mt-4 text-base sm:text-lg text-foreground/70"
            >
              Each category supports a different part of your growth process,
              from practical change to deeper reflection.
            </motion.p>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={revealItem}
              viewport={revealViewport}
              transition={{ ...revealTransition, delay: 0.06 }}
              className="motion-surface mt-7"
            >
              <Link href="/contact#inquiry" className="btn btn-secondary px-6 py-2.5">
                Ask a question
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={revealStagger}
            viewport={revealViewport}
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-0"
          >
            {categories.map((cat, i) => (
              <motion.div
                key={cat.slug}
                variants={revealCard}
                transition={{ ...revealTransition, delay: i * 0.02 }}
                className="motion-surface"
              >
                <Link
                  href={`/blogs?category=${cat.slug}`}
                  className="block h-full card p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{cat.title}</h3>

                  <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
                    {cat.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </PageWrapper>
    </section>
  );
}