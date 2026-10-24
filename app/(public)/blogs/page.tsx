import BlogCard from "@/components/blog/BlogCard";
import FeaturedBlogHero from "@/components/blog/FeaturedBlogHero";
import CategoryPills from "@/components/blog/CategoryPills";
import SearchInput from "@/components/blog/SearchInput";
import Pagination from "@/components/blog/Pagination";
import CategoryQueryGuard from "@/components/blog/CategoryQueryGuard";
import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata, breadcrumbSchema, getBaseUrl } from "@/lib/seo";
import { warmFileVaultConnection } from "@/lib/filevault";
import { normalizeMediaUrl } from "@/lib/media";

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
  isPinned?: boolean;
  views?: number;
  authorName?: string;
  featuredImage?: {
    url: string;
    alt?: string;
    caption?: string;
  };
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

  // Only noindex search query results or deep pagination (> page 1)
  const shouldNoIndex = Boolean(q || page > 1);

  const formattedCategory = category
    ? category.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
    : "";

  const title = category
    ? `${formattedCategory} Articles`
    : q
      ? `Blog Search: ${q}`
      : "Blog";

  const description = category
    ? `Explore ${formattedCategory.toLowerCase()} articles, guides, and practical frameworks on Mela Space.`
    : "Read articles and practical breakdowns on strategy, content, and creator systems.";

  return buildPageMetadata({
    title,
    description,
    path: category && !q && page === 1 ? `/blogs?category=${encodeURIComponent(category)}` : "/blogs",
    noIndex: shouldNoIndex,
  });
}

const blogsBreadcrumbJsonLd = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blogs" },
]);

async function fetchBlogs(params: string) {
  const res = await fetch(`${getBaseUrl()}/api/blogs?${params}`, {
        next: { revalidate: 60 },
      });

  const json = await res.json();

  return json;
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${getBaseUrl()}/api/categories`, {
    next: { revalidate: 60 },
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

  // Keep SSL keep-alive socket warm in background for snappy image streaming
  warmFileVaultConnection();

  const blogs: Blog[] = Array.isArray(blogsRes?.data) ? blogsRes.data : [];
  const meta = {
    page: Number(blogsRes?.meta?.page) || page,
    totalPages: Math.max(1, Number(blogsRes?.meta?.totalPages) || 1),
  };

  // Determine if a spotlight hero story should be highlighted at the top
  const spotlightBlog =
    !hasFilters && page === 1 && blogs.length > 0
      ? blogs.find((b) => b.isPinned) || blogs[0]
      : null;

  // Remaining articles for the grid
  const gridBlogs = spotlightBlog
    ? blogs.filter((b) => b.id !== spotlightBlog.id)
    : blogs;

  // Find first card with featured image to preload its image
  const firstFeatured = blogs.find((b) => b.featuredImage?.url);
  const preloadImageUrl = firstFeatured?.featuredImage?.url
    ? normalizeMediaUrl(firstFeatured.featuredImage.url)
    : null;

  const formattedCategory = category
    ? category
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ")
    : "";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32">
      {preloadImageUrl && (
        <link rel="preload" as="image" href={preloadImageUrl} />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogsBreadcrumbJsonLd) }}
      />

      {/* Editorial Page Header */}
      <div className="mb-10 sm:mb-12 space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-surface-muted text-xs font-semibold uppercase tracking-wider text-primary">
          <span>Mela Publications</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
          {formattedCategory
            ? `${formattedCategory} Articles`
            : q
            ? `Search Results`
            : "Thoughts, Neuroscience & Becoming"}
        </h1>

        <p className="text-base sm:text-lg text-foreground/75 leading-relaxed">
          {category
            ? `Explore ${formattedCategory.toLowerCase()} insights, guides, and practical cognitive frameworks.`
            : q
            ? `Showing matching articles for "${q}".`
            : "Articles, reflections, and neuroscience breakdowns designed to help you understand your mind, regulate emotions, and take intentional action."}
        </p>
      </div>

      {/* Search */}
      <SearchInput />

      <CategoryQueryGuard
        validCategorySlugs={categories.map((cat) => cat.slug)}
      />

      {/* Categories */}
      <CategoryPills categories={categories} />

      {/* Featured Story Hero Spotlight (Only on unfiltered page 1) */}
      {spotlightBlog && <FeaturedBlogHero blog={spotlightBlog} />}

      {/* Blog grid */}
      {blogs.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface-muted/50 p-8 text-center space-y-4">
          <p className="text-base text-foreground/80">
            {hasFilters
              ? "No articles match your current search or category."
              : "No articles published yet."}
          </p>
          {hasFilters && (
            <div>
              <Link
                href="/blogs"
                className="btn btn-secondary px-4 py-2 text-sm shadow-xs"
              >
                Clear filters
              </Link>
            </div>
          )}
        </div>
      ) : gridBlogs.length > 0 ? (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gridBlogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      ) : null}

      {/* Pagination */}
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
      />

    </main>
  );
}