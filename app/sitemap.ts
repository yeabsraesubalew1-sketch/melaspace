import type { MetadataRoute } from "next";
import { Blog } from "@/models/Blog";
import { Resource } from "@/models/Resource";
import { connectDB } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes = [
  "/",
  "/about",
  "/blogs",
  "/contact",
  "/resources",
  "/services",
  "/privacy",
  "/terms",
];

interface BlogSitemapRecord {
  slug: string;
  updatedAt: Date;
  publishedAt?: Date;
}

interface ResourceSitemapRecord {
  slug: string;
  updatedAt: Date;
  createdAt?: Date;
}

async function getPublishedBlogsForSitemap(): Promise<BlogSitemapRecord[]> {
  await connectDB();

  const rows = await Blog.find({ status: "published" })
    .select("slug updatedAt publishedAt")
    .sort({ publishedAt: -1 })
    .lean<BlogSitemapRecord[]>();

  return rows;
}

async function getPublishedResourcesForSitemap(): Promise<ResourceSitemapRecord[]> {
  await connectDB();

  const rows = await Resource.find({ status: "published" })
    .select("slug updatedAt createdAt")
    .sort({ updatedAt: -1 })
    .lean<ResourceSitemapRecord[]>();

  return rows;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let blogRows: BlogSitemapRecord[] = [];
  let resourceRows: ResourceSitemapRecord[] = [];

  try {
    const [blogs, resources] = await Promise.all([
      getPublishedBlogsForSitemap(),
      getPublishedResourcesForSitemap(),
    ]);
    blogRows = blogs;
    resourceRows = resources;
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production";
    const message =
      "SITEMAP: dynamic entries unavailable; serving static-only sitemap. Check MongoDB Atlas network access for this environment.";

    if (isProduction) {
      console.error(message, error);
    } else {
      console.warn(message, error);
    }
  }

  // Stable content-anchored date for static routes to avoid volatile millisecond changes on every request
  const latestBlogDate = blogRows[0]?.updatedAt ?? blogRows[0]?.publishedAt;
  const latestResourceDate = resourceRows[0]?.updatedAt ?? resourceRows[0]?.createdAt;
  const contentAnchorDate = latestBlogDate ?? latestResourceDate ?? new Date("2026-10-23T00:00:00.000Z");

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: absoluteUrl(path),
    lastModified: contentAnchorDate,
    changeFrequency: path === "/" || path === "/blogs" || path === "/resources" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/blogs" || path === "/resources" ? 0.9 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogRows.map((blog) => ({
    url: absoluteUrl(`/blogs/${blog.slug}`),
    lastModified: blog.updatedAt ?? blog.publishedAt ?? contentAnchorDate,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const resourceEntries: MetadataRoute.Sitemap = resourceRows.map((resource) => ({
    url: absoluteUrl(`/resources/${resource.slug}`),
    lastModified: resource.updatedAt ?? resource.createdAt ?? contentAnchorDate,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...blogEntries, ...resourceEntries];
}
