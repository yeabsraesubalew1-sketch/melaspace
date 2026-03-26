export default function BlogDetailLoading() {
  return (
    <main className="px-4 sm:px-6 py-16 sm:py-20 animate-pulse">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <aside className="order-2 w-full lg:order-1 lg:w-72">
            <div className="rounded-xl border border-border bg-surface/70 p-4 space-y-3">
              <div className="h-4 w-28 rounded bg-surface-muted" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 w-full rounded bg-surface-muted" />
              ))}
            </div>
          </aside>

          <article className="order-1 min-w-0 flex-1 max-w-3xl space-y-6 lg:order-2">
            <div className="h-12 w-4/5 rounded bg-surface-muted" />
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-7 w-20 rounded-full bg-surface-muted" />
              ))}
            </div>
            <div className="h-4 w-48 rounded bg-surface-muted" />
            <div className="h-px w-full bg-border" />
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-surface-muted" />
              ))}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
