export default function BlogsLoading() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32 space-y-10">
      {/* Editorial Header Skeleton */}
      <div className="space-y-4 max-w-3xl">
        <div className="h-6 w-36 rounded-full bg-surface-muted" />
        <div className="h-10 sm:h-14 w-4/5 rounded-xl bg-surface-muted" />
        <div className="space-y-2 max-w-2xl">
          <div className="h-4 w-full rounded bg-surface-muted/60" />
          <div className="h-4 w-4/5 rounded bg-surface-muted/60" />
        </div>
      </div>

      {/* Search Input Skeleton */}
      <div className="h-11 w-full rounded-xl bg-surface-muted/70" />

      {/* Category Pills Skeleton */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-8 w-24 rounded-full bg-surface-muted" />
        ))}
      </div>

      {/* Featured Spotlight Card Skeleton */}
      <div className="rounded-3xl border border-border/80 bg-surface/40 p-6 sm:p-8 flex flex-col md:flex-row gap-6">
        <div className="h-52 md:h-72 w-full md:w-1/2 rounded-2xl bg-surface-muted shrink-0" />
        <div className="flex-1 space-y-4 py-2">
          <div className="h-5 w-28 rounded-full bg-surface-muted" />
          <div className="h-8 w-4/5 rounded bg-surface-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-surface-muted/60" />
            <div className="h-4 w-full rounded bg-surface-muted/60" />
            <div className="h-4 w-3/4 rounded bg-surface-muted/60" />
          </div>
          <div className="pt-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-surface-muted" />
            <div className="h-4 w-32 rounded bg-surface-muted" />
          </div>
        </div>
      </div>

      {/* Grid of Articles Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border/80 bg-background/80 p-5 space-y-4"
          >
            <div className="h-44 w-full rounded-xl bg-surface-muted" />
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-surface-muted" />
              <div className="h-6 w-4/5 rounded bg-surface-muted" />
              <div className="h-3.5 w-full rounded bg-surface-muted/60" />
            </div>
            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-surface-muted/50" />
              <div className="h-3 w-16 rounded bg-surface-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
