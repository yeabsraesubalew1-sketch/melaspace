import Link from "next/link";
import { normalizeMediaUrl } from "@/lib/media";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Props {
  blog: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    categories: Category[];
    publishedAt?: string;
    authorName?: string;
    featuredImage?: {
      url: string;
      alt?: string;
    };
  };
}

export default function FeaturedBlogHero({ blog }: Props) {
  const imageUrl = blog.featuredImage?.url
    ? normalizeMediaUrl(blog.featuredImage.url)
    : null;

  return (
    <article className="group relative mb-12 overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface via-surface-muted/60 to-surface shadow-xs transition duration-300 hover:shadow-md">
      <Link
        href={`/blogs/${blog.slug}`}
        className="absolute inset-0 z-20 rounded-3xl"
        aria-label={`Read featured article: ${blog.title}`}
      />

      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
        {/* Left Column: Story Details */}
        <div className="p-8 sm:p-12 space-y-5 z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>Featured Story</span>
            </span>

            {blog.categories.slice(0, 2).map((cat) => (
              <span
                key={cat._id}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-muted border border-border/60 text-foreground/75"
              >
                {cat.name}
              </span>
            ))}
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-tight group-hover:underline">
            {blog.title}
          </h2>

          <p className="text-foreground/75 text-sm sm:text-base leading-relaxed line-clamp-3">
            {blog.excerpt}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-border/70 text-xs text-foreground/70">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-[11px]">
                {(blog.authorName || "M")[0]}
              </div>
              <span className="font-medium text-foreground">
                {blog.authorName || "Mela Team"}
              </span>
            </div>

            {blog.publishedAt && (
              <span>
                {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:text-foreground transition-colors">
              <span>Read Full Article</span>
              <span>→</span>
            </span>
          </div>
        </div>

        {/* Right Column: Featured Image or Subtle Graphic Accent */}
        <div className="relative h-64 sm:h-80 lg:h-full min-h-[260px] overflow-hidden border-t lg:border-t-0 lg:border-l border-border/70">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={blog.featuredImage?.alt || blog.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-muted/50 p-8">
              <svg
                viewBox="0 0 64 64"
                fill="none"
                className="h-28 w-28 text-foreground/15 -rotate-12 transition-transform duration-500 group-hover:rotate-0"
                aria-hidden="true"
              >
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="2" />
                <circle cx="32" cy="32" r="6" fill="currentColor" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
