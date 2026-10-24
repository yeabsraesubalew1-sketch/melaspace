export default function ServicesLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-20 pt-24 sm:pt-28 pb-20 px-4 sm:px-6 animate-pulse">
      {/* Header Skeleton */}
      <section className="text-center space-y-4 max-w-3xl mx-auto flex flex-col items-center">
        <div className="h-6 w-36 rounded-full bg-surface-muted" />
        <div className="h-10 sm:h-14 w-3/4 sm:w-2/3 rounded-xl bg-surface-muted" />
        <div className="space-y-2 w-full max-w-xl">
          <div className="h-4 w-full rounded bg-surface-muted/60" />
          <div className="h-4 w-4/5 mx-auto rounded bg-surface-muted/60" />
        </div>
      </section>

      {/* 3 Services Cards Skeleton */}
      <section className="grid gap-8 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-background/80 p-6 sm:p-8 space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-28 rounded-full bg-surface-muted" />
                {i === 0 && <div className="h-5 w-20 rounded-full bg-accent/20" />}
              </div>

              <div className="h-7 w-3/4 rounded bg-surface-muted" />
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-surface-muted/60" />
                <div className="h-3.5 w-5/6 rounded bg-surface-muted/60" />
              </div>

              <div className="pt-4 border-t border-border/50 space-y-2.5">
                <div className="h-3 w-24 rounded bg-surface-muted" />
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-surface-muted shrink-0" />
                    <div className="h-3 w-full rounded bg-surface-muted/60" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="h-11 w-full rounded-xl bg-surface-muted" />
            </div>
          </div>
        ))}
      </section>

      {/* 3-Step Journey Roadmap Skeleton */}
      <section className="rounded-3xl border border-border/80 bg-surface/40 p-8 sm:p-12 space-y-8">
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="h-4 w-32 rounded bg-surface-muted" />
          <div className="h-8 w-64 rounded bg-surface-muted" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-background/70 p-6 space-y-3">
              <div className="h-8 w-8 rounded-full bg-surface-muted" />
              <div className="h-5 w-36 rounded bg-surface-muted" />
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-surface-muted/60" />
                <div className="h-3 w-4/5 rounded bg-surface-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Skeleton */}
      <section className="max-w-3xl mx-auto space-y-4">
        <div className="h-7 w-48 rounded bg-surface-muted mx-auto" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl border border-border/70 bg-surface/30" />
        ))}
      </section>
    </div>
  );
}
