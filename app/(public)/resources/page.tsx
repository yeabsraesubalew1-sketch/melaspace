import PageWrapper from "@/components/layout/PageWrapper";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { warmFileVaultConnection } from "@/lib/filevault";
import { buildPageMetadata, breadcrumbSchema } from "@/lib/seo";
import ResourcesCatalog from "@/components/resources/ResourcesCatalog";
import type { ResourceItem } from "@/types/api";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Resource Hub & Deck Library",
  description:
    "Explore Mela Space companion tools, guided workbooks, reflection templates, and downloadable resource decks for your personal journey.",
  path: "/resources",
});

const breadcrumbJsonLd = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Resources", path: "/resources" },
]);

export default async function ResourcesPage() {
  // Keep FileVault SSL keep-alive warm in background for instant file downloads
  warmFileVaultConnection();

  await connectDB();

  const resourceDocs = await Resource.find({ status: "published" })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const resources: ResourceItem[] = resourceDocs.map((r) => ({
    id: r._id.toString(),
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    description: r.description,
    category: r.category,
    tags: r.tags || [],
    coverImage: r.coverImage,
    files: (r.files || []).map((f) => ({
      label: f.label,
      fileVaultId: f.fileVaultId,
      storageKey: f.storageKey,
      originalName: f.originalName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      extension: f.extension,
    })),
    downloadCount: r.downloadCount || 0,
    status: r.status,
    authorName: r.authorName || "Mela Team",
    linkedBlogIds: (r.linkedBlogIds || []).map((id) => id.toString()),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-6xl mx-auto space-y-12 pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
        {/* Header Hero */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-muted/60 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Tools, Decks & Downloads</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Mela Resource Hub
          </h1>
          <p className="text-foreground/70 text-base sm:text-lg leading-relaxed">
            Free curated companion decks, guided worksheets, reflection frameworks, and digital kits to support your self-discovery and growth.
          </p>
        </section>

        {/* Catalog & Filter Grid */}
        <ResourcesCatalog initialResources={resources} />

        {/* Bottom Call to Action */}
        <section className="text-center space-y-4 rounded-3xl border border-border/80 bg-surface/50 p-8 sm:p-12 backdrop-blur-xs shadow-xs">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Looking for a specific workbook or template?
          </h2>
          <p className="text-foreground/70 max-w-xl mx-auto text-sm sm:text-base">
            We regularly design and publish companion resources based on community requests. Share what you&apos;d love to see next.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/contact#inquiry" className="btn btn-primary px-6 py-2.5 shadow-sm">
              Request a Resource
            </Link>
            <Link href="/contact#waitlist" className="btn btn-secondary px-6 py-2.5">
              Join Early Access
            </Link>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}