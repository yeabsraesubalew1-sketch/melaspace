import BlogCard from "@/components/blog/BlogCard";
import CategoryPills from "@/components/blog/CategoryPills";
import SearchInput from "@/components/blog/SearchInput";
import Pagination from "@/components/blog/Pagination";
import CategoryQueryGuard from "@/components/blog/CategoryQueryGuard";
import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

function getBaseUrl() {
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXTAUTH_URL;

  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categories: {
    _id: string;
    name: string;
    slug: string;
  }[];
  publishedAt?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
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
  const q = qParam?.trim() ?? "";
  const category = categoryParam?.trim() ?? "";
  const hasVariantQuery = Boolean(q || category || page > 1);

  const titleSuffix = category
    ? ` - ${category}`
    : q
      ? ` - Search: ${q}`
      : "";

  return buildPageMetadata({
    title: `Blog${titleSuffix}`,
    description:
      "Read articles and practical breakdowns on strategy, content, and creator systems.",
    path: "/blogs",
    noIndex: hasVariantQuery,
  });
}

async function fetchBlogs(params: string) {
  const res = await fetch(`${getBaseUrl()}/api/blogs?${params}`, {
        next: { revalidate: 60 },
      });

  const json = await res.json();

  return json;
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${getBaseUrl()}/api/categories`, {
    cache: "force-cache",
  });

  const json = await res.json();

  return Array.isArray(json?.data) ? json.data : [];
}

export default async function BlogsPage({
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
  const category = categoryParam ?? "";

  const query = new URLSearchParams({
    page: String(page),
    limit: "9",
    ...(q ? { q: String(q) } : {}),
    ...(category ? { category: String(category) } : {}),
  });

  const hasFilters = Boolean(q || category);

  const [blogsRes, categories] = await Promise.all([
    fetchBlogs(query.toString()),
    fetchCategories(),
  ]);

  const blogs: Blog[] = Array.isArray(blogsRes?.data) ? blogsRes.data : [];
  const meta = {
    page: Number(blogsRes?.meta?.page) || page,
    totalPages: Math.max(1, Number(blogsRes?.meta?.totalPages) || 1),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24">

      {/* Page header */}
      <div className="mb-8 sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
          Blog
        </h1>
        <p className="opacity-70">
          Articles, tutorials, and thoughts.
        </p>
      </div>

      {/* Search */}
      <SearchInput />

      <CategoryQueryGuard
        validCategorySlugs={categories.map((cat) => cat.slug)}
      />

      {/* Categories */}
      <CategoryPills categories={categories} />

      {/* Blog grid */}
      {blogs.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border bg-surface-muted/50 p-6">
          <p className="text-base opacity-80">
            {hasFilters
              ? "No articles match your current search or category."
              : "No articles published yet."}
          </p>
          {hasFilters && (
            <div className="mt-4">
              <Link
                href="/blogs"
                className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-surface-muted"
              >
                Clear filters
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
      />

    </main>
  );
}