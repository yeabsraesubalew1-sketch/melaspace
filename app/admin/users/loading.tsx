export default function AdminUsersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl bg-surface-muted" />
          <div className="h-4 w-72 max-w-full rounded bg-surface-muted/60" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-10 rounded-xl bg-surface-muted/70" />
        <div className="h-10 rounded-xl bg-surface-muted/70" />
        <div className="h-10 rounded-xl bg-surface-muted/70" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-border/80 bg-background/80 overflow-hidden">
        <div className="h-12 bg-surface/50 border-b border-border/60 px-6 flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-surface-muted" />
          <div className="h-4 w-20 rounded bg-surface-muted" />
          <div className="h-4 w-24 rounded bg-surface-muted hidden sm:block" />
        </div>
        <div className="divide-y divide-border/40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-surface-muted shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-surface-muted" />
                  <div className="h-3 w-48 rounded bg-surface-muted/60" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-surface-muted" />
              <div className="h-8 w-24 rounded-lg bg-surface-muted hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
