"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface SavedBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt?: string;
  categories: { _id: string; name: string; slug: string }[];
  authorName?: string;
}

interface BookmarkItem {
  bookmarkId: string;
  savedAt: string;
  blog: SavedBlog;
}

interface SavedPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export default function SavedPostsModal({
  isOpen,
  onClose,
  onCountChange,
}: SavedPostsModalProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/bookmarks");
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const list = json.data.bookmarks || [];
        setBookmarks(list);
        onCountChange?.(list.length);
      }
    } catch (err) {
      console.error("Failed to load saved posts:", err);
      toast.error("Failed to load saved posts");
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchBookmarks();
    }
  }, [isOpen, fetchBookmarks]);

  if (!isOpen) return null;

  const handleRemove = async (slug: string) => {
    setRemovingSlug(slug);
    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/bookmark`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to remove bookmark");
      }

      setBookmarks((prev) => {
        const updated = prev.filter((item) => item.blog.slug !== slug);
        onCountChange?.(updated.length);
        return updated;
      });
      toast.success("Removed from saved posts");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove saved post");
    } finally {
      setRemovingSlug(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted border border-border">
              <svg className="h-4 w-4 text-foreground/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Saved Posts</h2>
              <p className="text-xs text-foreground/60">
                {bookmarks.length === 1 ? "1 saved article" : `${bookmarks.length} saved articles`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-surface-muted hover:text-foreground transition cursor-pointer"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-3">
          {loading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl border border-border bg-surface-muted animate-pulse" />
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-surface-muted/30 p-8 text-center my-4">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-foreground/50 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground/80">No saved articles yet</p>
              <p className="text-xs text-foreground/50 mt-1 max-w-xs mx-auto">
                Articles you bookmark while browsing will appear here for easy access.
              </p>
              <Link
                href="/blogs"
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface-muted transition"
              >
                Browse Articles →
              </Link>
            </div>
          ) : (
            bookmarks.map(({ blog }) => (
              <div
                key={blog.id}
                className="group relative rounded-xl border border-border bg-background p-4 shadow-xs transition hover:border-foreground/30 flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    {blog.categories?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {blog.categories.map((c) => (
                          <span
                            key={c._id}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-surface-muted text-foreground/70 border border-border"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/blogs/${blog.slug}`}
                      onClick={onClose}
                      className="font-semibold text-sm sm:text-base text-foreground leading-snug hover:underline block truncate"
                    >
                      {blog.title}
                    </Link>
                    {blog.excerpt && (
                      <p className="text-xs text-foreground/70 line-clamp-2">
                        {blog.excerpt}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(blog.slug)}
                    disabled={removingSlug === blog.slug}
                    className="shrink-0 p-1.5 rounded-md text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Remove from saved"
                    aria-label={`Remove ${blog.title} from saved`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-foreground/50">
                  <span>{blog.authorName || "Mela Team"}</span>
                  {blog.publishedAt && (
                    <span>
                      {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border mt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium hover:bg-surface-muted transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
