export default function AdminProposalsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-xl bg-surface-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-surface-muted/60" />
      </div>

      {/* Status Filter Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-surface-muted" />
        ))}
      </div>

      {/* Proposals List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/80 bg-background/80 p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-20 rounded-full bg-surface-muted" />
                  <div className="h-4 w-28 rounded bg-surface-muted/60" />
                </div>
                <div className="h-6 w-3/4 rounded bg-surface-muted" />
                <div className="h-4 w-full rounded bg-surface-muted/60" />
              </div>
              <div className="h-9 w-28 rounded-xl bg-surface-muted shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
