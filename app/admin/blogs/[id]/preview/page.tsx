import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import Renderer from "@/components/editorjs/Renderer";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import type { EditorContent } from "@/types/editor";

interface BlogPreviewData {
  _id: string | { toString(): string };
  title: string;
  excerpt: string;
  status: "draft" | "published";
  publishedAt?: Date;
  categories: { _id: string; name: string; slug: string }[];
  content: EditorContent;
}

async function getBlogById(id: string): Promise<BlogPreviewData | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const blog = await Blog.findById(id)
    .populate("categories", "_id name slug")
    .lean<BlogPreviewData>();

  return blog ?? null;
}

export default async function AdminBlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blog = await getBlogById(id);

  if (!blog) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="rounded-xl border border-border bg-background/85 p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-foreground/60 capitalize">{blog.status} Preview</p>
          <h1 className="text-3xl font-semibold">{blog.title}</h1>
        </div>

        <Link href={`/admin/blogs/${id}`} className="btn btn-secondary">
          Edit
        </Link>
      </div>

      {blog.categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {blog.categories.map((category) => (
            <span key={category._id} className="rounded px-2 py-1 text-xs bg-surface-muted">
              {category.name}
            </span>
          ))}
        </div>
      )}

      {blog.publishedAt && (
        <p className="text-sm text-foreground/60">
          {new Date(blog.publishedAt).toLocaleDateString()}
        </p>
      )}

      {blog.excerpt && <p className="text-base text-foreground/80">{blog.excerpt}</p>}
      </div>

      <hr className="border-border" />

      <div className="space-y-4">
        <Renderer content={blog.content} openLinksInNewTab />
      </div>
    </main>
  );
}
