"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import type { CommentItemData } from "./CommentTypes";

interface CommentInputProps {
  blogSlug: string;
  parentId?: string | null;
  replyToUserId?: string;
  replyToUserName?: string;
  onCommentCreated: (comment: CommentItemData) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

export default function CommentInput({
  blogSlug,
  parentId,
  replyToUserId,
  replyToUserName,
  onCommentCreated,
  onCancel,
  autoFocus = false,
  placeholder,
  className = "",
}: CommentInputProps) {
  const { data: session, status } = useSession();
  const [content, setContent] = useState("");
  const [asMelaTeam, setAsMelaTeam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isUserAdmin =
    session?.user?.role === "root_admin" || session?.user?.role === "super_admin";

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Handle unauthenticated state
  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className={`rounded-xl border border-border/70 bg-surface-muted/30 p-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
        <div>
          <h4 className="font-semibold text-sm sm:text-base text-foreground">
            Join the conversation
          </h4>
          <p className="text-xs sm:text-sm text-foreground/60 mt-0.5">
            Sign in to share your thoughts, ask questions, or reply.
          </p>
        </div>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all shrink-0 cursor-pointer"
        >
          Sign in to Comment
        </Link>
      </div>
    );
  }

  const defaultPlaceholder = parentId
    ? `Reply to ${replyToUserName ? `@${replyToUserName}` : "this comment"}...`
    : "What are your thoughts on this article?";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed || trimmed.length < 2) {
      toast.error("Comment must be at least 2 characters long.");
      return;
    }

    if (trimmed.length > 1500) {
      toast.error("Comment cannot exceed 1,500 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(blogSlug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          parentId: parentId || undefined,
          replyToUserId: replyToUserId || undefined,
          replyToUserName: replyToUserName || undefined,
          asMelaTeam: isUserAdmin ? asMelaTeam : false,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to post comment.");
        return;
      }

      setContent("");
      toast.success(parentId ? "Reply posted!" : "Comment posted!");
      onCommentCreated(data.data.comment);

      if (onCancel) {
        onCancel();
      }
    } catch {
      toast.error("Network error while submitting comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border border-border/80 bg-surface-muted/20 p-4 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* User Avatar or Mela Team Badge */}
        {asMelaTeam ? (
          <div
            className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-xs shrink-0 select-none"
            title="Posting as Mela Team"
          >
            M
          </div>
        ) : (
          <DefaultAvatar
            name={session.user.name || "User"}
            size="sm"
            className="shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Header indicator */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-foreground/80 truncate">
              {asMelaTeam ? (
                <span className="inline-flex items-center gap-1 text-primary font-semibold">
                  Mela Team
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[10px]">
                    ✓
                  </span>
                </span>
              ) : (
                session.user.name || "Explorer"
              )}
            </span>

            {/* Admin Mela Team Toggle */}
            {isUserAdmin && (
              <label className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={asMelaTeam}
                  onChange={(e) => setAsMelaTeam(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/30 h-3.5 w-3.5 cursor-pointer accent-primary"
                />
                <span className="text-[11px] font-medium">Post as Mela Team</span>
              </label>
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={parentId ? 2 : 3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder || defaultPlaceholder}
            maxLength={1500}
            disabled={isSubmitting}
            className="w-full resize-y rounded-lg border border-border/50 bg-background/60 p-2.5 text-xs sm:text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary/30 transition-all"
          />

          {/* Action Row */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={`text-[11px] tabular-nums ${
                content.length > 1400 ? "text-amber-500 font-semibold" : "text-foreground/40"
              }`}
            >
              {content.length}/1,500
            </span>

            <div className="flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || content.trim().length < 2}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-current"
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
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>{parentId ? "Post Reply" : "Post Comment"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
