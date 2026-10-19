"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  slug: string;
}

export default function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    if (!slug) return;

    try {
      const storageKey = `mela_viewed_${slug}`;
      const alreadyViewed = sessionStorage.getItem(storageKey);

      if (!alreadyViewed) {
        sessionStorage.setItem(storageKey, "1");
        fetch(`/api/blogs/${encodeURIComponent(slug)}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch(() => {
          // Silent catch for background metric
        });
      }
    } catch {
      // Ignore private browsing sessionStorage restrictions
    }
  }, [slug]);

  return null;
}
