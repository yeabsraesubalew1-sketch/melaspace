import PageWrapper from "@/components/layout/PageWrapper";
import { buildPageMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how Mela Space collects, protects, and respects your personal information, session data, and coaching reflections.",
  path: "/privacy",
});

const breadcrumbJsonLd = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Privacy Policy", path: "/privacy" },
]);

export default function PrivacyPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-3xl mx-auto space-y-12 pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-foreground/50">Legal & Transparency</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-foreground/60">
            Last updated: October 2026
          </p>
        </header>

        <section className="space-y-4 text-foreground/85 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-semibold text-foreground">Our Commitment to Your Privacy</h2>
          <p>
            At Mela Space, your journey of personal reflection, growth, and coaching requires trust.
            We treat your personal details, inquiries, and reading habits with the utmost care and confidentiality.
            We never sell, rent, or monetize your personal data.
          </p>
        </section>

        <section className="space-y-4 text-foreground/85 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-semibold text-foreground">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-foreground/80">
            <li>
              <strong>Account & Profile Information:</strong> When you sign in (via Google or email), we store your name, email address, and avatar to authenticate your session and manage saved articles.
            </li>
            <li>
              <strong>Inquiry & Waitlist Submissions:</strong> Information submitted through our inquiry or coaching waitlist forms (such as goals, challenges, and contact preferences) is used strictly to communicate with you about coaching services.
            </li>
            <li>
              <strong>Analytics & Performance:</strong> We collect aggregate, anonymized metrics (such as page views and resource downloads) to improve our content and companion tools.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-foreground/85 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-semibold text-foreground">How We Use Your Information</h2>
          <p>
            Your information is used solely to provide a seamless reading and coaching experience, deliver downloadable decks and companion workbooks, and respond to your direct inquiries.
          </p>
        </section>

        <section className="space-y-4 text-foreground/85 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-semibold text-foreground">Your Rights & Contact</h2>
          <p>
            You have the right to request access to, update, or delete any personal information we hold.
            For any privacy inquiries or data requests, please reach out via our contact page or directly at{" "}
            <a href="mailto:hello@melaspace.com" className="text-primary hover:underline">
              hello@melaspace.com
            </a>.
          </p>
        </section>
      </div>
    </PageWrapper>
  );
}
