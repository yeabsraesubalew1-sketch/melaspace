import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { downloadFileVaultStream, getFileVaultApiKeyForRole } from "@/lib/filevault";
import { Types } from "mongoose";

const ADMIN_ROLES = ["root_admin", "super_admin", "manager"];

interface Params {
  slug: string;
}

export const maxDuration = 300; // 5 minutes for downloading large resource files

export async function GET(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Resource identifier is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const isObjectId = Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ slug }, { _id: new Types.ObjectId(slug) }] } : { slug };

    const resource = await Resource.findOne(query);

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    const isPublished = resource.status === "published";
    if (!isPublished) {
      const session = await getServerSession(authOptions);
      const userRole = session?.user?.role;
      const isAdmin = Boolean(userRole && ADMIN_ROLES.includes(userRole));

      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "This resource is currently not available for public download.",
          },
          { status: 403 }
        );
      }
    }

    if (!resource.files || resource.files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No file attachments found on this resource" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const fileVaultIdParam = searchParams.get("fileVaultId");
    const indexParam = searchParams.get("index");

    let targetFile = resource.files[0];

    if (fileVaultIdParam) {
      const parsedId = parseInt(fileVaultIdParam, 10);
      const matched = resource.files.find((f) => f.fileVaultId === parsedId);
      if (matched) {
        targetFile = matched;
      }
    } else if (indexParam !== null) {
      const parsedIndex = parseInt(indexParam, 10);
      if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < resource.files.length) {
        targetFile = resource.files[parsedIndex];
      }
    }

    // Atomically increment download count if public or published
    if (isPublished) {
      Resource.findByIdAndUpdate(resource._id, { $inc: { downloadCount: 1 } }).exec();
    }

    // Download stream from FileVault using admin API key for reliable bandwidth
    const apiKey = getFileVaultApiKeyForRole("super_admin");
    const streamResponse = await downloadFileVaultStream(targetFile.fileVaultId, apiKey);

    const filename = targetFile.originalName || `${resource.slug}.${targetFile.extension || "bin"}`;
    const contentType = targetFile.mimeType || streamResponse.headers.get("content-type") || "application/octet-stream";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    if (targetFile.sizeBytes) {
      headers.set("Content-Length", String(targetFile.sizeBytes));
    } else {
      const cl = streamResponse.headers.get("content-length");
      if (cl) headers.set("Content-Length", cl);
    }

    if (isPublished) {
      headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=43200");
    } else {
      headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    }

    return new Response(streamResponse.body as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("GET /api/resources/[slug]/download error:", error);
    const msg = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
