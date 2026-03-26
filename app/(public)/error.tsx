"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PublicError({
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
        path: typeof window !== "undefined" ? window.location.pathname : "/",
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        source: "public",
      }),
    }).catch(() => {
      // silent by requirement
    });
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-foreground/60">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-semibold">We hit an unexpected issue</h1>
      <p className="mt-3 text-foreground/70">
        Please try again, or return to the home page.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Back home
        </Link>
      </div>
    </main>
  );
}
