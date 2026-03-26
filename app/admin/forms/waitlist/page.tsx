// app/admin/forms/waitlist/page.tsx

import WaitlistList from "@/components/admin/forms/WaitlistList";
import { connectDB } from "@/lib/db";
import { Waitlist } from "@/models/Waitlist";

type WaitlistStatus = "new" | "interested" | "dismissed";

interface WaitlistLean {
  _id: string | { toString(): string };
  name: string;
  email: string;
  phone?: string;
  country: string;
  goals: string[];
  preferredLanguage?: string;
  preferredFormat?: string;
  availability?: string;
  hasCoachingExperience?: boolean;
  source?: string;
  wantsUpdates?: boolean;
  message?: string;
  status: WaitlistStatus;
  createdAt: Date;
}

interface WaitlistListItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  goals: string[];
  preferredLanguage?: string;
  preferredFormat?: string;
  availability?: string;
  hasCoachingExperience?: boolean;
  source?: string;
  wantsUpdates?: boolean;
  message?: string;
  status: WaitlistStatus;
  createdAt: string;
}

type SearchParams = {
  page?: string;
  status?: string;
};

function toPlainId(value: unknown): string {
  if (typeof value === "string") return value;
  return String(value);
}

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  const page = Math.max(Number(resolvedSearchParams.page) || 1, 1);

  const statusParam = resolvedSearchParams.status;
  const status =
    statusParam && ["new", "interested", "dismissed"].includes(statusParam)
      ? statusParam
      : "all";

  let data: WaitlistListItem[] = [];
  let meta = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  try {
    await connectDB();

    const filter: Record<string, unknown> = {};

    if (status !== "all") {
      filter.status = status;
    }

    const limit = 10;
    const total = await Waitlist.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const waitlistEntries = await Waitlist.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<WaitlistLean[]>();

    data = waitlistEntries.map((entry) => ({
      ...entry,
      _id: toPlainId(entry._id),
      goals: Array.isArray(entry.goals)
        ? entry.goals
        : typeof entry.goals === "string"
          ? [entry.goals]
          : [],
      createdAt: entry.createdAt.toISOString(),
    }));

    meta = {
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    console.error("WAITLIST PAGE FETCH ERROR:", error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Coaching Waitlist</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Manage coaching applications and potential clients
        </p>
      </div>

      {/* List */}
      <WaitlistList
        waitlist={data}
        meta={meta}
        currentPage={page}
        currentStatus={status}
      />
    </div>
  );
}