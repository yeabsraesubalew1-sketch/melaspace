import { notFound } from "next/navigation";
import Link from "next/link";
import Renderer from "@/components/editorjs/Renderer";
import TableOfContents from "@/components/blog/TableOfContents";
import type { EditorContent } from "@/types/editor";
import type { Metadata } from "next";
import { processBlogContent } from "@/lib/blog-utils";
import { absoluteUrl, seoConfig } from "@/lib/seo";
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
  categories: {
    _id: string;
    name: string;
    slug: string;
  }[];
  content: EditorContent;
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
    };
  }

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
          url: absoluteUrl(`/api/og/blog?slug=${encodeURIComponent(blog.slug)}`),
          width: 1200,
          height: 630,
          alt: `${blog.title} | ${seoConfig.siteName}`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${blog.title} | ${seoConfig.siteName}`,
      description: blog.excerpt,
      images: [absoluteUrl(`/api/og/blog?slug=${encodeURIComponent(blog.slug)}`)],
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

  const { readingTime, toc } = processBlogContent(blog.content);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt,
    url: absoluteUrl(`/blogs/${blog.slug}`),
    datePublished: blog.publishedAt,
    author: {
      "@type": "Organization",
      name: seoConfig.siteName,
    },
    publisher: {
      "@type": "Organization",
      name: seoConfig.siteName,
    },
    articleSection: "Blog",
    keywords: blog.categories?.map((cat) => cat.name) ?? [],
    timeRequired: `PT${readingTime}M`,
    mainEntityOfPage: absoluteUrl(`/blogs/${blog.slug}`),
  };

  return (
    <main data-no-grid-bg="true" className="px-4 sm:px-6 py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <aside className="order-2 w-full lg:order-1 lg:w-72 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border/70 bg-background/85 p-4 shadow-sm sm:p-5">
              <TableOfContents toc={toc} />
            </div>
          </aside>

          <article className="order-1 min-w-0 flex-1 max-w-3xl lg:order-2">
            <header className="mb-10 space-y-6 rounded-2xl border border-border/70 bg-background/85 p-5 shadow-sm sm:p-7">
              {blog.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blog.categories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/blogs?category=${encodeURIComponent(cat.slug)}`}
                      className="text-xs sm:text-sm px-3 py-1 rounded-full border border-border bg-surface-muted/70 text-foreground/80 transition hover:-translate-y-0.5 hover:bg-surface-muted"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              <h1 className="max-w-full text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight wrap-anywhere">
                {blog.title}
              </h1>

              <div className="flex items-center text-sm text-foreground/70">
                <span className="inline-flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.25a5.75 5.75 0 00-5.75-5.75H3.75A1.75 1.75 0 002 2.25v15.5c0 .966.784 1.75 1.75 1.75h2.5A5.75 5.75 0 0112 23.25m0-17a5.75 5.75 0 015.75-5.75h2.5A1.75 1.75 0 0122 2.25v15.5a1.75 1.75 0 01-1.75 1.75h-2.5A5.75 5.75 0 0012 23.25m0-17v17"
                    />
                  </svg>
                  <span>{readingTime} min read</span>
                </span>
              </div>

              {blog.excerpt && (
                <p className="max-w-2xl text-base sm:text-lg text-foreground/70 leading-relaxed">
                  {blog.excerpt}
                </p>
              )}
            </header>

            <hr className="mb-10 border-border" />

            {/* Content */}
            <div className="space-y-4">
              <Renderer content={blog.content} openLinksInNewTab />
            </div>
          </article>

        </div>
      </div>
    </main>
  );
}