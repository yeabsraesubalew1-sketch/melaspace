import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Resource } from "@/models/Resource";
import type { ResourceItem, PaginationMeta } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "9", 10)));
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const format = searchParams.get("format")?.trim().toLowerCase() || "";
    const tag = searchParams.get("tag")?.trim() || "";

    const filter: Record<string, unknown> = {
      status: "published",
    };

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
        { category: { $regex: q, $options: "i" } },
        { "files.label": { $regex: q, $options: "i" } },
        { "files.originalName": { $regex: q, $options: "i" } },
      ];
    }

    if (category && category.toLowerCase() !== "all") {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    if (format) {
      filter["files.extension"] = format;
    }

    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resource.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const items: ResourceItem[] = resources.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      description: r.description,
      category: r.category,
      tags: r.tags || [],
      coverImage: r.coverImage,
      files: r.files || [],
      downloadCount: r.downloadCount || 0,
      status: r.status,
      authorName: r.authorName || "Mela Team",
      linkedBlogIds: r.linkedBlogIds?.map((id) => id.toString()) || [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    const meta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
    };

    return NextResponse.json({
      success: true,
      data: items,
      meta,
    });
  } catch (error) {
    console.error("GET /api/resources error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
