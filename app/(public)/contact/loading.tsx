export default function ContactLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 pt-24 sm:pt-32 pb-20 px-4 sm:px-6 animate-pulse">
      {/* Header Skeleton */}
      <section className="text-center space-y-4 max-w-2xl mx-auto flex flex-col items-center">
        <div className="h-6 w-36 rounded-full bg-surface-muted" />
        <div className="h-10 sm:h-14 w-60 sm:w-72 rounded-xl bg-surface-muted" />
        <div className="space-y-2 w-full">
          <div className="h-4 w-full rounded bg-surface-muted/60" />
          <div className="h-4 w-4/5 mx-auto rounded bg-surface-muted/60" />
        </div>
      </section>

      {/* Form Hub Container Skeleton */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tab switcher skeleton */}
        <div className="flex justify-center">
          <div className="h-11 w-64 rounded-xl bg-surface border border-border/70 p-1 flex gap-2">
            <div className="h-full w-1/2 rounded-lg bg-surface-muted" />
            <div className="h-full w-1/2 rounded-lg bg-surface-muted/40" />
          </div>
        </div>

        {/* Card Form Skeleton */}
        <div className="rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-10 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="h-3 w-16 rounded bg-surface-muted" />
              <div className="h-11 w-full rounded-xl bg-background border border-border/60" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 rounded bg-surface-muted" />
              <div className="h-11 w-full rounded-xl bg-background border border-border/60" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-surface-muted" />
            <div className="h-11 w-full rounded-xl bg-background border border-border/60" />
          </div>

          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-surface-muted" />
            <div className="h-28 w-full rounded-xl bg-background border border-border/60" />
          </div>

          <div className="pt-2">
            <div className="h-11 w-full rounded-xl bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
