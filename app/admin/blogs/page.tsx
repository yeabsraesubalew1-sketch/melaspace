import AdminBlogsDashboard from "@/components/admin/AdminBlogsDashboard";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import type { BlogPreview } from "@/types/api";

interface BlogLean {
  _id: string | { toString(): string };
  title: string;
  slug: string;
  excerpt: string;
  categories: { _id: unknown; name: string; slug: string }[];
  status: "draft" | "published";
  publishedAt?: Date;
}

function toPlainId(value: unknown): string {
  if (typeof value === "string") return value;
  return String(value);
}

function mapPreview(blog: BlogLean): BlogPreview {
  return {
    id: toPlainId(blog._id),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    categories: blog.categories.map((category) => ({
      _id: toPlainId(category._id),
      name: category.name,
      slug: category.slug,
    })),
    status: blog.status,
    publishedAt: blog.publishedAt?.toISOString(),
  };
}

export default async function AdminBlogsPage() {
  await connectDB();

  const [draftBlogs, publishedBlogs] = await Promise.all([
    Blog.find({ status: "draft" })
      .populate("categories", "name slug")
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean<BlogLean[]>(),
    Blog.find({ status: "published" })
      .populate("categories", "name slug")
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean<BlogLean[]>(),
  ]);

  return (
    <AdminBlogsDashboard
      initialDrafts={draftBlogs.map(mapPreview)}
      initialPublished={publishedBlogs.map(mapPreview)}
    />
  );
}
