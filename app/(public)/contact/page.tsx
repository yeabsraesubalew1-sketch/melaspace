import PageWrapper from "@/components/layout/PageWrapper";
import InquiryForm from "@/components/forms/InquiryForm";
import WaitlistForm from "@/components/forms/WaitlistForm";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Contact",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-14 pt-24 sm:pt-28 pb-16">

        {/* Header */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-semibold">Get in Touch</h1>
          <p className="text-foreground/70">
            Whether you have a question, idea, or just want to connect,
            you’re welcome here.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#inquiry" className="btn btn-secondary px-5 py-2">
              Go to Inquiry
            </a>
            <a href="#waitlist" className="btn btn-secondary px-5 py-2">
              Go to Waitlist
            </a>
          </div>
        </section>

        {/* Inquiry */}
        <section id="inquiry" className="space-y-6 scroll-mt-28">
          <div>
            <h2 className="text-xl font-medium">
              Have a question or want to collaborate?
            </h2>
            <p className="text-sm text-foreground/70">
              Send a message and we’ll get back to you.
            </p>
          </div>

          <div className="card p-6">
            <InquiryForm />
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Waitlist */}
        <section id="waitlist" className="space-y-6 scroll-mt-28">
          <div>
            <h2 className="text-xl font-medium">
              Interested in coaching?
            </h2>
            <p className="text-sm text-foreground/70">
              Join the waitlist and we’ll notify you when spots open.
            </p>
          </div>

          <div className="card p-6">
            <WaitlistForm />
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}