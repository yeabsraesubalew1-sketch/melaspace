import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { Blog } from "@/models/Blog";
import UploadedAsset from "@/models/UploadedAsset";
import { Types } from "mongoose";
import type { ResourceItem, PaginationMeta } from "@/types/api";

const ALLOWED_ADMIN_ROLES = ["root_admin", "super_admin", "manager"];

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function getUniqueSlug(baseText: string, currentId?: string): Promise<string> {
  const base = slugify(baseText) || "resource";
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await Resource.findOne({ slug }).select("_id").lean();
    if (!existing || (currentId && existing._id.toString() === currentId)) {
      return slug;
    }
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admins and Managers only" },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
        { "files.label": { $regex: q, $options: "i" } },
        { "files.originalName": { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [resources, total, publishedCount, draftCount, trashedCount] = await Promise.all([
      Resource.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resource.countDocuments(filter),
      Resource.countDocuments({ status: "published" }),
      Resource.countDocuments({ status: "draft" }),
      Resource.countDocuments({ status: "trashed" }),
    ]);

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
      authorId: r.authorId?.toString(),
      authorName: r.authorName || "Mela Team",
      linkedBlogIds: r.linkedBlogIds?.map((id) => id.toString()) || [],
      trashedAt: r.trashedAt?.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    const meta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };

    return NextResponse.json({
      success: true,
      data: items,
      meta,
      counts: {
        all: publishedCount + draftCount + trashedCount,
        published: publishedCount,
        draft: draftCount,
        trashed: trashedCount,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/resources error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin resources" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole) || !userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admins and Managers only" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const {
      title,
      slug: rawSlug,
      excerpt,
      description,
      category,
      tags = [],
      coverImage,
      files = [],
      status = "published",
      linkedBlogIds = [],
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    if (!excerpt?.trim()) {
      return NextResponse.json(
        { success: false, error: "Excerpt is required" },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Description is required" },
        { status: 400 }
      );
    }

    if (!category?.trim()) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one file must be attached" },
        { status: 400 }
      );
    }

    const uniqueSlug = await getUniqueSlug(rawSlug || title);

    const validBlogObjectIds = Array.isArray(linkedBlogIds)
      ? linkedBlogIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id))
      : [];

    const newResource = await Resource.create({
      title: title.trim(),
      slug: uniqueSlug,
      excerpt: excerpt.trim(),
      description: description.trim(),
      category: category.trim(),
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      coverImage: coverImage?.url ? coverImage : undefined,
      files: files.map((f: { label: string; fileVaultId: number; storageKey: string; originalName: string; mimeType: string; sizeBytes: number; extension?: string }) => ({
        label: f.label?.trim() || f.originalName,
        fileVaultId: Number(f.fileVaultId),
        storageKey: f.storageKey,
        originalName: f.originalName,
        mimeType: f.mimeType || "application/octet-stream",
        sizeBytes: Number(f.sizeBytes) || 0,
        extension: (f.extension || f.originalName?.split(".").pop() || "bin").toLowerCase(),
      })),
      status: ["draft", "published"].includes(status) ? status : "published",
      authorId: new Types.ObjectId(userId),
      authorName: session.user.name || "Mela Team",
      linkedBlogIds: validBlogObjectIds,
    });

    // Mark assets as attached in UploadedAsset
    const fileVaultIds = newResource.files.map((f) => f.fileVaultId);
    if (coverImage?.fileVaultId) {
      fileVaultIds.push(coverImage.fileVaultId);
    }

    await UploadedAsset.updateMany(
      { fileVaultId: { $in: fileVaultIds } },
      {
        $set: {
          status: "attached",
          entityType: "resource",
          entityId: newResource._id,
        },
      }
    );

    // If linked blogs were selected, link them back to this resource
    if (validBlogObjectIds.length > 0) {
      await Blog.updateMany(
        { _id: { $in: validBlogObjectIds } },
        { $addToSet: { linkedResourceIds: newResource._id } }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newResource._id.toString(),
        slug: newResource.slug,
        title: newResource.title,
      },
      message: "Resource created successfully",
    });
  } catch (error) {
    console.error("POST /api/admin/resources error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create resource";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
