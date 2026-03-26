export default function AdminBlogPreviewLoading() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 py-8 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-surface-muted" />
          <div className="h-9 w-80 rounded bg-surface-muted" />
        </div>
        <div className="h-10 w-20 rounded bg-surface-muted" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded bg-surface-muted" />
        ))}
      </div>

      <div className="h-4 w-36 rounded bg-surface-muted" />
      <div className="h-5 w-full rounded bg-surface-muted" />
      <div className="h-px w-full bg-border" />

      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-surface-muted" />
        ))}
      </div>
    </main>
  );
}
