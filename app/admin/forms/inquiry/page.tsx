// app/admin/forms/inquiry/page.tsx

import InquiryList from "@/components/admin/forms/InquiryList";
import { connectDB } from "@/lib/db";
import { Inquiry } from "@/models/Inquiry";

type InquiryStatus = "new" | "interested" | "dismissed";

interface InquiryLean {
  _id: string | { toString(): string };
  name: string;
  email: string;
  reasons: string[];
  message: string;
  wantsReply: boolean;
  source?: string;
  status: InquiryStatus;
  allowTestimonial: boolean;
  createdAt: Date;
}

interface InquiryListItem {
  _id: string;
  name: string;
  email: string;
  reasons: string[];
  message: string;
  wantsReply: boolean;
  source?: string;
  status: InquiryStatus;
  allowTestimonial: boolean;
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

export default async function InquiryPage({
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

  let data: InquiryListItem[] = [];
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
    const total = await Inquiry.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<InquiryLean[]>();

    data = inquiries.map((inquiry) => ({
      ...inquiry,
      _id: toPlainId(inquiry._id),
      createdAt: inquiry.createdAt.toISOString(),
    }));

    meta = {
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    console.error("INQUIRY PAGE FETCH ERROR:", error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Inquiry Submissions</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Manage incoming inquiries and responses
        </p>
      </div>

      {/* List */}
      <InquiryList
        inquiries={data}
        meta={meta}
        currentPage={page}
        currentStatus={status}
      />
    </div>
  );
}