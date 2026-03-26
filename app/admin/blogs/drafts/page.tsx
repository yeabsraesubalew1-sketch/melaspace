import Link from "next/link";
import SearchInput from "@/components/blog/SearchInput";
import CategoryPills from "@/components/blog/CategoryPills";
import Pagination from "@/components/blog/Pagination";
import AdminBlogsList from "@/components/admin/AdminBlogsList";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Category } from "@/models/Category";
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

interface CategoryOption {
  _id: unknown;
  name: string;
  slug: string;
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

export default async function AdminDraftBlogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;
  const qParam = Array.isArray(resolvedSearchParams.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams.q;
  const categoryParam = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams.category;

  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const q = qParam ?? "";
  const categorySlug = categoryParam ?? "";
  const limit = 9;

  await connectDB();

  const [categories, selectedCategory] = await Promise.all([
    Category.find().sort({ name: 1 }).select("_id name slug").lean<CategoryOption[]>(),
    categorySlug
      ? Category.findOne({ slug: categorySlug }).select("_id").lean<{ _id: unknown } | null>()
      : Promise.resolve(null),
  ]);

  const plainCategories = categories.map((category) => ({
    _id: toPlainId(category._id),
    name: category.name,
    slug: category.slug,
  }));

  if (categorySlug && !selectedCategory) {
    return (
      <main className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <Link href="/admin/blogs" className="underline underline-offset-4">
              Blogs
            </Link>
            <span>/</span>
            <span>Drafts</span>
          </div>
          <h1 className="text-2xl font-semibold">Draft Blogs</h1>
        </div>

        <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
          <SearchInput basePath="/admin/blogs/drafts" placeholder="Search drafts..." />
          <CategoryPills categories={plainCategories} basePath="/admin/blogs/drafts" />
        </div>

        <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
          <AdminBlogsList initialBlogs={[]} />
        </div>
      </main>
    );
  }

  const filter: Record<string, unknown> = {
    status: "draft",
  };

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { excerpt: { $regex: q, $options: "i" } },
    ];
  }

  if (selectedCategory?._id) {
    filter.categories = toPlainId(selectedCategory._id);
  }

  const [total, blogs] = await Promise.all([
    Blog.countDocuments(filter),
    Blog.find(filter)
      .populate("categories", "name slug")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<BlogLean[]>(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <Link href="/admin/blogs" className="underline underline-offset-4">
              Blogs
            </Link>
            <span>/</span>
            <span>Drafts</span>
          </div>
          <h1 className="text-2xl font-semibold">Draft Blogs</h1>
          <p className="text-sm text-foreground/65">
            {total} total draft posts.
          </p>
        </div>

        <Link href="/admin/blogs/new" className="btn btn-primary">
          New Post
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
        <SearchInput basePath="/admin/blogs/drafts" placeholder="Search drafts..." />
        <CategoryPills categories={plainCategories} basePath="/admin/blogs/drafts" />
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
        <AdminBlogsList initialBlogs={blogs.map(mapPreview)} />
        <Pagination page={page} totalPages={totalPages} basePath="/admin/blogs/drafts" />
      </div>
    </main>
  );
}
