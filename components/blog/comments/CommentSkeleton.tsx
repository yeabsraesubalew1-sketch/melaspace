import React from "react";

export function CommentSkeletonItem() {
  return (
    <div className="flex gap-3 sm:gap-4 p-4 rounded-xl border border-border/50 bg-surface-muted/20 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-surface-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 rounded bg-surface-muted" />
          <div className="h-3 w-16 rounded bg-surface-muted" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded bg-surface-muted" />
          <div className="h-3.5 w-4/5 rounded bg-surface-muted" />
        </div>
        <div className="flex items-center gap-4 pt-1">
          <div className="h-5 w-12 rounded bg-surface-muted" />
          <div className="h-5 w-14 rounded bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}

export default function CommentSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeletonItem key={i} />
      ))}
    </div>
  );
}
