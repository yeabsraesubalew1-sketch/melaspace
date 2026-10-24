export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 animate-pulse">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background/90 p-7 shadow-lg backdrop-blur-md space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded-lg bg-surface-muted" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full rounded bg-surface-muted/60" />
            <div className="h-3.5 w-4/5 rounded bg-surface-muted/60" />
          </div>
        </div>

        <div className="h-11 w-full rounded-xl bg-surface-muted" />
      </div>
    </div>
  );
}
