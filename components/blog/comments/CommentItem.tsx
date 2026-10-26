"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import CommentInput from "./CommentInput";
import type { CommentItemData } from "./CommentTypes";

interface CommentItemProps {
  comment: CommentItemData;
  blogSlug: string;
  onCommentDeleted: (id: string, isSoftDeleted: boolean) => void;
  onCommentPinned?: (id: string, isPinned: boolean) => void;
  isReply?: boolean;
}

function formatTimeAgo(dateInput: string | Date): string {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) return "just now";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

export default function CommentItem({
  comment,
  blogSlug,
  onCommentDeleted,
  onCommentPinned,
  isReply = false,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(comment.hasLiked || false);
  const [isLiking, setIsLiking] = useState(false);

  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<CommentItemData[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [replyCount, setReplyCount] = useState(comment.replyCount || 0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);

  // Toggle Like atomically
  const handleToggleLike = async () => {
    if (!session || !session.user) {
      toast("Please sign in to like comments", { icon: "❤️" });
      return;
    }

    if (isLiking || comment.isDeleted) return;

    // Optimistic UI update
    const prevLiked = hasLiked;
    const prevCount = likesCount;

    setHasLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsLiking(true);

    try {
      const res = await fetch(
        `/api/blogs/${encodeURIComponent(blogSlug)}/comments/${comment.id}/like`,
        { method: "POST" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        // Rollback
        setHasLiked(prevLiked);
        setLikesCount(prevCount);
        toast.error(data.error || "Failed to update like.");
        return;
      }

      setHasLiked(data.data.hasLiked);
      setLikesCount(data.data.likesCount);
    } catch {
      setHasLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error("Network error.");
    } finally {
      setIsLiking(false);
    }
  };

  // Toggle Pin (Admins only)
  const handleTogglePin = async () => {
    if (isPinning || !onCommentPinned) return;
    setIsPinning(true);

    try {
      const res = await fetch(
        `/api/blogs/${encodeURIComponent(blogSlug)}/comments/${comment.id}/pin`,
        { method: "PATCH" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update pinned status.");
        return;
      }

      toast.success(data.data.message);
      onCommentPinned(comment.id, data.data.isPinned);
    } catch {
      toast.error("Network error while pinning comment.");
    } finally {
      setIsPinning(false);
    }
  };

  // Delete or take down comment
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/blogs/${encodeURIComponent(blogSlug)}/comments/${comment.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to take down comment.");
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }

      toast.success(data.data.message || "Comment removed.");
      setShowDeleteConfirm(false);
      onCommentDeleted(comment.id, data.data.isSoftDeleted);
    } catch {
      toast.error("Network error while removing comment.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch replies on expand
  const handleToggleShowReplies = async () => {
    const nextState = !showReplies;
    setShowReplies(nextState);

    if (nextState && !repliesLoaded) {
      setIsLoadingReplies(true);
      try {
        const res = await fetch(
          `/api/blogs/${encodeURIComponent(blogSlug)}/comments?parentId=${comment.id}`
        );
        const data = await res.json();

        if (res.ok && data.success) {
          setReplies(data.data.comments);
          setRepliesLoaded(true);
        } else {
          toast.error("Failed to load replies.");
        }
      } catch {
        toast.error("Network error while loading replies.");
      } finally {
        setIsLoadingReplies(false);
      }
    }
  };

  // Handle new reply added to this thread
  const handleReplyCreated = (newReply: CommentItemData) => {
    setReplies((prev) => [...prev, newReply]);
    setReplyCount((prev) => prev + 1);
    setShowReplies(true);
    setRepliesLoaded(true);
    setIsReplying(false);
  };

  // Handle deletion of a child reply
  const handleChildReplyDeleted = (childId: string) => {
    setReplies((prev) => prev.filter((r) => r.id !== childId));
    setReplyCount((prev) => Math.max(0, prev - 1));
  };

  const isMelaTeam = Boolean(comment.author?.isMelaTeam);
  const isDeleted = Boolean(comment.isDeleted);

  return (
    <div
      className={`relative group rounded-xl transition-colors ${
        isReply
          ? "pt-3 pb-1"
          : comment.isPinned
          ? "border border-primary/30 bg-primary/5 p-4 sm:p-5"
          : "border border-border/60 bg-surface-muted/20 p-4 sm:p-5 hover:border-border"
      }`}
    >
      {/* Pinned header badge */}
      {comment.isPinned && !isReply && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" />
          </svg>
          <span>Pinned by Mela Team</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        {isDeleted ? (
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-surface-muted border border-border flex items-center justify-center text-foreground/40 shrink-0 select-none">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        ) : isMelaTeam ? (
          <div
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm shadow-xs shrink-0 select-none ring-2 ring-primary/20"
            title="Verified Mela Team"
          >
            M
          </div>
        ) : (
          <DefaultAvatar
            name={comment.author?.name}
            size={isReply ? "sm" : "md"}
            className="shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Header Row: Author Name, Badges, Timestamp */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              {isDeleted ? (
                <span className="text-foreground/50 italic">[Deleted]</span>
              ) : isMelaTeam ? (
                <span className="inline-flex items-center gap-1 font-bold text-foreground">
                  Mela Team
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.2 text-[10px] font-semibold border border-primary/25"
                    title="Verified Mela Space Staff"
                  >
                    Staff ✓
                  </span>
                </span>
              ) : (
                <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                  {comment.author?.name || "Explorer"}
                </span>
              )}

              {/* Author Badges */}
              {!isDeleted && !isMelaTeam && comment.author?.isBlogAuthor && (
                <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-1.5 py-0.2 text-[10px] font-semibold">
                  Author
                </span>
              )}

              {!isDeleted &&
                !isMelaTeam &&
                (comment.author?.role === "root_admin" ||
                  comment.author?.role === "super_admin") && (
                  <span className="rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 px-1.5 py-0.2 text-[10px] font-semibold">
                    Admin
                  </span>
                )}
            </div>

            <span className="text-foreground/30">•</span>

            <span className="text-foreground/50 text-[11px] tabular-nums" title={String(comment.createdAt)}>
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Comment Body */}
          <div className="mt-1.5 text-xs sm:text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap">
            {isDeleted ? (
              <span className="italic text-foreground/50">{comment.content}</span>
            ) : (
              <>
                {comment.replyTo?.name && (
                  <span className="font-semibold text-primary mr-1.5 select-none">
                    @{comment.replyTo.name}
                  </span>
                )}
                {comment.content}
              </>
            )}
          </div>

          {/* Action Row */}
          {!isDeleted && (
            <div className="mt-2.5 flex items-center flex-wrap gap-3 sm:gap-4 text-xs select-none">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={isLiking}
                title={hasLiked ? "Unlike" : "Like"}
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors cursor-pointer ${
                  hasLiked
                    ? "text-rose-500 font-semibold"
                    : "text-foreground/60 hover:text-rose-500"
                }`}
              >
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    hasLiked ? "scale-110 fill-current" : "fill-none"
                  }`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={hasLiked ? "0" : "2"}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span className="text-[11px] tabular-nums">
                  {likesCount > 0 ? likesCount : "Like"}
                </span>
              </button>

              {/* Reply Button */}
              <button
                type="button"
                onClick={() => setIsReplying(!isReplying)}
                className="inline-flex items-center gap-1 text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                <span>Reply</span>
              </button>

              {/* Pin Button (Top-level only, Admin only) */}
              {comment.canPin && !isReply && (
                <button
                  type="button"
                  onClick={handleTogglePin}
                  disabled={isPinning}
                  className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                    comment.isPinned
                      ? "text-primary font-medium"
                      : "text-foreground/50 hover:text-primary"
                  }`}
                  title={comment.isPinned ? "Unpin comment" : "Pin comment to top"}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" />
                  </svg>
                  <span>{comment.isPinned ? "Unpin" : "Pin"}</span>
                </button>
              )}

              {/* Takedown / Delete Button */}
              {comment.canDelete && (
                <div className="relative">
                  {showDeleteConfirm ? (
                    <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-500 rounded-md px-2 py-0.5 border border-rose-500/20">
                      <span className="text-[11px]">Confirm removal?</span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="font-bold hover:underline cursor-pointer"
                      >
                        {isDeleting ? "..." : "Yes"}
                      </button>
                      <span className="text-foreground/30">/</span>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-foreground/60 hover:underline cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-foreground/40 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Take down or delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inline Reply Input */}
          {isReplying && (
            <div className="mt-3">
              <CommentInput
                blogSlug={blogSlug}
                parentId={comment.parentId || comment.id}
                replyToUserId={comment.author?.id}
                replyToUserName={
                  isMelaTeam ? "Mela Team" : comment.author?.name
                }
                autoFocus
                onCommentCreated={handleReplyCreated}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {/* Child Replies Section (Level 1 Nesting with Thread Guide) */}
          {!isReply && replyCount > 0 && (
            <div className="mt-3">
              {/* Toggle replies view */}
              <button
                type="button"
                onClick={handleToggleShowReplies}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1 cursor-pointer"
              >
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    showReplies ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span>
                  {showReplies
                    ? `Hide ${replyCount === 1 ? "reply" : "replies"}`
                    : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
                </span>
              </button>

              {/* Replies Container with Thread Line */}
              {showReplies && (
                <div className="mt-2 pl-3 sm:pl-4 border-l-2 border-border/70 space-y-3">
                  {isLoadingReplies ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-foreground/50">
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
                      <span>Loading replies...</span>
                    </div>
                  ) : (
                    replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        blogSlug={blogSlug}
                        onCommentDeleted={handleChildReplyDeleted}
                        isReply={true}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
