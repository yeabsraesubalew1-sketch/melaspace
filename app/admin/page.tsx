import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Resource } from "@/models/Resource";
import { Proposal } from "@/models/Proposal";
import { Inquiry } from "@/models/Inquiry";
import { Waitlist } from "@/models/Waitlist";
import User from "@/models/User";
import { Types } from "mongoose";

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
  value: number | string;
  href: string;
  subtext?: string;
}

function MetricCard({ label, value, href, subtext }: MetricCardProps) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-background/85 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-surface-muted/70 flex flex-col justify-between"
    >
      <div>
        <p className="text-xs sm:text-sm text-foreground/65 font-medium">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      </div>
      {subtext && <p className="mt-2 text-[11px] text-foreground/50">{subtext}</p>}
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
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-foreground/65">{description}</p>
        </div>
        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border border-border bg-surface-muted/60 p-2.5">
          <p className="text-foreground/60">New</p>
          <p className="mt-1 text-base font-bold text-foreground">{stats.new}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted/60 p-2.5">
          <p className="text-foreground/60">Interested</p>
          <p className="mt-1 text-base font-bold text-foreground">{stats.interested}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted/60 p-2.5">
          <p className="text-foreground/60">Dismissed</p>
          <p className="mt-1 text-base font-bold text-foreground">{stats.dismissed}</p>
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
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || "user";
  const userId = session?.user?.id;

  await connectDB();

  const isAuthor = userRole === "author";
  const isSuperOrRoot = ["root_admin", "super_admin"].includes(userRole);

  // If author, fetch author-specific metrics
  if (isAuthor && userId) {
    const authorObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;

    const [myPublishedBlogs, myDraftBlogs, myPendingProposals, myApprovedProposals, myRejectedProposals, viewAgg] =
      await Promise.all([
        Blog.countDocuments({ author: authorObjectId, status: "published" }),
        Blog.countDocuments({ author: authorObjectId, status: "draft" }),
        Proposal.countDocuments({ userId: authorObjectId, status: "pending" }),
        Proposal.countDocuments({ userId: authorObjectId, status: "approved" }),
        Proposal.countDocuments({ userId: authorObjectId, status: "rejected" }),
        Blog.aggregate([
          { $match: { author: authorObjectId } },
          { $group: { _id: null, totalViews: { $sum: "$views" } } },
        ]),
      ]);

    const totalViews = viewAgg[0]?.totalViews || 0;
    const totalMyProposals = myPendingProposals + myApprovedProposals + myRejectedProposals;

    return (
      <div className="space-y-7 pb-12">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-bold sm:text-3xl text-foreground">
            Author Workspace
          </h1>
          <p className="text-xs sm:text-sm text-foreground/65">
            Welcome back, {session?.user?.name || "Author"}. Here is an overview of your articles and proposal submissions.
          </p>
        </header>

        {/* Author Metric Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="My Published Articles"
            value={myPublishedBlogs}
            href="/admin/blogs/publishes"
            subtext="Live on Mela Space"
          />
          <MetricCard
            label="My Drafts"
            value={myDraftBlogs}
            href="/admin/blogs/drafts"
            subtext="Work in progress"
          />
          <MetricCard
            label="Pending Proposals"
            value={myPendingProposals}
            href="/admin/proposals"
            subtext="Awaiting editorial review"
          />
          <MetricCard
            label="Total Article Reads"
            value={totalViews}
            href="/admin/blogs"
            subtext="Lifetime reader views"
          />
        </section>

        {/* Proposals Breakdown Card for Author */}
        <section className="grid gap-4 lg:grid-cols-2">
          <Link
            href="/admin/proposals"
            className="block rounded-xl border border-border bg-background/85 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-surface-muted/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">My Proposals Pipeline</h2>
                <p className="mt-0.5 text-xs text-foreground/65">
                  Track your pitch review status and editorial decisions.
                </p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalMyProposals}</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5">
                <p className="text-amber-600 font-medium">Pending</p>
                <p className="mt-1 text-base font-bold text-foreground">{myPendingProposals}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                <p className="text-emerald-600 font-medium">Approved</p>
                <p className="mt-1 text-base font-bold text-foreground">{myApprovedProposals}</p>
              </div>
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5">
                <p className="text-rose-600 font-medium">Declined</p>
                <p className="mt-1 text-base font-bold text-foreground">{myRejectedProposals}</p>
              </div>
            </div>
          </Link>

          {/* Quick Actions Card */}
          <div className="rounded-xl border border-border bg-background/85 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Author Quick Actions</h2>
              <p className="mt-0.5 text-xs text-foreground/65">
                Create new content or submit a new proposal to the editorial team.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/admin/blogs/new" className="btn btn-primary text-xs px-4 py-2">
                + Write New Article
              </Link>
              <Link href="/admin/proposals" className="btn btn-secondary text-xs px-4 py-2">
                View My Proposals
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Managers & Super Admins & Root Admins
  const [
    publishedBlogs,
    draftBlogs,
    totalProposals,
    pendingProposals,
    approvedProposals,
    rejectedProposals,
    publishedResources,
    draftResources,
    resourceAgg,
    inquiryStats,
    waitlistStats,
    userCount,
  ] = await Promise.all([
    Blog.countDocuments({ status: "published" }),
    Blog.countDocuments({ status: "draft" }),
    Proposal.countDocuments({}),
    Proposal.countDocuments({ status: "pending" }),
    Proposal.countDocuments({ status: "approved" }),
    Proposal.countDocuments({ status: "rejected" }),
    Resource.countDocuments({ status: "published" }),
    Resource.countDocuments({ status: "draft" }),
    Resource.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: null, totalDownloads: { $sum: "$downloadCount" } } },
    ]),
    getStatusBreakdown(Inquiry),
    getStatusBreakdown(Waitlist),
    isSuperOrRoot ? User.countDocuments({}) : Promise.resolve(0),
  ]);

  const totalResourceDownloads = resourceAgg[0]?.totalDownloads || 0;
  const totalResources = publishedResources + draftResources;

  return (
    <div className="space-y-7 pb-12">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold sm:text-3xl text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-foreground/65">
          Overview of published content, proposal reviews, resource decks, and inquiries.
        </p>
      </header>

      {/* Main Metric Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Published Blogs"
          value={publishedBlogs}
          href="/admin/blogs/publishes"
        />
        <MetricCard
          label="Draft Blogs"
          value={draftBlogs}
          href="/admin/blogs/drafts"
        />
        <MetricCard
          label="Pending Proposals"
          value={pendingProposals}
          href="/admin/proposals"
          subtext={`${totalProposals} total submissions`}
        />
        <MetricCard
          label="Resource Decks"
          value={publishedResources}
          href="/admin/resources"
          subtext={`${totalResourceDownloads} total downloads`}
        />
        <MetricCard
          label="Inquiry Submissions"
          value={inquiryStats.total}
          href="/admin/forms/inquiry"
          subtext={`${inquiryStats.new} new`}
        />
        <MetricCard
          label="Waitlist Entries"
          value={waitlistStats.total}
          href="/admin/forms/waitlist"
          subtext={`${waitlistStats.new} new`}
        />
      </section>

      {/* Detailed Pipelines Grid */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Proposals Pipeline */}
        <Link
          href="/admin/proposals"
          className="block rounded-xl border border-border bg-background/85 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-surface-muted/70"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Proposals Pipeline</h2>
                {pendingProposals > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                    {pendingProposals} Need Review
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-foreground/65">
                Review pitches and draft submissions from contributors and users.
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalProposals}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5">
              <p className="text-amber-600 font-medium">Pending</p>
              <p className="mt-1 text-base font-bold text-foreground">{pendingProposals}</p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
              <p className="text-emerald-600 font-medium">Approved</p>
              <p className="mt-1 text-base font-bold text-foreground">{approvedProposals}</p>
            </div>
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5">
              <p className="text-rose-600 font-medium">Rejected</p>
              <p className="mt-1 text-base font-bold text-foreground">{rejectedProposals}</p>
            </div>
          </div>
        </Link>

        {/* Resources & Decks Breakdown */}
        <Link
          href="/admin/resources"
          className="block rounded-xl border border-border bg-background/85 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-surface-muted/70"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Resource Hub & Decks</h2>
              <p className="mt-0.5 text-xs text-foreground/65">
                FileVault downloads, workbooks, companion sheets, and decks.
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalResources}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-surface-muted/60 p-2.5">
              <p className="text-foreground/60">Published</p>
              <p className="mt-1 text-base font-bold text-foreground">{publishedResources}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted/60 p-2.5">
              <p className="text-foreground/60">Drafts</p>
              <p className="mt-1 text-base font-bold text-foreground">{draftResources}</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5">
              <p className="text-primary font-medium">Downloads</p>
              <p className="mt-1 text-base font-bold text-foreground">{totalResourceDownloads}</p>
            </div>
          </div>
        </Link>

        {/* Inquiry Pipeline */}
        <BreakdownCard
          title="Inquiry Pipeline"
          description="Track incoming inquiries and lead states."
          href="/admin/forms/inquiry"
          stats={inquiryStats}
        />

        {/* Waitlist Pipeline */}
        <BreakdownCard
          title="Waitlist Pipeline"
          description="Monitor coaching demand and qualification status."
          href="/admin/forms/waitlist"
          stats={waitlistStats}
        />
      </section>

      {/* Super Admin / Root Admin quick stats footer */}
      {isSuperOrRoot && (
        <section className="pt-2">
          <Link
            href="/admin/users"
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/85 hover:bg-surface-muted/60 transition text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-foreground">User & Administrator Accounts</p>
                <p className="text-foreground/50">{userCount} registered accounts across all roles</p>
              </div>
            </div>
            <span className="text-primary font-medium">Manage Users &rarr;</span>
          </Link>
        </section>
      )}
    </div>
  );
}