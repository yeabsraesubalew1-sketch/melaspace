export default function SingleResourceLoading() {
  return (
    <div className="max-w-6xl mx-auto pt-24 sm:pt-28 pb-20 px-4 sm:px-6 space-y-10 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-12 rounded bg-surface-muted" />
        <span className="text-foreground/30">/</span>
        <div className="h-3.5 w-16 rounded bg-surface-muted" />
        <span className="text-foreground/30">/</span>
        <div className="h-3.5 w-36 rounded bg-surface-muted" />
      </div>

      {/* Header Hero Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-28 rounded-full bg-surface-muted" />
          <div className="h-6 w-36 rounded-full bg-surface-muted" />
        </div>

        <div className="h-10 sm:h-12 w-4/5 sm:w-2/3 rounded-xl bg-surface-muted" />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="h-4 w-32 rounded bg-surface-muted/60" />
          <div className="h-4 w-24 rounded bg-surface-muted/60" />
          <div className="h-4 w-28 rounded bg-surface-muted/60" />
        </div>
      </div>

      {/* Main Grid: Content Left, Download Card Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cover image skeleton */}
          <div className="aspect-16/9 w-full rounded-2xl border border-border/70 bg-surface-muted/80" />

          {/* Overview summary skeleton */}
          <div className="rounded-2xl border border-border/70 bg-surface/40 p-6 space-y-3">
            <div className="h-3 w-20 rounded bg-surface-muted" />
            <div className="h-4 w-full rounded bg-surface-muted/70" />
            <div className="h-4 w-5/6 rounded bg-surface-muted/70" />
          </div>

          {/* About section skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-44 rounded bg-surface-muted" />
            <div className="space-y-2.5">
              <div className="h-4 w-full rounded bg-surface-muted/60" />
              <div className="h-4 w-full rounded bg-surface-muted/60" />
              <div className="h-4 w-4/5 rounded bg-surface-muted/60" />
              <div className="h-4 w-full rounded bg-surface-muted/60" />
              <div className="h-4 w-3/4 rounded bg-surface-muted/60" />
            </div>
          </div>

          {/* Tags skeleton */}
          <div className="pt-4 border-t border-border/60 flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-lg bg-surface-muted" />
            ))}
          </div>
        </div>

        {/* Right Column: Download Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-background/95 p-6 shadow-sm space-y-5">
            <div className="border-b border-border/60 pb-4 space-y-2">
              <div className="h-5 w-40 rounded bg-surface-muted" />
              <div className="h-3 w-56 rounded bg-surface-muted/60" />
            </div>

            {/* File cards in deck */}
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface/50 p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="h-4 w-12 rounded bg-surface-muted" />
                    <div className="h-4 w-48 rounded bg-surface-muted" />
                    <div className="h-3 w-32 rounded bg-surface-muted/60" />
                  </div>
                  <div className="h-9 w-full rounded-xl bg-surface-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
