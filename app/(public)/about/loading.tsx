export default function AboutLoading() {
  return (
    <div className="max-w-4xl mx-auto pt-24 sm:pt-28 pb-20 px-4 sm:px-6 space-y-16 animate-pulse">
      {/* Hero Header Skeleton */}
      <section className="space-y-4">
        <div className="h-6 w-36 rounded-full bg-surface-muted" />
        <div className="h-10 sm:h-14 w-3/4 rounded-xl bg-surface-muted" />
        <div className="space-y-2 max-w-2xl">
          <div className="h-5 w-full rounded bg-surface-muted/70" />
          <div className="h-5 w-4/5 rounded bg-surface-muted/70" />
        </div>
      </section>

      {/* Founder Profile Block Skeleton */}
      <section className="rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-10 backdrop-blur-xs space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-surface-muted shrink-0" />
          <div className="space-y-3 w-full text-center sm:text-left">
            <div className="h-7 w-48 sm:w-64 rounded bg-surface-muted mx-auto sm:mx-0" />
            <div className="h-4 w-40 rounded bg-surface-muted/60 mx-auto sm:mx-0" />
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
              <div className="h-6 w-28 rounded-full bg-surface-muted/60" />
              <div className="h-6 w-32 rounded-full bg-surface-muted/60" />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border/50 pt-6">
          <div className="h-4 w-full rounded bg-surface-muted/60" />
          <div className="h-4 w-full rounded bg-surface-muted/60" />
          <div className="h-4 w-5/6 rounded bg-surface-muted/60" />
        </div>
      </section>

      {/* Core Values Grid Skeleton */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-surface-muted" />
          <div className="h-8 w-60 rounded bg-surface-muted" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/70 bg-surface/30 p-6 space-y-3"
            >
              <div className="h-8 w-8 rounded-lg bg-surface-muted" />
              <div className="h-5 w-40 rounded bg-surface-muted" />
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-surface-muted/60" />
                <div className="h-3.5 w-4/5 rounded bg-surface-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
