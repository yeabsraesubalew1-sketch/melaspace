import { notFound } from "next/navigation";
import Link from "next/link";
import TableOfContents from "@/components/blog/TableOfContents";
import BookmarkButton from "@/components/blog/BookmarkButton";
import ViewTracker from "@/components/blog/ViewTracker";
import LinkedResourcesModule from "@/components/blog/LinkedResourcesModule";
import CommentSection from "@/components/blog/comments/CommentSection";
import BlogReadingView from "@/components/blog/BlogReadingView";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import type { EditorContent } from "@/types/editor";
import type { ResourceItem } from "@/types/api";
import type { Metadata } from "next";
import { processBlogContent } from "@/lib/blog-utils";
import { normalizeMediaUrl } from "@/lib/media";
import { warmFileVaultConnection } from "@/lib/filevault";
import { OG_IMAGE_VERSION, absoluteUrl, seoConfig, breadcrumbSchema } from "@/lib/seo";
import { cache } from "react";

function getBaseUrl() {
  const envBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXTAUTH_URL;

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
  publishedAt?: string;
  updatedAt?: string;
  categories: {
    _id: string;
    name: string;
    slug: string;
  }[];
  content: EditorContent;
  aiSummary?: EditorContent;
  authorName?: string;
  author?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  views?: number;
  commentsCount?: number;
  isPinned?: boolean;
  isBookmarked?: boolean;
  featuredImage?: {
    url: string;
    alt?: string;
    caption?: string;
  };
  linkedResources?: ResourceItem[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const blog = await getBlog(slug);

  if (!blog) {
    return {
      title: "Blog not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const isDataUri = Boolean(blog.featuredImage?.url?.startsWith("data:"));
  const ogImageUrl =
    blog.featuredImage?.url && !isDataUri
      ? blog.featuredImage.url
      : absoluteUrl(`/api/og/blog?slug=${encodeURIComponent(blog.slug)}&v=${OG_IMAGE_VERSION}`);

  return {
    title: blog.title,
    description: blog.excerpt,

    alternates: {
      canonical: `/blogs/${blog.slug}`,
    },

    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      type: "article",
      siteName: seoConfig.siteName,
      url: `/blogs/${blog.slug}`,
      publishedTime: blog.publishedAt,
      section: "Blog",
      tags: blog.categories?.map((cat) => cat.name) ?? [],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: blog.featuredImage?.alt || `${blog.title} | ${seoConfig.siteName}`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${blog.title} | ${seoConfig.siteName}`,
      description: blog.excerpt,
      images: [ogImageUrl],
    },

    keywords: blog.categories?.map((cat) => cat.name) ?? [],
  };
}

const getBlog = cache(async (slug: string): Promise<Blog | null> => {
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/blogs/${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return null;

    const json = await res.json();

    if (!json.success) return null;

    return json.data;
  } catch {
    return null;
  }
});

async function getRelatedBlogs(currentSlug: string, categorySlug?: string) {
  try {
    if (categorySlug) {
      const query = new URLSearchParams({
        limit: "4",
        category: categorySlug,
      });

      const res = await fetch(`${getBaseUrl()}/api/blogs?${query.toString()}`, {
        next: { revalidate: 60 },
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          const filtered = json.data.filter((b: { slug: string }) => b.slug !== currentSlug);
          if (filtered.length > 0) {
            return filtered.slice(0, 3);
          }
        }
      }
    }

    // Fallback: fetch latest published articles if no other post exists in the specific category
    const fallbackRes = await fetch(`${getBaseUrl()}/api/blogs?limit=4`, {
      next: { revalidate: 60 },
    });

    if (!fallbackRes.ok) return [];

    const fallbackJson = await fallbackRes.json();
    if (!Array.isArray(fallbackJson?.data)) return [];

    return fallbackJson.data.filter((b: { slug: string }) => b.slug !== currentSlug).slice(0, 3);
  } catch {
    return [];
  }
}

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPage({ params }: Props) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  // Keep SSL keep-alive socket warm in background for instant media streaming
  warmFileVaultConnection();

  const { readingTime, toc } = processBlogContent(blog.content);
  const authorName = blog.authorName || blog.author?.name || "Mela Team";

  const isDataUri = Boolean(blog.featuredImage?.url?.startsWith("data:"));
  const ogImageUrl =
    blog.featuredImage?.url && !isDataUri
      ? blog.featuredImage.url
      : absoluteUrl(`/api/og/blog?slug=${encodeURIComponent(blog.slug)}&v=${OG_IMAGE_VERSION}`);

  const primaryCategory = blog.categories && blog.categories.length > 0 ? blog.categories[0] : null;

  const relatedBlogs = await getRelatedBlogs(
    blog.slug,
    primaryCategory?.slug
  );

  const blogBreadcrumbJsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blogs" },
    ...(primaryCategory?.slug
      ? [{ name: primaryCategory.name, path: `/blogs?category=${encodeURIComponent(primaryCategory.slug)}` }]
      : []),
    { name: blog.title, path: `/blogs/${blog.slug}` },
  ]);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    url: absoluteUrl(`/blogs/${blog.slug}`),
    image: [ogImageUrl],
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    author: {
      "@type": "Person",
      name: authorName,
      url: absoluteUrl("/about"),
    },
    publisher: {
      "@type": "Organization",
      name: seoConfig.siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.svg"),
      },
    },
    articleSection: primaryCategory?.name || "Blog",
    keywords: blog.categories?.map((cat) => cat.name) ?? [],
    timeRequired: `PT${readingTime}M`,
    mainEntityOfPage: absoluteUrl(`/blogs/${blog.slug}`),
    inLanguage: "en",
  };

  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const hasToc = toc && toc.length > 0;

  return (
    <main data-no-grid-bg="true" className="px-4 sm:px-6 py-16 sm:py-20">
      {/* View counter tracker */}
      <ViewTracker slug={blog.slug} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogBreadcrumbJsonLd) }}
      />
      <div className={`mx-auto ${hasToc ? "max-w-6xl" : "max-w-3xl"}`}>
        <div className={hasToc ? "flex flex-col gap-10 lg:flex-row lg:items-start" : ""}>
          {hasToc && (
            <aside className="order-2 w-full lg:order-1 lg:w-72 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-border/70 bg-background/85 p-4 shadow-sm sm:p-5">
                <TableOfContents toc={toc} />
              </div>
            </aside>
          )}

          <article className={`min-w-0 ${hasToc ? "order-1 flex-1 max-w-3xl lg:order-2" : "w-full"}`}>
            {blog.featuredImage?.url ? (
              <header className="relative mb-10 overflow-hidden rounded-2xl border border-border/80 shadow-md">
                {/* Background Image & Multi-Stop Dark Scrim */}
                <div className="absolute inset-0 z-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizeMediaUrl(blog.featuredImage.url)}
                    alt={blog.featuredImage.alt || blog.title}
                    className="h-full w-full object-cover"
                  />
                  {/* Multi-stop scrim gradient guaranteeing WCAG AAA contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/45" />
                  <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/40 pointer-events-none" />
                </div>

                {/* Header Content Layer */}
                <div className="relative z-10 space-y-6 p-6 sm:p-8 text-white">
                  {/* Categories & Pin Badge & Bookmark */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {blog.isPinned && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-400/20 text-amber-300 border border-amber-400/40 backdrop-blur-md">
                          <svg className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span>Featured</span>
                        </span>
                      )}
                      {blog.categories?.length > 0 &&
                        blog.categories.map((cat) => (
                          <Link
                            key={cat._id}
                            href={`/blogs?category=${encodeURIComponent(cat.slug)}`}
                            className="text-xs sm:text-sm px-3 py-1 rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25"
                          >
                            {cat.name}
                          </Link>
                        ))}
                    </div>

                    {/* Bookmark Action */}
                    <BookmarkButton
                      blogId={blog.id}
                      slug={blog.slug}
                      initialBookmarked={blog.isBookmarked}
                      showLabel
                      className="border-white/20 bg-white/15 text-white backdrop-blur-md hover:bg-white/25 hover:text-white"
                    />
                  </div>

                  {/* Title */}
                  <h1 className="max-w-full text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight wrap-anywhere text-white drop-shadow-sm">
                    {blog.title}
                  </h1>

                  {/* Author & Publication Details Row */}
                  <div className="flex flex-wrap items-center gap-4 py-2 border-y border-white/20 text-xs sm:text-sm text-white/80">
                    <div className="flex items-center gap-2.5">
                      <DefaultAvatar name={authorName} size="md" />
                      <div>
                        <span className="font-semibold text-white">{authorName}</span>
                        <span className="block text-[11px] text-white/60">Author</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-white/70 ml-auto">
                      {formattedDate && <span>{formattedDate}</span>}
                      <span>•</span>
                      <span>{readingTime} min read</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <svg
                          className="h-3.5 w-3.5 text-white/60"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span>{blog.views || 0} views</span>
                      </span>
                    </div>
                  </div>

                  {/* Excerpt */}
                  {blog.excerpt && (
                    <p className="max-w-2xl text-base sm:text-lg text-white/85 leading-relaxed font-normal">
                      {blog.excerpt}
                    </p>
                  )}

                  {/* Cover image caption if present */}
                  {blog.featuredImage.caption && (
                    <div className="pt-1 text-right text-[11px] text-white/50 italic">
                      Cover: {blog.featuredImage.caption}
                    </div>
                  )}
                </div>
              </header>
            ) : (
              <header className="mb-10 space-y-6 rounded-2xl border border-border/70 bg-background/85 p-5 shadow-sm sm:p-7">
                {/* Categories & Pin Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {blog.isPinned && (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600 border border-amber-500/30">
                        <svg className="h-3.5 w-3.5 fill-amber-500 text-amber-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>Featured</span>
                      </span>
                    )}
                    {blog.categories?.length > 0 &&
                      blog.categories.map((cat) => (
                        <Link
                          key={cat._id}
                          href={`/blogs?category=${encodeURIComponent(cat.slug)}`}
                          className="text-xs sm:text-sm px-3 py-1 rounded-full border border-border bg-surface-muted/70 text-foreground/80 transition hover:-translate-y-0.5 hover:bg-surface-muted"
                        >
                          {cat.name}
                        </Link>
                      ))}
                  </div>

                  {/* Bookmark Action */}
                  <BookmarkButton
                    blogId={blog.id}
                    slug={blog.slug}
                    initialBookmarked={blog.isBookmarked}
                    showLabel
                  />
                </div>

                {/* Title */}
                <h1 className="max-w-full text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight wrap-anywhere">
                  {blog.title}
                </h1>

                {/* Author & Publication Details Row */}
                <div className="flex flex-wrap items-center gap-4 py-2 border-y border-border/60 text-xs sm:text-sm text-foreground/75">
                  <div className="flex items-center gap-2.5">
                    <DefaultAvatar name={authorName} size="md" />
                    <div>
                      <span className="font-semibold text-foreground">{authorName}</span>
                      <span className="block text-[11px] text-foreground/50">Author</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-foreground/60 ml-auto">
                    {formattedDate && <span>{formattedDate}</span>}
                    <span>•</span>
                    <span>{readingTime} min read</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5 text-foreground/50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>{blog.views || 0} views</span>
                    </span>
                  </div>
                </div>

                {/* Excerpt */}
                {blog.excerpt && (
                  <p className="max-w-2xl text-base sm:text-lg text-foreground/70 leading-relaxed font-normal">
                    {blog.excerpt}
                  </p>
                )}
              </header>
            )}

            <hr className="mb-10 border-border" />

            {/* Interactive Reading Experience: Full Article ↔ 1-Min Summary */}
            <BlogReadingView
              slug={blog.slug}
              fullContent={blog.content}
              initialSummary={blog.aiSummary}
              blogTitle={blog.title}
              readingTime={readingTime}
              linkedResources={blog.linkedResources}
            />

            {/* Linked Downloadable Resources & Decks */}
            <LinkedResourcesModule resources={blog.linkedResources} />

            {/* Community Comments & Discussion */}
            <CommentSection
              blogSlug={blog.slug}
              initialCommentsCount={blog.commentsCount || 0}
            />

            {/* Related Articles Module */}
            {relatedBlogs.length > 0 && (
              <section className="mt-14 pt-10 border-t border-border space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Keep Reading
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                      Related Articles
                    </h2>
                  </div>
                  <Link
                    href="/blogs"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View all &rarr;
                  </Link>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedBlogs.map((item: {
                    id: string;
                    title: string;
                    slug: string;
                    excerpt?: string;
                    authorName?: string;
                    featuredImage?: { url: string; alt?: string };
                  }) => (
                    <Link
                      key={item.id}
                      href={`/blogs/${item.slug}`}
                      className="group flex flex-col justify-between rounded-xl border border-border bg-surface-muted/40 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="space-y-2">
                        {item.featuredImage?.url && (
                          <div className="relative aspect-16/9 w-full overflow-hidden rounded-lg bg-surface-muted">
                            <img
                              src={normalizeMediaUrl(item.featuredImage.url)}
                              alt={item.featuredImage.alt || item.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="text-xs text-foreground/70 line-clamp-2">
                            {item.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-foreground/50 flex justify-between">
                        <span>{item.authorName || "Mela Team"}</span>
                        <span className="text-primary font-medium">Read &rarr;</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      </div>
    </main>
  );
}