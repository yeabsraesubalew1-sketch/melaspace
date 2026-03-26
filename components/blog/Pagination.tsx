"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  page: number;
  totalPages: number;
  basePath?: string;
}

export default function Pagination({
  page,
  totalPages,
  basePath = "/blogs",
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function goTo(newPage: number) {
    const newParams = new URLSearchParams(params.toString());
    newParams.set("page", String(newPage));

    router.push(`${basePath}?${newParams.toString()}`);
  }

  // create page window
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center mt-12" aria-label="Pagination">
      <div className="flex items-center gap-1">

        {/* First */}
        <button
          onClick={() => goTo(1)}
          disabled={page === 1}
          aria-label="Go to first page"
          title="First page"
          className="px-3 py-2 border border-border rounded-lg transition hover:bg-surface-muted disabled:opacity-40"
        >
          «
        </button>

        {/* Previous */}
        <button
          onClick={() => goTo(page - 1)}
          disabled={page === 1}
          aria-label="Go to previous page"
          title="Previous page"
          className="px-3 py-2 border border-border rounded-lg transition hover:bg-surface-muted disabled:opacity-40"
        >
          ‹
        </button>

        {/* Page numbers */}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goTo(p)}
            aria-label={`Go to page ${p}`}
            aria-current={p === page ? "page" : undefined}
            title={`Page ${p}`}
            className={`px-4 py-2 rounded-lg border transition
              ${
                p === page
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-surface-muted"
              }`}
          >
            {p}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => goTo(page + 1)}
          disabled={page === totalPages}
          aria-label="Go to next page"
          title="Next page"
          className="px-3 py-2 border border-border rounded-lg transition hover:bg-surface-muted disabled:opacity-40"
        >
          ›
        </button>

        {/* Last */}
        <button
          onClick={() => goTo(totalPages)}
          disabled={page === totalPages}
          aria-label="Go to last page"
          title="Last page"
          className="px-3 py-2 border border-border rounded-lg transition hover:bg-surface-muted disabled:opacity-40"
        >
          »
        </button>

      </div>
    </nav>
  );
}