"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/errors/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: typeof window !== "undefined" ? window.location.pathname : "/admin",
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        source: "admin",
      }),
    }).catch(() => {
      // silent by requirement
    });
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-border bg-background/85 p-8 text-center shadow-sm">
      <p className="text-sm uppercase tracking-wide text-foreground/60">Admin Error</p>
      <h1 className="mt-3 text-3xl font-semibold">This admin page failed to load</h1>
      <p className="mt-3 text-foreground/70">
        Try reloading this section or return to the admin dashboard.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Retry
        </button>
        <Link href="/admin" className="btn btn-secondary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
