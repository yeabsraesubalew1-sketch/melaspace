export default function AdminDashboardLoading() {
  return (
    <div className="space-y-7 animate-pulse">
      <header className="space-y-2">
        <div className="h-8 w-64 rounded bg-surface-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-surface-muted" />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`metric-${index}`}
            className="rounded-xl border border-border bg-background/85 p-5"
          >
            <div className="h-4 w-28 rounded bg-surface-muted" />
            <div className="mt-3 h-9 w-16 rounded bg-surface-muted" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`pipeline-${index}`}
            className="rounded-xl border border-border bg-background/85 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-6 w-40 rounded bg-surface-muted" />
                <div className="h-4 w-52 max-w-full rounded bg-surface-muted" />
              </div>
              <div className="h-8 w-14 rounded bg-surface-muted" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((__, statIndex) => (
                <div
                  key={`stat-${index}-${statIndex}`}
                  className="rounded-lg border border-border bg-surface-muted/60 p-3"
                >
                  <div className="h-3 w-16 rounded bg-surface-muted" />
                  <div className="mt-2 h-6 w-10 rounded bg-surface-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
