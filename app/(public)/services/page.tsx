import PageWrapper from "@/components/layout/PageWrapper";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Services",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-14 pt-24 sm:pt-28 pb-16">

        <section className="text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.16em] text-foreground/50">Services</p>
          <h1 className="text-4xl font-semibold tracking-tight">Work with Mela Space</h1>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Support designed for people who want clarity, structure, and meaningful progress.
          </p>
        </section>

        {/* Coaching */}
        <section className="space-y-4 card p-6 transition duration-200 hover:-translate-y-1 hover:shadow-sm">
          <h2 className="text-xl font-medium">Coaching</h2>
          <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1">
            <li>Self-discovery & growth</li>
            <li>Goal setting & time management</li>
            <li>Emotional regulation & communication</li>
            <li>Life transitions</li>
          </ul>
        </section>

        {/* Mentoring */}
        <section className="space-y-4 card p-6 transition duration-200 hover:-translate-y-1 hover:shadow-sm">
          <h2 className="text-xl font-medium">Mentoring</h2>
          <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1">
            <li>Neuroscience guidance</li>
            <li>Global education pathways</li>
            <li>Study abroad direction</li>
            <li>Identity & cultural transitions</li>
          </ul>
        </section>

        {/* Workshops */}
        <section className="space-y-4 card p-6 transition duration-200 hover:-translate-y-1 hover:shadow-sm">
          <h2 className="text-xl font-medium">Workshops</h2>
          <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1">
            <li>The Brain & Stress</li>
            <li>Neuroplasticity & Habit Change</li>
            <li>Mental health in daily life</li>
            <li>Growth mindset</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 rounded-2xl border border-border bg-surface p-7">
          <p className="text-foreground/70">
            Choose the route that fits where you are right now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact#inquiry" className="btn btn-primary px-6 py-2.5">
              Start Inquiry
            </Link>
            <Link href="/contact#waitlist" className="btn btn-secondary px-6 py-2.5">
              Join Coaching Waitlist
            </Link>
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}