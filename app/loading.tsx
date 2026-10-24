export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center space-y-5 text-center max-w-sm">
        {/* Unfolding Sprout Brand Breathing Indicator */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-surface/60 shadow-xs backdrop-blur-xs">
          <div className="absolute inset-0 rounded-2xl bg-accent/10 animate-ping opacity-25" />
          <svg viewBox="0 0 32 32" fill="none" className="h-9 w-9 text-foreground animate-pulse" aria-hidden="true">
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

        {/* Brand Text & Loading Bar */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-base font-semibold tracking-tight text-foreground">
              Mela Space
            </span>
            <span className="text-[11px] font-amharic text-accent/70 font-medium select-none">
              መላ
            </span>
          </div>
          <p className="text-xs text-foreground/50">
            A step towards clarity...
          </p>
        </div>

        {/* Minimal continuous progress bar */}
        <div className="w-44 h-1 rounded-full bg-surface-muted overflow-hidden">
          <div className="h-full w-2/3 bg-accent/70 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
