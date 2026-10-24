export default function AdminResourcesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-60 rounded-xl bg-surface-muted" />
          <div className="h-4 w-80 max-w-full rounded bg-surface-muted/60" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-surface-muted shrink-0" />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-lg bg-surface-muted" />
          ))}
        </div>
        <div className="h-10 w-full sm:w-64 rounded-xl bg-surface-muted/70" />
      </div>

      {/* Resource Table / Grid Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/80 bg-background/80 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-surface-muted" />
              <div className="h-5 w-16 rounded-full bg-surface-muted" />
            </div>
            <div className="h-5 w-4/5 rounded bg-surface-muted" />
            <div className="h-3.5 w-full rounded bg-surface-muted/60" />
            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-surface-muted/50" />
              <div className="h-7 w-16 rounded-lg bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
