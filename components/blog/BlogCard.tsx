"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

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
    <article className="group relative h-full w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <Link
        href={linkHref}
        className="absolute inset-0 z-10 rounded-xl"
        aria-label={`Open ${blog.title}`}
      />

      <div className="relative z-20 flex h-full flex-col gap-3 pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <div
            ref={categoriesContainerRef}
            className="min-w-0 flex-1 overflow-hidden"
          >
            <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap overflow-hidden">
              {visibleCategories.map((cat) => (
                <span
                  key={cat._id}
                  className="text-xs px-2 py-1 rounded bg-surface-muted"
                >
                  {cat.name}
                </span>
              ))}
              {hasHiddenCategories && (
                <span className="text-xs px-2 py-1 rounded bg-surface-muted">...</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {blog.isPinned && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <svg className="h-3 w-3 fill-amber-500 text-amber-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Featured</span>
              </span>
            )}
            {isAdmin && blog.status && (
              <span
                className={`text-xs px-2 py-1 rounded capitalize ${
                  blog.status === "published"
                    ? "bg-foreground/10"
                    : "bg-surface-muted"
                }`}
              >
                {blog.status}
              </span>
            )}
          </div>
        </div>

        <h2 className={`font-semibold leading-snug group-hover:underline ${
          isAdmin ? "truncate text-xl" : "line-clamp-2 text-lg sm:text-xl"
        }`}>
          {blog.title}
        </h2>

        <p
          className={`text-sm leading-relaxed opacity-80 ${
            isAdmin ? "truncate" : "line-clamp-3"
          }`}
        >
          {blog.excerpt}
        </p>

        {blog.publishedAt && (
          <div className="text-xs mt-auto flex items-center justify-between text-foreground/60 pt-2 border-t border-border/40">
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