import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import Renderer from "@/components/editorjs/Renderer";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import type { EditorContent } from "@/types/editor";
import { normalizeMediaUrl } from "@/lib/media";

interface BlogPreviewData {
  _id: string | { toString(): string };
  title: string;
  excerpt: string;
  status: "draft" | "published";
  publishedAt?: Date;
  categories: { _id: string; name: string; slug: string }[];
  content: EditorContent;
  featuredImage?: {
    url: string;
    alt?: string;
    caption?: string;
  };
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
      {blog.featuredImage?.url ? (
        <div className="relative overflow-hidden rounded-xl border border-border/80 shadow-md">
          {/* Background Image & Multi-Stop Dark Scrim */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizeMediaUrl(blog.featuredImage.url)}
              alt={blog.featuredImage.alt || blog.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/45" />
          </div>

          <div className="relative z-10 space-y-4 p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs text-white/70 uppercase tracking-wider font-medium">{blog.status} Preview</p>
                <h1 className="text-3xl font-semibold text-white drop-shadow-xs">{blog.title}</h1>
              </div>

              <Link href={`/admin/blogs/${id}`} className="rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-white/25 transition">
                Edit
              </Link>
            </div>

            {blog.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blog.categories.map((category) => (
                  <span key={category._id} className="rounded-full px-2.5 py-0.5 text-xs bg-white/15 border border-white/20 text-white backdrop-blur-md">
                    {category.name}
                  </span>
                ))}
              </div>
            )}

            {blog.publishedAt && (
              <p className="text-xs text-white/70">
                {new Date(blog.publishedAt).toLocaleDateString()}
              </p>
            )}

            {blog.excerpt && <p className="text-sm sm:text-base text-white/85 leading-relaxed">{blog.excerpt}</p>}

            {blog.featuredImage.caption && (
              <p className="text-right text-[11px] text-white/50 italic pt-1">
                Cover: {blog.featuredImage.caption}
              </p>
            )}
          </div>
        </div>
      ) : (
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
      )}

      <hr className="border-border" />

      <div className="space-y-4">
        <Renderer content={blog.content} blogTitle={blog.title} openLinksInNewTab />
      </div>
    </main>
  );
}
