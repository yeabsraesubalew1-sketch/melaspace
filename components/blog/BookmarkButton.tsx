"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface BookmarkButtonProps {
  blogId: string;
  initialBookmarked?: boolean;
  slug?: string;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function BookmarkButton({
  blogId,
  slug,
  initialBookmarked = false,
  className = "",
  size = "md",
  showLabel = false,
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session || !session.user) {
      toast("Sign in to save this blog to your favorites", {
        icon: "🔖",
      });
      router.push("/login");
      return;
    }

    const previousState = isBookmarked;
    setIsBookmarked(!previousState);
    setIsLoading(true);

    try {
      const identifier = slug || blogId;
      const res = await fetch(`/api/blogs/${encodeURIComponent(identifier)}/bookmark`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsBookmarked(previousState);
        toast.error(data.error || "Failed to update bookmark");
        return;
      }

      setIsBookmarked(data.data.isBookmarked);
      toast.success(data.data.message, {
        icon: data.data.isBookmarked ? "❤️" : "🤍",
      });
    } catch {
      setIsBookmarked(previousState);
      toast.error("Network error while saving blog");
    } finally {
      setIsLoading(false);
    }
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isBookmarked ? "Remove from bookmarks" : "Bookmark this blog"}
      title={isBookmarked ? "Saved in bookmarks" : "Save this blog"}
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
        isBookmarked
          ? "border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-xs"
          : "border-border/80 bg-background/60 text-foreground/70 hover:bg-surface-muted hover:text-foreground"
      } ${
        isSmall ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${className}`}
    >
      <svg
        className={`${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"} transition-transform duration-200 ${
          isBookmarked ? "scale-110 fill-current" : "fill-none"
        }`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isBookmarked ? "0" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {showLabel && (
        <span className="font-medium">
          {isBookmarked ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
