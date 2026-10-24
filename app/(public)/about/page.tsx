import PageWrapper from "@/components/layout/PageWrapper";
import Link from "next/link";
import { buildPageMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "About",
  description:
    "Meet Mela Space: a calm, intentional coaching space founded by Dr. Simret E. Tesfahun, bridging cognitive neuroscience, empathy, and real-life clarity.",
  path: "/about",
});

const breadcrumbJsonLd = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
]);

const coreValues = [
  {
    title: "Empowerment over Dependence",
    description:
      "We believe you already hold the inner wisdom to navigate your life. Our role is to provide the frameworks and questions that help you uncover it.",
    icon: (
      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Compassion without Judgment",
    description:
      "Real growth cannot happen in an environment of shame. We cultivate radical acceptance as the foundation for honest self-understanding.",
    icon: (
      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: "Science Meets Soul",
    description:
      "We bridge cognitive and emotional neuroscience with human warmth, making evidence-based brain science accessible and actionable.",
    icon: (
      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "Consistency over Intensity",
    description:
      "Lasting transformation isn't born from overnight reinvention, but from calm, repeatable rituals practiced with gentleness over time.",
    icon: (
      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Growth Mindset & Neuroplasticity",
    description:
      "Your mind is not fixed. Through deliberate reflection and emotional regulation, you have the lifelong ability to reshape how you think and respond.",
    icon: (
      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

const pillars = [
  {
    number: "01",
    title: "Cognitive Neuroscience",
    summary:
      "Understanding the brain's wiring around stress, emotion, and habits so you stop blaming yourself for natural neurobiological responses.",
  },
  {
    number: "02",
    title: "Compassionate Reflection",
    summary:
      "Creating space to untangle subconscious narratives and name the quiet emotions that drive your daily decisions.",
  },
  {
    number: "03",
    title: "Sustainable Action",
    summary:
      "Turning self-awareness into tangible, low-friction habits that build momentum without burnout.",
  },
];

export default function AboutPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-4xl mx-auto space-y-20 pt-24 sm:pt-32 pb-20 px-4 sm:px-6">

        {/* Hero Section */}
        <section className="text-center space-y-5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-surface-muted text-xs font-semibold uppercase tracking-wider text-primary">
            <span>About Mela Space</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            A calm space for reflection, clarity, and growth.
          </h1>

          <p className="text-base sm:text-lg text-foreground/75 leading-relaxed">
            Where neuroscience, emotional insight, and real life meet, giving you the time and tools to understand yourself without judgment.
          </p>
        </section>

        {/* The Essence of Mela */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface/60 via-background to-surface/80 p-8 sm:p-12 shadow-xs">
          {/* Subtle Ethiopic Calligraphy Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -bottom-10 select-none text-9xl font-bold opacity-[0.05] text-foreground font-amharic"
          >
            መላ
          </div>

          <div className="relative z-10 max-w-2xl space-y-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              The Meaning Behind the Name
            </span>

            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              What is <span className="italic font-serif">&ldquo;Mela&rdquo;</span> (መላ)?
            </h2>

            <p className="text-foreground/80 leading-relaxed text-base sm:text-lg">
              In Amharic, <strong className="text-foreground font-semibold">“Mela / መላ”</strong> translates to solution, but it carries far more than a textbook definition. It is a quiet sense of reassurance: the conviction that even when things feel tangled, overwhelming, or uncertain, there is always a way through.
            </p>

            <p className="text-foreground/75 leading-relaxed text-sm sm:text-base">
              It lives in everyday Ethiopian conversations, in poetry, in music, and in the way people gently remind one another: <em className="text-foreground/90 font-medium">“መላ ይኖረዋል”</em> (there is a way).
            </p>

            <p className="text-foreground/75 leading-relaxed text-sm sm:text-base">
              Mela Space was built on that exact spirit. Not by prescribing rigid formulas, but by providing a grounded environment where you can slow down, untangle your mind, and uncover your own clarity.
            </p>
          </div>
        </section>

        {/* Meet the Founder */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Leadership & Guidance
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">Meet the Founder</h2>
          </div>

          <div className="card p-8 sm:p-10 space-y-8 border-border/80 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/70 pb-6">
              <div>
                <h3 className="text-2xl font-semibold text-foreground">
                  Dr. Simret E. Tesfahun
                </h3>
                <p className="text-sm text-foreground/70 mt-1">
                  Founder, Neuroscience Researcher & Coach in Training
                </p>
              </div>

              {/* Verified Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Mela Space Practice Lead</span>
              </div>
            </div>

            {/* Credential Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 text-center flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-accent mb-2 border border-border/60">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-foreground">Medical Background</p>
                <p className="text-[11px] text-foreground/60 mt-0.5">Clinical foundation</p>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 text-center flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-accent mb-2 border border-border/60">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-foreground">Cognitive Neuroscience</p>
                <p className="text-[11px] text-foreground/60 mt-0.5">Master&apos;s candidate</p>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 text-center flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-accent mb-2 border border-border/60">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-foreground">Coaching & Guidance</p>
                <p className="text-[11px] text-foreground/60 mt-0.5">Clarity frameworks</p>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 text-center flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-accent mb-2 border border-border/60">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-foreground">Community Architect</p>
                <p className="text-[11px] text-foreground/60 mt-0.5">Page Turners Book Club</p>
              </div>
            </div>

            {/* Narrative */}
            <div className="space-y-4 text-foreground/80 leading-relaxed text-sm sm:text-base">
              <p>
                Having navigated the rigorous demands of medical education and advanced cognitive and emotional neuroscience research, Dr. Simret realized that what people often lack isn&apos;t willpower or intelligence: it is a compassionate, structured space to process internal friction.
              </p>
              <p>
                Through Mela Space, she brings scientific rigor and human empathy into one cohesive practice. She writes, coaches, and creates frameworks that dismantle the myth of fixing yourself, focusing instead on cultivating emotional regulation, neuroplastic habit change, and authentic self-alignment.
              </p>
            </div>

            {/* Philosophy Quote */}
            <div className="rounded-2xl border-l-4 border-l-accent bg-surface-muted/70 p-5 sm:p-6 italic text-foreground/90 font-serif text-base sm:text-lg">
              &ldquo;Mental clarity is not a luxury reserved for calm days. It is the very foundation for how you make decisions, love others, and become who you are meant to be.&rdquo;
            </div>
          </div>
        </section>

        {/* 3 Pillars */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Our Methodology
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">The Three Pillars of Mela</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.number}
                className="card p-6 space-y-3 transition duration-200 hover:-translate-y-1 hover:shadow-sm"
              >
                <span className="text-xs font-bold text-accent tracking-widest">
                  {pillar.number}
                </span>
                <h3 className="text-lg font-semibold text-foreground">
                  {pillar.title}
                </h3>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  {pillar.summary}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Values */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              What Guides Us
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">Core Values</h2>
            <p className="text-sm text-foreground/70">
              The principles that shape our coaching sessions, articles, and community culture.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coreValues.map((val) => (
              <div
                key={val.title}
                className="card p-6 space-y-3 transition duration-200 hover:-translate-y-1 hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted border border-border/80 mb-3">
                    {val.icon}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {val.title}
                  </h3>
                  <p className="text-sm text-foreground/75 leading-relaxed mt-2">
                    {val.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why We Exist / Closing CTA */}
        <section className="rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Ready to take a step towards clarity?
            </h2>
            <p className="text-foreground/75 text-sm sm:text-base leading-relaxed">
              Explore our articles and companion resources, or reach out to explore 1-on-1 coaching when you are ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/services" className="btn btn-primary px-6 py-2.5 shadow-sm">
              Explore Services
            </Link>
            <Link href="/blogs" className="btn btn-secondary px-6 py-2.5">
              Read Articles
            </Link>
            <Link href="/contact#inquiry" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
              Send an Inquiry
            </Link>
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}