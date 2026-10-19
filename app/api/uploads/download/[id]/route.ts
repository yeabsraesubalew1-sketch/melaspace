import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UploadedAsset from "@/models/UploadedAsset";
import { Blog } from "@/models/Blog";
import Proposal from "@/models/Proposal";
import {
  downloadFileVaultStream,
  ADMIN_ROLES,
  getFileVaultApiKeyForRole,
} from "@/lib/filevault";

interface Params {
  id: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const fileVaultId = parseInt(id, 10);

    if (isNaN(fileVaultId) || fileVaultId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid file id" },
        { status: 400 }
      );
    }

    await connectDB();

    const asset = await UploadedAsset.findOne({ fileVaultId });
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    const userId = session?.user?.id;
    const isAdmin = Boolean(userRole && ADMIN_ROLES.includes(userRole));

    // Access authorization check
    let isAuthorized = false;
    let isPublished = false;

    // Rule 1: Admins can always download any file
    if (isAdmin) {
      isAuthorized = true;
    }

    if (asset) {
      if (asset.entityType === "blog" && asset.entityId) {
        const blog = await Blog.findById(asset.entityId).select("status").lean();
        if (blog && blog.status === "published") {
          isAuthorized = true;
          isPublished = true;
        }
      } else if (asset.entityType === "proposal" && asset.entityId) {
        const proposal = await Proposal.findById(asset.entityId)
          .select("userId status blogId")
          .lean();

        if (proposal) {
          if (proposal.status === "approved") {
            isAuthorized = true;
            isPublished = true;
          } else if (userId && proposal.userId.toString() === userId) {
            isAuthorized = true;
          }
        }
      } else if (asset.status === "temp") {
        if (userId && asset.uploaderId.toString() === userId) {
          isAuthorized = true;
        }
      }
    } else {
      // If asset metadata is not yet in MongoDB, allow admins as safety fallback
      if (isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: This file is private and only accessible to administrators or the document author.",
        },
        { status: 403 }
      );
    }

    // Use admin key if available or uploader's role key
    const apiKey = getFileVaultApiKeyForRole(isAdmin ? "super_admin" : asset?.uploaderRole);
    const streamResponse = await downloadFileVaultStream(fileVaultId, apiKey);

    const headers = new Headers();
    const contentType =
      asset?.mimeType ||
      streamResponse.headers.get("content-type") ||
      "application/octet-stream";
    const filename = asset?.originalName || `download-${fileVaultId}`;

    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    const contentLength =
      asset?.sizeBytes?.toString() || streamResponse.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    if (isPublished) {
      headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=43200");
    } else {
      headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    }

    return new Response(streamResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("GET /api/uploads/download/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
