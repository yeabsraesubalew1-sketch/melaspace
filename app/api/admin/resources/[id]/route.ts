import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { Blog } from "@/models/Blog";
import UploadedAsset from "@/models/UploadedAsset";
import {
  trashFileVaultFile,
  purgeFileVaultFile,
  getFileVaultApiKeyForRole,
} from "@/lib/filevault";
import { Types } from "mongoose";
import type { ResourceItem } from "@/types/api";

const ALLOWED_ADMIN_ROLES = ["root_admin", "super_admin", "manager"];

interface Params {
  id: string;
}

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admins and Managers only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Resource ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const isObjectId = Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: new Types.ObjectId(id) }, { slug: id }] } : { slug: id };

    const resource = await Resource.findOne(query).lean();
    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    const linkedBlogDocs = await Blog.find({
      $or: [
        { _id: { $in: resource.linkedBlogIds || [] } },
        { linkedResourceIds: resource._id },
      ],
    })
      .select("title slug excerpt status")
      .lean();

    const data: ResourceItem = {
      id: resource._id.toString(),
      title: resource.title,
      slug: resource.slug,
      excerpt: resource.excerpt,
      description: resource.description,
      category: resource.category,
      tags: resource.tags || [],
      coverImage: resource.coverImage,
      files: resource.files || [],
      downloadCount: resource.downloadCount || 0,
      status: resource.status,
      authorName: resource.authorName || "Mela Team",
      linkedBlogIds: resource.linkedBlogIds?.map((bid) => bid.toString()) || [],
      linkedBlogs: linkedBlogDocs.map((b) => ({
        id: b._id.toString(),
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        status: b.status,
      })),
      trashedAt: resource.trashedAt?.toISOString(),
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/admin/resources/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resource" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admins and Managers only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid resource ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const resource = await Resource.findById(id);
    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      title,
      slug: rawSlug,
      excerpt,
      description,
      category,
      tags,
      coverImage,
      files,
      status,
      linkedBlogIds,
    } = body;

    if (title !== undefined) {
      if (!title?.trim()) {
        return NextResponse.json(
          { success: false, error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      resource.title = title.trim();
    }

    if (rawSlug !== undefined || title !== undefined) {
      const slugCandidate = rawSlug || resource.title;
      resource.slug = await getUniqueSlug(slugCandidate, resource._id.toString());
    }

    if (excerpt !== undefined) {
      resource.excerpt = excerpt.trim();
    }

    if (description !== undefined) {
      resource.description = description.trim();
    }

    if (category !== undefined) {
      resource.category = category.trim();
    }

    if (tags !== undefined) {
      resource.tags = Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [];
    }

    if (coverImage !== undefined) {
      resource.coverImage = coverImage?.url ? coverImage : undefined;
    }

    if (files !== undefined) {
      if (!Array.isArray(files) || files.length === 0) {
        return NextResponse.json(
          { success: false, error: "At least one file must be attached" },
          { status: 400 }
        );
      }
      resource.files = files.map((f: { label: string; fileVaultId: number; storageKey: string; originalName: string; mimeType: string; sizeBytes: number; extension?: string }) => ({
        label: f.label?.trim() || f.originalName,
        fileVaultId: Number(f.fileVaultId),
        storageKey: f.storageKey,
        originalName: f.originalName,
        mimeType: f.mimeType || "application/octet-stream",
        sizeBytes: Number(f.sizeBytes) || 0,
        extension: (f.extension || f.originalName?.split(".").pop() || "bin").toLowerCase(),
      }));
    }

    if (status !== undefined && ["draft", "published", "trashed"].includes(status)) {
      resource.status = status;
      if (status === "trashed" && !resource.trashedAt) {
        resource.trashedAt = new Date();
      } else if (status !== "trashed") {
        resource.trashedAt = undefined;
      }
    }

    // Handle linkedBlogIds
    const previousBlogIds = (resource.linkedBlogIds || []).map((b) => b.toString());
    let nextBlogIds = previousBlogIds;

    if (linkedBlogIds !== undefined) {
      const validBlogObjectIds = Array.isArray(linkedBlogIds)
        ? linkedBlogIds.filter((bid) => Types.ObjectId.isValid(bid)).map((bid) => new Types.ObjectId(bid))
        : [];
      resource.linkedBlogIds = validBlogObjectIds;
      nextBlogIds = validBlogObjectIds.map((b) => b.toString());

      // Blogs to unlink
      const unlinkedIds = previousBlogIds.filter((pid) => !nextBlogIds.includes(pid));
      if (unlinkedIds.length > 0) {
        await Blog.updateMany(
          { _id: { $in: unlinkedIds.map((bid) => new Types.ObjectId(bid)) } },
          { $pull: { linkedResourceIds: resource._id } }
        );
      }

      // Blogs to link
      const newlyLinkedIds = nextBlogIds.filter((nid) => !previousBlogIds.includes(nid));
      if (newlyLinkedIds.length > 0) {
        await Blog.updateMany(
          { _id: { $in: newlyLinkedIds.map((bid) => new Types.ObjectId(bid)) } },
          { $addToSet: { linkedResourceIds: resource._id } }
        );
      }
    }

    await resource.save();

    // Attach any updated assets
    const fileVaultIds = resource.files.map((f) => f.fileVaultId);
    if (resource.coverImage?.fileVaultId) {
      fileVaultIds.push(resource.coverImage.fileVaultId);
    }

    await UploadedAsset.updateMany(
      { fileVaultId: { $in: fileVaultIds } },
      {
        $set: {
          status: "attached",
          entityType: "resource",
          entityId: resource._id,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Resource updated successfully",
      data: {
        id: resource._id.toString(),
        slug: resource.slug,
        title: resource.title,
      },
    });
  } catch (error) {
    console.error("PUT /api/admin/resources/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Failed to update resource";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admins and Managers only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid resource ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const resource = await Resource.findById(id);
    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const isPurge = searchParams.get("purge") === "true";
    const apiKey = getFileVaultApiKeyForRole("super_admin");

    if (isPurge) {
      // 1. Purge files on FileVault
      for (const file of resource.files || []) {
        if (file.fileVaultId) {
          await purgeFileVaultFile(file.fileVaultId, apiKey).catch((e) =>
            console.error(`Purge fileVault error for ${file.fileVaultId}:`, e)
          );
        }
      }
      if (resource.coverImage?.fileVaultId) {
        await purgeFileVaultFile(resource.coverImage.fileVaultId, apiKey).catch((e) =>
          console.error(`Purge cover fileVault error for ${resource.coverImage?.fileVaultId}:`, e)
        );
      }

      // 2. Unlink from all blogs
      await Blog.updateMany(
        { linkedResourceIds: resource._id },
        { $pull: { linkedResourceIds: resource._id } }
      );

      // 3. Delete UploadedAsset records
      await UploadedAsset.deleteMany({
        entityType: "resource",
        entityId: resource._id,
      });

      // 4. Delete document
      await Resource.findByIdAndDelete(resource._id);

      return NextResponse.json({
        success: true,
        message: "Resource permanently purged",
      });
    }

    // Soft Delete (move to trash)
    resource.status = "trashed";
    resource.trashedAt = new Date();
    await resource.save();

    // Trash in FileVault
    for (const file of resource.files || []) {
      if (file.fileVaultId) {
        await trashFileVaultFile(file.fileVaultId, apiKey).catch((e) =>
          console.error(`Trash fileVault error for ${file.fileVaultId}:`, e)
        );
      }
    }
    if (resource.coverImage?.fileVaultId) {
      await trashFileVaultFile(resource.coverImage.fileVaultId, apiKey).catch((e) =>
        console.error(`Trash cover fileVault error for ${resource.coverImage?.fileVaultId}:`, e)
      );
    }

    return NextResponse.json({
      success: true,
      message: "Resource moved to trash",
    });
  } catch (error) {
    console.error("DELETE /api/admin/resources/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
