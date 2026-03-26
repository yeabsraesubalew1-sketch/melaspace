"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import BlogCard from "@/components/blog/BlogCard";
import type { BlogPreview } from "@/types/api";

interface Props {
  initialDrafts: BlogPreview[];
  initialPublished: BlogPreview[];
}

export default function AdminBlogsDashboard({
  initialDrafts,
  initialPublished,
}: Props) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [published, setPublished] = useState(initialPublished);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(initialDrafts);
  }, [initialDrafts]);

  useEffect(() => {
    setPublished(initialPublished);
  }, [initialPublished]);

  const sections = useMemo(
    () => [
      {
        title: "Drafts",
        data: drafts,
        href: "/admin/blogs/drafts",
        empty: "No drafts yet.",
      },
      {
        title: "Published",
        data: published,
        href: "/admin/blogs/publishes",
        empty: "No published blogs yet.",
      },
    ],
    [drafts, published]
  );

  const handleDelete = async (blogId: string) => {
    const confirmed = window.confirm("Delete this blog permanently?");
    if (!confirmed) return;

    setDeletingId(blogId);

    try {
      const res = await fetch(`/api/admin/blogs/${blogId}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Delete failed");
      }

      setDrafts((prev) => prev.filter((blog) => blog.id !== blogId));
      setPublished((prev) => prev.filter((blog) => blog.id !== blogId));
      toast.success("Blog deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Blogs</h1>
          <p className="text-sm text-foreground/60">Manage drafts and published blogs.</p>
        </div>

        <Link href="/admin/blogs/new" className="btn btn-primary">
          New Blog
        </Link>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="space-y-4 rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">{section.title}</h2>
              <Link href={section.href} className="text-sm text-foreground/80 underline underline-offset-4 hover:text-foreground">
                See more
              </Link>
            </div>

            {section.data.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface-muted/50 px-4 py-6 text-sm text-foreground/70">
                {section.empty}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {section.data.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    variant="admin"
                    onDelete={handleDelete}
                    isDeleting={deletingId === blog.id}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
