import type { MetadataRoute } from "next";
import { Blog } from "@/models/Blog";
import { connectDB } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes = [
  "/",
  "/about",
  "/blogs",
  "/contact",
  "/resources",
  "/services",
];

interface BlogSitemapRecord {
  slug: string;
  updatedAt: Date;
  publishedAt?: Date;
}

async function getPublishedBlogsForSitemap(): Promise<BlogSitemapRecord[]> {
  await connectDB();

  const rows = await Blog.find({ status: "published" })
    .select("slug updatedAt publishedAt")
    .sort({ publishedAt: -1 })
    .lean<BlogSitemapRecord[]>();

  return rows;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/blogs" ? 0.9 : 0.7,
  }));

  const blogRows = await getPublishedBlogsForSitemap();

  const blogEntries: MetadataRoute.Sitemap = blogRows.map((blog) => ({
    url: absoluteUrl(`/blogs/${blog.slug}`),
    lastModified: blog.updatedAt ?? blog.publishedAt ?? now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...blogEntries];
}
