export default function AdminDraftsLoading() {
  return (
    <main className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-36 rounded bg-surface-muted" />
        <div className="h-8 w-44 rounded bg-surface-muted" />
      </div>

      <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
        <div className="h-10 w-full rounded-lg bg-surface-muted" />

        <div className="mt-4 flex gap-2 flex-wrap">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-8 w-20 rounded-full bg-surface-muted" />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 rounded-xl border border-border bg-surface-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
