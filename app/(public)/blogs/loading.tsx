export default function BlogsLoading() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24">
      <div className="space-y-3">
        <div className="h-10 w-40 rounded bg-surface-muted" />
        <div className="h-5 w-72 rounded bg-surface-muted" />
      </div>

      <div className="h-10 w-full rounded-lg bg-surface-muted" />

      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-8 w-20 rounded-full bg-surface-muted" />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-56 rounded-xl border border-border bg-surface-muted" />
        ))}
      </div>
    </main>
  );
}
