import PageWrapper from "@/components/layout/PageWrapper";
import { buildPageMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Review the terms and conditions governing the use of Mela Space articles, downloadable decks, coaching services, and digital resources.",
  path: "/terms",
});

const breadcrumbJsonLd = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Terms of Service", path: "/terms" },
]);

export default function TermsPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-3xl mx-auto space-y-12 pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-foreground/50">Agreement & Guidelines</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-foreground/60">
            Last updated: October 2026
          </p>
        </header>

        <section className="space-y-4 text-foreground/85 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Mela Space (including our articles, worksheets, downloadable resource decks, and coaching inquiries),
            you agree to be bound by these Terms of Service. If you do not agree, you are welcome to discontinue using the platform.
          </p>
        </section>

        <section className="space-y-4 text-foreground/85 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-semibold text-foreground">2. Educational & Coaching Disclaimer</h2>
          <p>
            The content on Mela Space—including articles exploring neuroscience, habits, reflection frameworks, and coaching models—is
            provided for educational and personal growth purposes only.
          </p>
          <p className="p-4 rounded-xl border border-border bg-surface-muted/50 text-foreground/80 italic text-sm">
            Coaching, mentoring, and self-guided reflection are not substitutes for professional medical advice, psychotherapy, psychiatric diagnosis, or clinical mental health treatment.
          </p>
        </section>

        <section className="space-y-4 text-foreground/85 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-semibold text-foreground">3. Intellectual Property</h2>
          <p>
            All original articles, worksheets, guides, graphics, and companion decks published on Mela Space are the property of Mela Space
            and Dr. Simret E. Tesfahun. You are encouraged to download and use companion decks for personal, non-commercial self-discovery.
            Reproduction, commercial resale, or unauthorized redistribution without prior written consent is prohibited.
          </p>
        </section>

        <section className="space-y-4 text-foreground/85 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-semibold text-foreground">4. Contact & Inquiries</h2>
          <p>
            For questions regarding these terms, collaboration proposals, or coaching agreements, please reach out via our contact page.
          </p>
        </section>
      </div>
    </PageWrapper>
  );
}
