import PageWrapper from "@/components/layout/PageWrapper";
import Link from "next/link";
import { buildPageMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Resources",
  description:
    "Discover Mela Space tools and templates for reflection, journaling, emotional awareness, and sustainable progress.",
  path: "/resources",
});

const breadcrumbJsonLd = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Resources", path: "/resources" },
]);

const resources = [
  "Journaling Prompts for Self-Discovery",
  "The Clarity Compass",
  "Mood Tracker + Reflection Template",
  "Mela Check-in Sheet",
  "Weekly Self-Coaching Template",
  "Emotion Naming Practice Tool",
  "Boundaries Script Builder",
  "Mind-Body Reset Routine",
];

export default function ResourcesPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-4xl mx-auto space-y-12 pt-24 sm:pt-28 pb-16">

        <section className="text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.16em] text-foreground/50">Resources</p>
          <h1 className="text-4xl font-semibold tracking-tight">Resource Library</h1>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Free tools for clarity, reflection, and emotional self-awareness.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {resources.map((item) => (
            <div key={item} className="card p-4 text-sm transition duration-200 hover:-translate-y-1 hover:shadow-sm">
              <p className="font-medium">{item}</p>
              <span className="block text-xs text-foreground/50 mt-1">
                Coming soon
              </span>
            </div>
          ))}
        </section>

        <section className="text-center space-y-4 rounded-2xl border border-border bg-surface p-7">
          <p className="text-foreground/70">
            Want early access or have a resource request?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact#waitlist" className="btn btn-primary px-6 py-2.5">
              Join Waitlist
            </Link>
            <Link href="/contact#inquiry" className="btn btn-secondary px-6 py-2.5">
              Request a Resource
            </Link>
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}