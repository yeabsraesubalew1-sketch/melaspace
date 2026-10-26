"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import CommentInput from "./CommentInput";
import CommentItem from "./CommentItem";
import CommentSkeletonList from "./CommentSkeleton";
import type { CommentItemData, CommentPagination } from "./CommentTypes";

interface CommentSectionProps {
  blogSlug: string;
  initialCommentsCount?: number;
}

export default function CommentSection({
  blogSlug,
  initialCommentsCount = 0,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItemData[]>([]);
  const [sort, setSort] = useState<"newest" | "top">("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<CommentPagination | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(initialCommentsCount);

  // Load comments
  const fetchComments = useCallback(
    async (targetPage = 1, targetSort = sort, append = false) => {
      try {
        if (targetPage === 1) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const res = await fetch(
          `/api/blogs/${encodeURIComponent(blogSlug)}/comments?page=${targetPage}&limit=10&sort=${targetSort}`
        );
        const data = await res.json();

        if (res.ok && data.success) {
          if (append) {
            setComments((prev) => [...prev, ...data.data.comments]);
          } else {
            setComments(data.data.comments);
          }
          setPagination(data.data.pagination);
          setTotalCount(data.data.pagination.total);
          setPage(targetPage);
        } else {
          toast.error(data.error || "Failed to load comments.");
        }
      } catch {
        toast.error("Network error while loading comments.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [blogSlug, sort]
  );

  // Initial fetch and sort changes
  useEffect(() => {
    fetchComments(1, sort, false);
  }, [fetchComments, sort]);

  // Load more pagination
  const handleLoadMore = () => {
    if (!pagination?.hasMore || isLoadingMore) return;
    fetchComments(page + 1, sort, true);
  };

  // Add new comment
  const handleCommentCreated = (newComment: CommentItemData) => {
    setComments((prev) => [newComment, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  // Handle deletion / moderation takedown
  const handleCommentDeleted = (id: string, isSoftDeleted: boolean) => {
    if (isSoftDeleted) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                isDeleted: true,
                content: "This comment was removed by moderation.",
              }
            : c
        )
      );
    } else {
      setComments((prev) => prev.filter((c) => c.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Handle pin toggle
  const handleCommentPinned = (id: string, isPinned: boolean) => {
    setComments((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          return { ...c, isPinned };
        }
        // If one is pinned, unpin others
        return isPinned ? { ...c, isPinned: false } : c;
      });

      // Move pinned comment to top
      if (isPinned) {
        const target = updated.find((c) => c.id === id);
        const rest = updated.filter((c) => c.id !== id);
        return target ? [target, ...rest] : updated;
      }
      return updated;
    });
  };

  return (
    <section className="mt-14 pt-10 border-t border-border space-y-8" id="comments">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Community
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
            Comments
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-foreground/70 border border-border/80">
              {totalCount}
            </span>
          </h2>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-foreground/50">Sort by:</span>
          <div className="inline-flex rounded-lg border border-border bg-surface-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setSort("newest")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                sort === "newest"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSort("top")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                sort === "top"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Top Liked
            </button>
          </div>
        </div>
      </div>

      {/* Main Comment Input */}
      <CommentInput
        blogSlug={blogSlug}
        onCommentCreated={handleCommentCreated}
        placeholder="What are your thoughts on this story?"
      />

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <CommentSkeletonList count={3} />
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-surface-muted/20 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-foreground/40 mb-3">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              No comments yet
            </h4>
            <p className="text-xs text-foreground/60 mt-1 max-w-sm mx-auto">
              Be the first to share your perspective or ask a question about this article.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              blogSlug={blogSlug}
              onCommentDeleted={handleCommentDeleted}
              onCommentPinned={handleCommentPinned}
            />
          ))
        )}

        {/* Load More Button */}
        {pagination?.hasMore && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted/50 px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-muted hover:border-border/80 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Loading comments...</span>
                </>
              ) : (
                <span>
                  Load more comments (
                  {pagination.total - comments.length} remaining)
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
