import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Inquiry } from "@/models/Inquiry";
import { Waitlist } from "@/models/Waitlist";

interface StatusBreakdown {
  total: number;
  new: number;
  interested: number;
  dismissed: number;
}

type StatusCountModel = {
  countDocuments: (filter: { status?: "new" | "interested" | "dismissed" }) => PromiseLike<number>;
};

interface MetricCardProps {
  label: string;
  value: number;
  href: string;
}

function MetricCard({ label, value, href }: MetricCardProps) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-background/85 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-surface-muted/70"
    >
      <p className="text-sm text-foreground/65">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </Link>
  );
}

function BreakdownCard({
  title,
  description,
  href,
  stats,
}: {
  title: string;
  description: string;
  href: string;
  stats: StatusBreakdown;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-background/85 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-surface-muted/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-foreground/65">{description}</p>
        </div>
        <p className="text-2xl font-semibold">{stats.total}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-surface-muted/60 p-3">
          <p className="text-foreground/60">New</p>
          <p className="mt-1 text-lg font-semibold">{stats.new}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted/60 p-3">
          <p className="text-foreground/60">Interested</p>
          <p className="mt-1 text-lg font-semibold">{stats.interested}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted/60 p-3">
          <p className="text-foreground/60">Dismissed</p>
          <p className="mt-1 text-lg font-semibold">{stats.dismissed}</p>
        </div>
      </div>
    </Link>
  );
}

async function getStatusBreakdown(model: StatusCountModel): Promise<StatusBreakdown> {
  const [total, newCount, interestedCount, dismissedCount] = await Promise.all([
    model.countDocuments({}),
    model.countDocuments({ status: "new" }),
    model.countDocuments({ status: "interested" }),
    model.countDocuments({ status: "dismissed" }),
  ]);

  return {
    total,
    new: newCount,
    interested: interestedCount,
    dismissed: dismissedCount,
  };
}

export default async function AdminDashboardPage() {
  await connectDB();

  const [publishedBlogs, draftBlogs, inquiryStats, waitlistStats] = await Promise.all([
    Blog.countDocuments({ status: "published" }),
    Blog.countDocuments({ status: "draft" }),
    getStatusBreakdown(Inquiry),
    getStatusBreakdown(Waitlist),
  ]);

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Admin Dashboard</h1>
        <p className="text-sm text-foreground/65 sm:text-base">
          Quick view of content and form pipeline health.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Published Blogs" value={publishedBlogs} href="/admin/blogs/publishes" />
        <MetricCard label="Draft Blogs" value={draftBlogs} href="/admin/blogs/drafts" />
        <MetricCard label="Inquiry Submissions" value={inquiryStats.total} href="/admin/forms/inquiry" />
        <MetricCard label="Waitlist Entries" value={waitlistStats.total} href="/admin/forms/waitlist" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="Inquiry Pipeline"
          description="Track who is new, promising, or closed."
          href="/admin/forms/inquiry"
          stats={inquiryStats}
        />
        <BreakdownCard
          title="Waitlist Pipeline"
          description="Monitor coaching demand and qualification status."
          href="/admin/forms/waitlist"
          stats={waitlistStats}
        />
      </section>
    </div>
  );
}