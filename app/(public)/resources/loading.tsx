export default function ResourcesLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 animate-pulse">
      {/* Header Hero Skeleton */}
      <section className="text-center space-y-4 max-w-3xl mx-auto flex flex-col items-center">
        <div className="h-6 w-44 rounded-full bg-surface-muted" />
        <div className="h-10 sm:h-12 w-64 sm:w-80 rounded-xl bg-surface-muted" />
        <div className="space-y-2 w-full max-w-xl">
          <div className="h-4 w-full rounded bg-surface-muted" />
          <div className="h-4 w-4/5 mx-auto rounded bg-surface-muted" />
        </div>
      </section>

      {/* Filter & Search Bar Skeleton */}
      <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/40 p-4 sm:p-6 backdrop-blur-xs">
        {/* Search input placeholder */}
        <div className="h-11 w-full rounded-xl bg-background border border-border/70" />

        {/* Filter pills row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="h-4 w-16 rounded bg-surface-muted hidden sm:inline-block mr-1" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 w-24 rounded-full bg-surface-muted" />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-lg bg-surface-muted/60" />
            ))}
          </div>
        </div>
      </div>

      {/* Results Count Placeholder */}
      <div className="flex items-center justify-between px-1">
        <div className="h-4 w-36 rounded bg-surface-muted" />
      </div>

      {/* Grid of 6 Resource Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-background/80 p-5 sm:p-6 space-y-5"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-surface-muted" />
                <div className="h-5 w-16 rounded-md bg-surface-muted" />
              </div>

              {/* Cover Image Placeholder */}
              <div className="h-36 w-full rounded-xl bg-surface-muted/70" />

              {/* Title & Excerpt */}
              <div className="h-6 w-4/5 rounded bg-surface-muted" />
              <div className="space-y-1.5 pt-1">
                <div className="h-3.5 w-full rounded bg-surface-muted/60" />
                <div className="h-3.5 w-5/6 rounded bg-surface-muted/60" />
              </div>
            </div>

            {/* Bottom Download Button Placeholder */}
            <div className="pt-4 border-t border-border/40">
              <div className="h-9 w-full rounded-xl bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
