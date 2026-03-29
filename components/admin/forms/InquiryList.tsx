"use client";

import { useRouter, useSearchParams } from "next/navigation";
import InquiryCard from "@/components/admin/forms/InquiryCard";


interface Inquiry {
  _id: string;
  name: string;
  email: string;
  reasons: string[];
  message: string;
  wantsReply: boolean;
  source?: string;
  status: "new" | "interested" | "dismissed";
  allowTestimonial: boolean;
  createdAt: string;
}

interface Props {
  inquiries: Inquiry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  currentPage: number;
  currentStatus: string;
}

const STATUSES = ["all", "new", "interested", "dismissed"];

export default function InquiryList({
  inquiries,
  meta,
  currentPage,
  currentStatus,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  // -------------------------
  // Update URL helper
  // -------------------------
  function updateQuery(key: string, value: string) {
    const newParams = new URLSearchParams(params.toString());

    if (value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }

    // reset page when changing filter
    if (key === "status") {
      newParams.set("page", "1");
    }

    router.push(`/admin/forms/inquiry?${newParams.toString()}`);
  }

  // -------------------------
  // Pagination
  // -------------------------
  function goToPage(page: number) {
    const newParams = new URLSearchParams(params.toString());
    newParams.set("page", String(page));

    router.push(`/admin/forms/inquiry?${newParams.toString()}`);
  }

  const totalPages = meta?.totalPages ?? 1;

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="space-y-6">
      {/* Status Tabs */}
      <div className="rounded-xl border border-border bg-background/85 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
        {STATUSES.map((status) => {
          const isActive = currentStatus === status;

          return (
            <button
              key={status}
              onClick={() => updateQuery("status", status)}
              aria-pressed={isActive}
              className={`px-4 py-2 rounded-full text-sm border transition
                ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-admin-chip-bg border-admin-chip-border hover:bg-admin-control-bg"
                }
                hover:cursor-pointer
              `}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          );
        })}
        </div>
        <p className="mt-3 text-xs text-foreground/60">
          Showing {inquiries.length} of {meta.total} inquiries.
        </p>
      </div>

      {/* Empty State */}
      {inquiries.length === 0 ? (
        <div className="card p-6 text-center text-sm text-foreground/60">
          No submissions found
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <InquiryCard key={inq._id} inquiry={inq} />
            ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex justify-center pt-4" aria-label="Inquiry pagination">
              <div className="flex flex-wrap items-center justify-center gap-1">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  aria-label="Go to first page"
                  className="px-3 py-2 border border-border rounded-lg transition hover:bg-surface-muted disabled:opacity-40"
                >
                  «
                </button>

                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Go to previous page"
                  className="px-3 py-2 border border-border rounded-lg transition hover:bg-surface-muted disabled:opacity-40"
                >
                  ‹
                </button>

                {pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    aria-current={p === currentPage ? "page" : undefined}
                    aria-label={`Go to page ${p}`}
                    className={`px-4 py-2 rounded-lg border transition
                      ${
                        p === currentPage
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-surface-muted"
                      }
                    `}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Go to next page"
                  className="px-3 py-2 border border-border rounded-lg transition hover:bg-surface-muted disabled:opacity-40"
                >
                  ›
                </button>

                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Go to last page"
                  className="px-3 py-2 border border-border rounded-lg transition hover:bg-surface-muted disabled:opacity-40"
                >
                  »
                </button>
              </div>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}