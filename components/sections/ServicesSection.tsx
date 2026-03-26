"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import Link from "next/link";

const services = [
  {
    title: "Coaching",
    description:
      "1-on-1 guidance to help you gain clarity, navigate challenges, and move forward with intention.",
  },
  {
    title: "Mentoring",
    description:
      "Support for students and young professionals figuring out direction, especially in neuroscience and global paths.",
  },
  {
    title: "Workshops",
    description:
      "Interactive sessions focused on mindset, emotional awareness, and practical self-development tools.",
  },
];

export default function ServicesSection() {
  return (
    <section className="py-24">
      <PageWrapper>
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:gap-10 lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4 }}
            className="text-center lg:text-left"
          >
            <p className="text-sm uppercase tracking-[0.16em] text-foreground/50">Services</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Ways to work together
            </h2>
            <p className="mt-4 text-base sm:text-lg text-foreground/70">
              If you want deeper support, these are focused spaces where we can
              work with more structure and accountability.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 lg:justify-start">
              <Link href="/contact#waitlist" className="btn btn-primary px-6 py-2.5">
                Join Waitlist
              </Link>

              <Link href="/contact#inquiry" className="btn btn-secondary px-6 py-2.5">
                Send Inquiry
              </Link>
            </div>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.35,
                  delay: i * 0.06,
                }}
                className="card card-muted p-6 text-left transition duration-200 hover:-translate-y-1 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold">
                  {service.title}
                </h3>

                <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </PageWrapper>
    </section>
  );
}