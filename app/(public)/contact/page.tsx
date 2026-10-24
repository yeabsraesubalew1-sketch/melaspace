import PageWrapper from "@/components/layout/PageWrapper";
import { buildPageMetadata, breadcrumbSchema } from "@/lib/seo";
import ContactHub from "@/components/forms/ContactHub";

export const metadata = buildPageMetadata({
  title: "Contact",
  description:
    "Reach out to Mela Space for 1-on-1 coaching inquiries, academic mentorship, workshop collaborations, or to join our coaching waitlist.",
  path: "/contact",
});

const breadcrumbJsonLd = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
]);

export default function ContactPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-6xl mx-auto space-y-12 pt-24 sm:pt-32 pb-20 px-4 sm:px-6">

        {/* Header */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-surface-muted text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Direct Connection</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Get in Touch
          </h1>

          <p className="text-base sm:text-lg text-foreground/75 leading-relaxed">
            Whether you have a thoughtful question, wish to propose a workshop or speaking engagement, or are ready to apply for 1-on-1 coaching, you are welcome here.
          </p>
        </section>

        {/* Tabbed Interactive Contact Hub */}
        <ContactHub />

      </div>
    </PageWrapper>
  );
}