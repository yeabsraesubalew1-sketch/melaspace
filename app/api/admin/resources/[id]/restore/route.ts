import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { restoreFileVaultFile, getFileVaultApiKeyForRole } from "@/lib/filevault";
import { Types } from "mongoose";

const ALLOWED_ADMIN_ROLES = ["root_admin", "super_admin", "manager"];

interface Params {
  id: string;
}

export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const targetStatus = body?.status === "draft" ? "draft" : "published";

    resource.status = targetStatus;
    resource.trashedAt = undefined;
    await resource.save();

    // Restore files on FileVault
    const apiKey = getFileVaultApiKeyForRole("super_admin");
    for (const file of resource.files || []) {
      if (file.fileVaultId) {
        await restoreFileVaultFile(file.fileVaultId, apiKey).catch((e) =>
          console.error(`Restore fileVault error for ${file.fileVaultId}:`, e)
        );
      }
    }
    if (resource.coverImage?.fileVaultId) {
      await restoreFileVaultFile(resource.coverImage.fileVaultId, apiKey).catch((e) =>
        console.error(`Restore cover fileVault error for ${resource.coverImage?.fileVaultId}:`, e)
      );
    }

    return NextResponse.json({
      success: true,
      message: `Resource restored to ${targetStatus}`,
      data: {
        id: resource._id.toString(),
        slug: resource.slug,
        title: resource.title,
        status: resource.status,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/resources/[id]/restore error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to restore resource" },
      { status: 500 }
    );
  }
}
