export default function PublicLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center pt-24 sm:pt-32 pb-20 px-4 animate-pulse">
      <div className="flex flex-col items-center space-y-6 text-center max-w-sm">
        {/* Unfolding Sprout Brand Mark with Breathing Animation */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-surface/60 shadow-xs backdrop-blur-xs">
          <div className="absolute inset-0 rounded-2xl bg-accent/15 animate-ping opacity-25" />
          <svg viewBox="0 0 32 32" fill="none" className="h-9 w-9 text-foreground" aria-hidden="true">
            <path d="M16 26V13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <path
              d="M16 19C11.5 19 8 15.5 8 11C12.5 11 16 14.5 16 19Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              opacity="0.5"
            />
            <path
              d="M16 16C20.5 16 24 12.5 24 8C19.5 8 16 11.5 16 16Z"
              stroke="hsl(var(--accent))"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Brand Text */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Mela Space
            </span>
            <span className="text-xs font-amharic text-accent/70 font-medium select-none">
              መላ
            </span>
          </div>
          <p className="text-xs text-foreground/50">
            A step towards clarity...
          </p>
        </div>

        {/* Gentle Pulse Bar */}
        <div className="w-40 h-1 rounded-full bg-surface-muted overflow-hidden">
          <div className="h-full w-2/3 bg-accent/70 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
