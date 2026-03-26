export default function AdminBlogsLoading() {
  return (
    <main className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded bg-surface-muted" />
          <div className="h-4 w-64 rounded bg-surface-muted" />
        </div>
        <div className="h-10 w-28 rounded bg-surface-muted" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <section
            key={sectionIndex}
            className="space-y-4 rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="h-6 w-32 rounded bg-surface-muted" />
              <div className="h-4 w-20 rounded bg-surface-muted" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((__, cardIndex) => (
                <div
                  key={`${sectionIndex}-${cardIndex}`}
                  className="h-56 rounded-xl border border-border bg-surface-muted"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
