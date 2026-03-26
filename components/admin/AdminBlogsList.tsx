"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import BlogCard from "@/components/blog/BlogCard";
import type { BlogPreview } from "@/types/api";

interface Props {
  initialBlogs: BlogPreview[];
}

export default function AdminBlogsList({ initialBlogs }: Props) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setBlogs(initialBlogs);
  }, [initialBlogs]);

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

      setBlogs((prev) => prev.filter((blog) => blog.id !== blogId));
      toast.success("Blog deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (blogs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-muted/50 px-4 py-6 text-sm text-foreground/70">
        No blogs found.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {blogs.map((blog) => (
        <BlogCard
          key={blog.id}
          blog={blog}
          variant="admin"
          onDelete={handleDelete}
          isDeleting={deletingId === blog.id}
        />
      ))}
    </div>
  );
}
