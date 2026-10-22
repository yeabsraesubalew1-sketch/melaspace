"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { normalizeMediaUrl } from "@/lib/media";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Props {
  blog: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    categories: Category[];
    publishedAt?: string;
    status?: "draft" | "published";
    isPinned?: boolean;
    views?: number;
    authorId?: string;
    authorName?: string;
    featuredImage?: {
      url: string;
      alt?: string;
      caption?: string;
    };
  };
  variant?: "public" | "admin";
  onDelete?: (id: string) => void | Promise<void>;
  isDeleting?: boolean;
}

export default function BlogCard({
  blog,
  variant = "public",
  onDelete,
  isDeleting = false,
}: Props) {
  const { data: session } = useSession();
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const categoriesMeasureRef = useRef<HTMLDivElement>(null);
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(
    blog.categories.length
  );

  const isAdmin = variant === "admin";
  const userRole = session?.user?.role;
  const isTeamPost =
    blog.authorName === "Mela Team" ||
    (Boolean((blog as { isAnonymous?: boolean }).isAnonymous) && blog.authorName !== "Anonymous");
  const canModify =
    !isAdmin ||
    userRole === "root_admin" ||
    (Boolean(blog.authorId) && blog.authorId === session?.user?.id) ||
    (isTeamPost && ["super_admin", "manager"].includes(userRole || ""));
  const hasHiddenCategories = blog.categories.length > visibleCategoryCount;
  const visibleCategories = blog.categories.slice(0, visibleCategoryCount);
  const linkHref = isAdmin
    ? `/admin/blogs/${blog.id}/preview`
    : `/blogs/${blog.slug}`;

  useEffect(() => {
    const updateVisibleCategories = () => {
      const container = categoriesContainerRef.current;
      const measureRoot = categoriesMeasureRef.current;

      if (!container || !measureRoot) return;

      const availableWidth = container.clientWidth;
      const categoryNodes = Array.from(
        measureRoot.querySelectorAll<HTMLElement>("[data-pill='category']")
      );
      const ellipsisNode = measureRoot.querySelector<HTMLElement>(
        "[data-pill='ellipsis']"
      );

      const gap = 8;
      const ellipsisWidth = ellipsisNode?.offsetWidth ?? 0;

      let usedWidth = 0;
      let count = 0;

      for (let index = 0; index < categoryNodes.length; index += 1) {
        const node = categoryNodes[index];
        const nodeWidth = node.offsetWidth;
        const nextUsedWidth = count === 0 ? nodeWidth : usedWidth + gap + nodeWidth;
        const hasRemaining = index < categoryNodes.length - 1;
        const requiredWidth = hasRemaining
          ? nextUsedWidth + gap + ellipsisWidth
          : nextUsedWidth;

        if (requiredWidth <= availableWidth) {
          usedWidth = nextUsedWidth;
          count += 1;
        } else {
          break;
        }
      }

      setVisibleCategoryCount(count);
    };

    const rafId = window.requestAnimationFrame(updateVisibleCategories);
    const resizeObserver = new ResizeObserver(updateVisibleCategories);

    if (categoriesContainerRef.current) {
      resizeObserver.observe(categoriesContainerRef.current);
    }

    window.addEventListener("resize", updateVisibleCategories);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateVisibleCategories);
    };
  }, [blog.categories]);

  const handleDelete = async () => {
    if (!onDelete) return;

    await onDelete(blog.id);
  };

  return (
    <article className={`group relative h-full w-full min-w-0 max-w-full overflow-hidden rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-5 ${
      blog.featuredImage?.url
        ? "border-border/80 text-white min-h-[300px]"
        : "border-border bg-gradient-to-br from-surface-muted/40 via-background to-surface-muted/60 border-t-2 border-t-foreground/20"
    }`}>
      <Link
        href={linkHref}
        className="absolute inset-0 z-10 rounded-xl"
        aria-label={`Open ${blog.title}`}
      />

      {/* When featured image is present: Full-bleed background + multi-stop scrim */}
      {blog.featuredImage?.url ? (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizeMediaUrl(blog.featuredImage.url)}
            alt={blog.featuredImage.alt || blog.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* High-contrast scrim gradient guaranteeing WCAG AAA readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/40" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/30 pointer-events-none" />
        </div>
      ) : (
        /* Subtle editorial watermark for text-only cards to eliminate empty void feeling */
        <div className="absolute right-2 top-3 z-0 pointer-events-none select-none opacity-[0.04] dark:opacity-[0.06] text-foreground transition-opacity duration-300 group-hover:opacity-[0.08]">
          <svg className="h-28 w-28 -rotate-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </div>
      )}

      <div className={`relative z-20 flex h-full flex-col gap-3 pointer-events-none ${
        blog.featuredImage?.url ? "justify-between" : ""
      }`}>
        {/* Category Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div
            ref={categoriesContainerRef}
            className="min-w-0 flex-1 overflow-hidden"
          >
            <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap overflow-hidden">
              {visibleCategories.map((cat) => (
                <span
                  key={cat._id}
                  className={`text-xs px-2 py-1 rounded ${
                    blog.featuredImage?.url
                      ? "bg-white/15 backdrop-blur-md text-white border border-white/20"
                      : "bg-surface-muted text-foreground/80 border border-border/50"
                  }`}
                >
                  {cat.name}
                </span>
              ))}
              {hasHiddenCategories && (
                <span className={`text-xs px-2 py-1 rounded ${
                  blog.featuredImage?.url
                    ? "bg-white/15 backdrop-blur-md text-white border border-white/20"
                    : "bg-surface-muted text-foreground/80 border border-border/50"
                }`}>...</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {blog.isPinned && (
              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium ${
                blog.featuredImage?.url
                  ? "bg-amber-400/25 text-amber-300 border border-amber-400/40 backdrop-blur-md"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
              }`}>
                <svg className="h-3 w-3 fill-amber-400 text-amber-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Featured</span>
              </span>
            )}
            {isAdmin && blog.status && (
              <span
                className={`text-xs px-2 py-1 rounded capitalize ${
                  blog.featuredImage?.url
                    ? "bg-white/20 text-white backdrop-blur-md border border-white/20"
                    : blog.status === "published"
                      ? "bg-foreground/10"
                      : "bg-surface-muted"
                }`}
              >
                {blog.status}
              </span>
            )}
          </div>
        </div>

        {/* Content Layout: Cover Card (bottom aligned) vs Text Card (naturally top/middle aligned) */}
        {blog.featuredImage?.url ? (
          <div className="space-y-2 mt-auto">
            <h2 className={`font-semibold leading-snug group-hover:underline text-white drop-shadow-xs ${
              isAdmin ? "truncate text-xl" : "line-clamp-2 text-lg sm:text-xl"
            }`}>
              {blog.title}
            </h2>

            <p className={`text-sm leading-relaxed text-white/80 ${
              isAdmin ? "truncate" : "line-clamp-2"
            }`}>
              {blog.excerpt}
            </p>

            {blog.publishedAt && (
              <div className="text-xs flex items-center justify-between pt-2 border-t text-white/70 border-white/20">
                <span className="font-medium truncate max-w-[150px] text-white/90">
                  {blog.authorName || "Mela Team"}
                </span>
                <span className="shrink-0">
                  {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Text-only Card: Content sits naturally in the upper/middle area, eliminating the blank void */
          <>
            <div className="space-y-2 mt-1">
              <h2 className={`font-semibold leading-snug group-hover:underline text-foreground ${
                isAdmin ? "truncate text-xl" : "line-clamp-2 text-lg sm:text-xl"
              }`}>
                {blog.title}
              </h2>

              <p className={`text-sm leading-relaxed text-foreground/75 ${
                isAdmin ? "truncate" : "line-clamp-3 sm:line-clamp-4"
              }`}>
                {blog.excerpt}
              </p>
            </div>

            {blog.publishedAt && (
              <div className="text-xs mt-auto flex items-center justify-between text-foreground/60 pt-2.5 border-t border-border/50">
                <span className="font-medium text-foreground/75 truncate max-w-[150px]">
                  {blog.authorName || "Mela Team"}
                </span>
                <span className="shrink-0">
                  {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </>
        )}

        {isAdmin && (
          <div className="pointer-events-auto mt-1 flex items-center justify-end gap-2">
            {canModify ? (
              <>
                <Link
                  href={`/admin/blogs/${blog.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-surface-muted"
                  aria-label={`Edit ${blog.title}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="m16.5 3.5 4 4L7 21l-4 1 1-4Z" />
                  </svg>
                </Link>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || !onDelete}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-surface-muted text-rose-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  aria-label={`Delete ${blog.title}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </>
            ) : (
              <span className="text-[11px] text-foreground/45 italic select-none">
                {blog.authorName ? `By ${blog.authorName}` : "Read only"}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        ref={categoriesMeasureRef}
        aria-hidden="true"
        className="pointer-events-none absolute -z-10 left-0 top-0 opacity-0"
      >
        <div className="inline-flex items-center gap-2 whitespace-nowrap">
          {blog.categories.map((cat) => (
            <span
              key={`${cat._id}-measure`}
              data-pill="category"
              className="text-xs px-2 py-1 rounded bg-surface-muted"
            >
              {cat.name}
            </span>
          ))}
          <span
            data-pill="ellipsis"
            className="text-xs px-2 py-1 rounded bg-surface-muted"
          >
            ...
          </span>
        </div>
      </div>
    </article>
  );
}