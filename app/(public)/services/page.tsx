import PageWrapper from "@/components/layout/PageWrapper";
import Link from "next/link";
import { buildPageMetadata, breadcrumbSchema } from "@/lib/seo";
import ServicesFAQ from "@/components/services/ServicesFAQ";

export const metadata = buildPageMetadata({
  title: "Services",
  description:
    "Explore Mela Space 1-on-1 coaching, academic & career mentoring, and neuroscience workshops for clarity, resilience, and intentional living.",
  path: "/services",
});

const breadcrumbJsonLd = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
]);

const servicesList = [
  {
    id: "coaching",
    badge: "1-on-1 Deep Dive",
    title: "Clarity Coaching",
    tagline: "Personalized guidance to untangle subconscious friction, regulate stress, and build sustainable direction.",
    forWhom: "Founders, creators, and individuals feeling overwhelmed, stuck in overthinking, or navigating major life transitions.",
    deliverables: [
      "Bi-weekly 60-minute focused video coaching sessions",
      "Tailored cognitive neuroscience reflection frameworks",
      "Asynchronous check-in and voice prompt support",
      "Personalized habit architecture and progress journal",
      "Full access to Mela resource decks and workbooks",
    ],
    ctaText: "Join Coaching Waitlist",
    ctaLink: "/contact#waitlist",
    isPrimary: true,
  },
  {
    id: "mentoring",
    badge: "Strategic Direction",
    title: "Mentoring & Global Pathways",
    tagline: "Guidance for students and early-career professionals navigating neuroscience, study abroad, and international health careers.",
    forWhom: "Students, researchers, and diaspora applicants seeking clarity on international master's, PhDs, or medical scholarships.",
    deliverables: [
      "1-on-1 academic CV & statement of purpose reviews",
      "Global scholarship roadmap and application strategy",
      "Navigating cultural and academic identity transitions",
      "Mindset coaching for high-stakes academic environments",
    ],
    ctaText: "Inquire for Mentorship",
    ctaLink: "/contact#inquiry",
    isPrimary: false,
  },
  {
    id: "workshops",
    badge: "Groups & Organizations",
    title: "Workshops & Speaking",
    tagline: "Interactive masterclasses grounding stress neurobiology, neuroplasticity, and emotional resilience in daily work.",
    forWhom: "Universities, student groups, creative agencies, and corporate teams seeking authentic mental wellness without toxic positivity.",
    deliverables: [
      "Dynamic 60 to 90-minute keynote or workshop formats",
      "Actionable participant worksheets and digital toolkits",
      "Interactive Q&A and guided cognitive reframing drills",
      "Customized to organizational focus and culture",
    ],
    ctaText: "Book a Workshop",
    ctaLink: "/contact#inquiry",
    isPrimary: false,
  },
];

const roadmapSteps = [
  {
    step: "01",
    title: "Unpacking & Discovery",
    desc: "We start by slowing down and mapping out what feels tangled. Together, we identify subconscious patterns, stressors, and emotional triggers without blame.",
  },
  {
    step: "02",
    title: "Neuroscience & Reframing",
    desc: "We examine how your brain responds to your specific environment and craft evidence-based cognitive frameworks tailored to your personality and goals.",
  },
  {
    step: "03",
    title: "Sustainable Momentum",
    desc: "We translate insights into practical, low-resistance daily rituals. You leave each cycle with clear boundaries, measurable focus, and self-trust.",
  },
];

export default function ServicesPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-6xl mx-auto space-y-24 pt-24 sm:pt-32 pb-20 px-4 sm:px-6">

        {/* Hero Section */}
        <section className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-surface-muted text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Work with Mela Space</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Spaces built for clarity, structure, and real momentum.
          </h1>

          <p className="text-base sm:text-lg text-foreground/75 leading-relaxed">
            Whether you need 1-on-1 coaching, academic mentorship, or organizational workshops, our work is grounded in cognitive neuroscience, human empathy, and actionable frameworks.
          </p>
        </section>

        {/* Service Cards Grid */}
        <section className="grid gap-8 lg:grid-cols-3 items-stretch">
          {servicesList.map((svc) => (
            <div
              key={svc.id}
              className={`rounded-3xl border p-7 sm:p-8 flex flex-col justify-between transition duration-200 hover:-translate-y-1 hover:shadow-md ${
                svc.isPrimary
                  ? "border-accent/40 bg-gradient-to-b from-surface via-surface-muted/60 to-surface shadow-xs ring-1 ring-accent/20"
                  : "border-border/80 bg-surface/50"
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-surface-muted border border-border/80 text-foreground/80">
                    {svc.badge}
                  </span>
                  {svc.isPrimary && (
                    <span className="text-xs font-medium text-accent uppercase tracking-wider">
                      Most Focused
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                    {svc.title}
                  </h2>
                  <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
                    {svc.tagline}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/60 p-3.5 text-xs text-foreground/80 leading-relaxed">
                  <strong className="font-semibold text-foreground block mb-0.5">Who this is for:</strong>
                  {svc.forWhom}
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    What&apos;s Included
                  </p>
                  <ul className="space-y-2 text-sm text-foreground/80">
                    {svc.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <svg
                          className="h-4 w-4 shrink-0 text-accent mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href={svc.ctaLink}
                  className={`w-full ${
                    svc.isPrimary ? "btn btn-primary" : "btn btn-secondary"
                  } py-2.5 shadow-xs`}
                >
                  {svc.ctaText}
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* The 3-Step Mela Journey */}
        <section className="space-y-12 rounded-3xl border border-border/80 bg-surface/40 p-8 sm:p-14">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              How We Work
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              The 3-Step Clarity Journey
            </h2>
            <p className="text-sm sm:text-base text-foreground/75">
              A structured roadmap combining emotional acceptance with cognitive science.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {roadmapSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl border border-border/70 bg-background/80 p-6 space-y-3 shadow-xs relative"
              >
                <span className="text-2xl font-bold font-serif text-accent/80">
                  {step.step}
                </span>
                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Clear Answers
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-foreground/70">
              Everything you need to know about working together.
            </p>
          </div>

          <ServicesFAQ />
        </section>

        {/* Final Reassurance CTA */}
        <section className="rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Not sure which option is right for you?
            </h2>
            <p className="text-foreground/75 text-sm sm:text-base leading-relaxed">
              Send a quick message detailing your current goals or questions, and we will guide you toward the most helpful route.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/contact#inquiry" className="btn btn-primary px-6 py-2.5 shadow-sm">
              Send an Inquiry
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