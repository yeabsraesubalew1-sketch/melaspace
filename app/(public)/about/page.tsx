import PageWrapper from "@/components/layout/PageWrapper";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "About",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-16 pt-24 sm:pt-28">

        {/* Hero */}
        <section className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold">About Mela Space</h1>
          <p className="text-foreground/70">
            A calm, intentional space for clarity, healing, and becoming.
          </p>
        </section>

        {/* What is Mela */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium">What is “Mela”?</h2>
          <p className="text-foreground/80 leading-relaxed">
            “Mela / መላ” is an Amharic word meaning solution, but it carries
            something deeper. It’s a word of hope, resilience, and
            possibility. Spoken in everyday conversations, in songs, and in
            moments where people are trying to find a way forward.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            Mela Space is built on that spirit, not just solving problems,
            but helping you find your own way through them.
          </p>
        </section>

        {/* Founder */}
        <section className="space-y-4 card p-6">
          <h2 className="text-xl font-medium">Meet the Founder</h2>
          <p className="text-foreground/80 leading-relaxed">
            Mela Space was founded by Dr. Simret E. Tesfahun, a Cognitive &
            Emotional Neuroscience Master’s candidate with a medical
            background, a content creator, and a coach in training.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            Through storytelling, coaching, and community-building, she aims
            to bridge science, empathy, and everyday wellness.
          </p>
        </section>

        {/* Vision */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium">Our Vision</h2>
          <p className="text-foreground/80 leading-relaxed">
            To create a compassionate and accessible space for anyone ready
            to work on themselves, whether navigating change or
            intentionally growing into a better version of themselves.
          </p>
        </section>

        {/* Values */}
        <section className="space-y-6">
          <h2 className="text-xl font-medium">Core Values</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Empowerment over dependence",
              "Compassion without judgment",
              "Growth mindset",
              "Consistency over intensity",
              "Science meets soul",
            ].map((value) => (
              <div
                key={value}
                className="card p-4 text-sm transition duration-200 hover:-translate-y-1 hover:shadow-sm"
              >
                {value}
              </div>
            ))}
          </div>
        </section>

        {/* Why we exist */}
        <section className="space-y-4 text-center">
          <h2 className="text-xl font-medium">Why We Exist</h2>
          <p className="text-foreground/80 leading-relaxed">
            Because mental clarity isn’t a luxury, it’s a foundation.
          </p>
          <p className="text-foreground/80 italic">
            “You’re not broken. You’re becoming.”
          </p>
        </section>

      </div>
    </PageWrapper>
  );
}