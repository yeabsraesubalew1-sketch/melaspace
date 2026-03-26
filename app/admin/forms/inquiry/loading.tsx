export default function AdminInquiryLoading() {
  return (
    <main className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded bg-surface-muted" />
        <div className="h-4 w-72 rounded bg-surface-muted" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-9 w-24 rounded-full border border-border bg-surface-muted"
          />
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-44 rounded-xl border border-border bg-surface-muted"
          />
        ))}
      </div>
    </main>
  );
}
