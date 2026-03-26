"use client";

import { useEffect } from "react";

export default function GlobalError({
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
        source: "global",
      }),
    }).catch(() => {
      // silent by requirement
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <p className="text-sm uppercase tracking-wide text-foreground/60">Critical failure</p>
          <h1 className="mt-3 text-3xl font-semibold">The app ran into a major issue</h1>
          <p className="mt-3 text-foreground/70">Please refresh or try again shortly.</p>
          <button type="button" className="btn btn-primary mt-8" onClick={reset}>
            Reload app
          </button>
        </main>
      </body>
    </html>
  );
}
