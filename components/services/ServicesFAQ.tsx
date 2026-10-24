"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How is coaching with Mela Space different from therapy?",
    answer:
      "Therapy primarily diagnoses and heals clinical disorders and past psychological trauma. Mela Space coaching is forward-focused and educational: we integrate cognitive neuroscience, emotional awareness, and practical reflection frameworks to help you understand your brain's patterns, make clearer decisions, and build sustainable momentum.",
  },
  {
    question: "What does a typical 1-on-1 session look like?",
    answer:
      "Each 60-minute session is a calm, judgment-free dialogue. We begin by unpacking current bottlenecks, explore the underlying neurobiological and emotional drivers, reframe unhelpful narratives, and conclude with one or two concrete, low-friction action steps to practice until our next meeting.",
  },
  {
    question: "Can I join sessions if I live outside Ethiopia?",
    answer:
      "Yes, absolutely. Mela Space operates virtually across international time zones via secure video conferencing. We work with clients, students, and diaspora professionals across North America, Europe, Africa, and beyond.",
  },
  {
    question: "What is the difference between submitting an Inquiry and joining the Waitlist?",
    answer:
      "The Inquiry Form is for direct questions, collaborations, workshop bookings, or mentorship requests. The Coaching Waitlist is specifically for clients interested in entering our 1-on-1 coaching cohort when new client spots open.",
  },
  {
    question: "How long is a typical coaching engagement?",
    answer:
      "Most clients work with Dr. Simret over a 3-month or 6-month journey (meeting bi-weekly). This timeframe provides adequate space for genuine neuroplastic habit change and observable life progress without creating long-term dependency.",
  },
];

export default function ServicesFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={faq.question}
            className="rounded-2xl border border-border/80 bg-background/60 overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none cursor-pointer"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-base sm:text-lg text-foreground pr-4">
                {faq.question}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-surface-muted transition-transform duration-200 ${
                  isOpen ? "rotate-180 bg-surface" : ""
                }`}
              >
                <svg
                  className="h-4 w-4 text-foreground/75"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-sm sm:text-base text-foreground/75 leading-relaxed border-t border-border/40 animate-in fade-in-0 duration-200">
                <p className="pt-3">{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
