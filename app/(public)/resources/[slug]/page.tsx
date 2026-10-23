import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import PageWrapper from "@/components/layout/PageWrapper";
import DownloadFileButton from "@/components/resources/DownloadFileButton";
import { connectDB } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { Blog } from "@/models/Blog";
import { warmFileVaultConnection } from "@/lib/filevault";
import { absoluteUrl, seoConfig, breadcrumbSchema } from "@/lib/seo";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFormatBadgeColor(ext: string): { bg: string; text: string; border: string } {
  const e = (ext || "").toLowerCase();
  if (["pdf"].includes(e)) {
    return { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(e)) {
    return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" };
  }
  if (["doc", "docx", "txt", "md", "rtf"].includes(e)) {
    return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" };
  }
  if (["xls", "xlsx", "csv"].includes(e)) {
    return { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" };
  }
  if (["ppt", "pptx"].includes(e)) {
    return { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" };
  }
  return { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();

  const isObjectId = Types.ObjectId.isValid(slug);
  const query = isObjectId ? { $or: [{ slug }, { _id: new Types.ObjectId(slug) }] } : { slug };
  const resource = await Resource.findOne(query).select("title excerpt coverImage category").lean();

  if (!resource) {
    return {
      title: "Resource not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const imageUrl = resource.coverImage?.url;

  return {
    title: `${resource.title} | Resource Hub`,
    description: resource.excerpt,
    alternates: {
      canonical: `/resources/${slug}`,
    },
    openGraph: {
      title: `${resource.title} - Free Downloadable Resource`,
      description: resource.excerpt,
      type: "website",
      siteName: seoConfig.siteName,
      url: `/resources/${slug}`,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${resource.title} | Resource Hub`,
      description: resource.excerpt,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function SingleResourcePage({ params }: Props) {
  const { slug } = await params;

  // Warm SSL socket for immediate downloading
  warmFileVaultConnection();

  await connectDB();

  const isObjectId = Types.ObjectId.isValid(slug);
  const query = isObjectId ? { $or: [{ slug }, { _id: new Types.ObjectId(slug) }] } : { slug };

  const resource = await Resource.findOne(query).lean();
  if (!resource || resource.status !== "published") {
    notFound();
  }

  // Fetch blogs that link to this resource
  const linkedBlogDocs = await Blog.find({
    $or: [
      { _id: { $in: resource.linkedBlogIds || [] } },
      { linkedResourceIds: resource._id },
    ],
    status: "published",
  })
    .select("title slug excerpt featuredImage publishedAt authorName")
    .lean();

  const files = resource.files || [];
  const isBundle = files.length > 1;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Resources", path: "/resources" },
    { name: resource.title, path: `/resources/${resource.slug}` },
  ]);

  const digitalDocumentJsonLd = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: resource.title,
    description: resource.excerpt,
    url: absoluteUrl(`/resources/${resource.slug}`),
    image: resource.coverImage?.url ? [resource.coverImage.url] : undefined,
    datePublished: resource.createdAt.toISOString(),
    dateModified: resource.updatedAt.toISOString(),
    isAccessibleForFree: true,
    fileFormat: files[0]?.mimeType || "application/pdf",
    author: {
      "@type": "Person",
      name: resource.authorName || "Mela Team",
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
  };

  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(digitalDocumentJsonLd) }}
      />

      <div className="max-w-6xl mx-auto pt-24 sm:pt-28 pb-20 px-4 sm:px-6 space-y-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-foreground/50">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/resources" className="hover:text-foreground transition-colors">
            Resources
          </Link>
          <span>/</span>
          <span className="text-foreground/80 truncate max-w-xs">{resource.title}</span>
        </nav>

        {/* Header Hero */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {resource.category}
            </span>
            {isBundle ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-border text-foreground/80">
                📁 Multi-File Deck ({files.length} Files)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-border text-foreground/80">
                📄 Single File ({files[0]?.extension?.toUpperCase() || "File"})
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {resource.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-foreground/60 pt-1">
            <span>By <strong className="text-foreground">{resource.authorName || "Mela Team"}</strong></span>
            <span>•</span>
            <span>{resource.downloadCount || 0} Downloads</span>
            <span>•</span>
            <span>Total size: {formatBytes(totalSizeBytes)}</span>
            <span>•</span>
            <span>Published {new Date(resource.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>

        {/* Main Grid: Content on Left, Download Hub on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover Image if available */}
            {resource.coverImage?.url && (
              <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl border border-border/80 shadow-sm bg-surface-muted">
                <Image
                  src={resource.coverImage.url}
                  alt={resource.coverImage.alt || resource.title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            )}

            {/* Overview / Excerpt */}
            {resource.excerpt && (
              <div className="rounded-2xl border border-border/70 bg-surface/40 p-5 sm:p-6 backdrop-blur-xs">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">
                  Summary
                </h2>
                <p className="text-base sm:text-lg text-foreground/85 leading-relaxed">
                  {resource.excerpt}
                </p>
              </div>
            )}

            {/* Full Description & Instructions */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                About this Resource
              </h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground/80 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {resource.description}
              </div>
            </div>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="pt-4 border-t border-border/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2.5">
                  Tags & Topics:
                </p>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-border/60 text-xs text-foreground/70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Files & Download Hub Card */}
          <div className="space-y-6">
            <div className="sticky top-28 rounded-2xl border border-border/80 bg-background/95 p-6 shadow-xl backdrop-blur-md space-y-5">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {isBundle ? "Download Resource Deck" : "Download Resource"}
                </h2>
                <p className="text-xs text-foreground/60 mt-1">
                  Direct authenticated stream powered by FileVault.
                </p>
              </div>

              {/* Individual Files list */}
              <div className="space-y-4">
                {files.map((file, idx) => {
                  const badgeStyle = getFormatBadgeColor(file.extension);
                  return (
                    <div
                      key={file.fileVaultId || idx}
                      className="rounded-xl border border-border bg-surface/50 p-4 space-y-3 transition hover:border-foreground/30 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 truncate">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border mb-0.5 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                          >
                            {file.extension.toUpperCase()}
                          </span>
                          <p className="font-semibold text-sm text-foreground truncate">
                            {file.label || file.originalName}
                          </p>
                          <p className="text-[11px] text-foreground/50 truncate">
                            {file.originalName} • {formatBytes(file.sizeBytes)}
                          </p>
                        </div>
                      </div>

                      <DownloadFileButton
                        slug={resource.slug}
                        fileVaultId={file.fileVaultId}
                        label={`Download ${file.extension.toUpperCase()}`}
                        className="w-full"
                        variant={idx === 0 ? "primary" : "secondary"}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* "Referenced in Articles" section */}
        {linkedBlogDocs.length > 0 && (
          <section className="pt-12 border-t border-border/70 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Context & Companion Reading
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                Articles That Feature This Resource
              </h2>
              <p className="text-xs sm:text-sm text-foreground/60">
                Explore in-depth articles that teach and apply the principles behind this deck.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {linkedBlogDocs.map((blog) => (
                <Link
                  key={blog._id.toString()}
                  href={`/blogs/${blog.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-surface/40 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-foreground/30 hover:shadow-md"
                >
                  <div className="space-y-3">
                    {blog.featuredImage?.url && (
                      <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-surface-muted">
                        <Image
                          src={blog.featuredImage.url}
                          alt={blog.featuredImage.alt || blog.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-xs text-foreground/70 line-clamp-2">
                        {blog.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-foreground/50">
                    <span>{blog.authorName || "Mela Team"}</span>
                    <span className="text-primary font-medium group-hover:underline">Read Article &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageWrapper>
  );
}
