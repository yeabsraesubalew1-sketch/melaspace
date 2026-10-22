import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import { Types } from "mongoose";
import UploadedAsset, { AssetType, EntityType } from "@/models/UploadedAsset";
import {
  uploadToFileVault,
  getFileVaultApiKeyForRole,
  ADMIN_ROLES,
} from "@/lib/filevault";
import { normalizeMediaUrl } from "@/lib/media";

const EXPLORER_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ADMIN_MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB (approx 1073741824 bytes)
const EXPLORER_MAX_IMAGES_PER_PROPOSAL = 3;
const EXPLORER_MAX_FILES_PER_PROPOSAL = 3;

export const maxDuration = 300; // 5 minutes for large uploads

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: auth.status }
      );
    }

    const userRole = auth.session.user.role;
    const userId = auth.session.user.id;
    const isAdmin = ADMIN_ROLES.includes(userRole);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const assetType = (formData.get("assetType") as AssetType) || "file";
    const entityType = (formData.get("entityType") as EntityType) || (isAdmin ? "blog" : "proposal");
    const entityIdRaw = formData.get("entityId") as string | null;
    const clientCountRaw = formData.get("currentCount") as string | null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No file was uploaded." },
        { status: 400 }
      );
    }

    // 1. File Size Verification
    const maxAllowedSize = isAdmin ? ADMIN_MAX_FILE_SIZE : EXPLORER_MAX_FILE_SIZE;
    if (file.size > maxAllowedSize) {
      const limitLabel = isAdmin ? "1 GB" : "100 MB";
      return NextResponse.json(
        {
          success: false,
          error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of ${limitLabel}.`,
          code: "FILE_SIZE_LIMIT_EXCEEDED",
        },
        { status: 413 }
      );
    }

    await connectDB();

    // 2. Explorer Cap Verification (Max 3 Images, Max 3 Files per proposal)
    // NOTE: 'featured_image' is exempt from the 3-image cap per proposal.
    if (!isAdmin && (assetType === "image" || assetType === "file")) {
      const clientCount = clientCountRaw ? parseInt(clientCountRaw, 10) : 0;
      const maxAllowed =
        assetType === "image"
          ? EXPLORER_MAX_IMAGES_PER_PROPOSAL
          : EXPLORER_MAX_FILES_PER_PROPOSAL;

      if (clientCount >= maxAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Limit reached: Explorers can upload a maximum of ${maxAllowed} ${assetType}s per proposal.`,
            code: "EXPLORER_CAP_EXCEEDED",
          },
          { status: 400 }
        );
      }

      // If entityId is passed, check database attached assets as well
      if (entityIdRaw && Types.ObjectId.isValid(entityIdRaw)) {
        const existingCount = await UploadedAsset.countDocuments({
          entityType: "proposal",
          entityId: new Types.ObjectId(entityIdRaw),
          assetType,
          status: "attached",
        });

        if (existingCount >= maxAllowed) {
          return NextResponse.json(
            {
              success: false,
              error: `Limit reached: This proposal already has ${existingCount} attached ${assetType}s (maximum ${maxAllowed}).`,
              code: "EXPLORER_CAP_EXCEEDED",
            },
            { status: 400 }
          );
        }
      }
    }

    // 3. Select API Key & Upload to FileVault
    const apiKey = getFileVaultApiKeyForRole(userRole);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "FileVault storage is not configured on the server." },
        { status: 500 }
      );
    }

    const fileVaultRecord = await uploadToFileVault(file, file.name, apiKey);

    // 4. Record asset in MongoDB
    const entityObjectId =
      entityIdRaw && Types.ObjectId.isValid(entityIdRaw)
        ? new Types.ObjectId(entityIdRaw)
        : undefined;

    const uploadedAsset = await UploadedAsset.create({
      fileVaultId: fileVaultRecord.id,
      storageKey: fileVaultRecord.storage_key,
      url: fileVaultRecord.url,
      originalName: fileVaultRecord.original_name,
      mimeType: fileVaultRecord.mime_type,
      sizeBytes: fileVaultRecord.size_bytes,
      assetType,
      uploaderId: new Types.ObjectId(userId),
      uploaderRole: userRole,
      status: entityObjectId ? "attached" : "temp",
      entityType,
      entityId: entityObjectId,
    });

    const downloadUrl = `/api/uploads/download/${fileVaultRecord.id}`;
    const isImageLike = assetType === "image" || assetType === "featured_image";

    return NextResponse.json(
      {
        success: 1, // EditorJS success convention
        file: {
          id: fileVaultRecord.id,
          assetId: uploadedAsset._id.toString(),
          url: isImageLike ? normalizeMediaUrl(fileVaultRecord.url) : downloadUrl,
          downloadUrl,
          directUrl: fileVaultRecord.url,
          storage_key: fileVaultRecord.storage_key,
          original_name: fileVaultRecord.original_name,
          name: fileVaultRecord.original_name,
          title: fileVaultRecord.original_name,
          size_bytes: fileVaultRecord.size_bytes,
          size: fileVaultRecord.size_bytes,
          mime_type: fileVaultRecord.mime_type,
          extension: fileVaultRecord.original_name.split(".").pop() || "",
          assetType,
          isPrivate: assetType === "file",
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/uploads error:", error);

    const errorCode =
      (error as { code?: string })?.code ||
      (error as { cause?: { code?: string } })?.cause?.code;

    const isConnectTimeout =
      errorCode === "UND_ERR_CONNECT_TIMEOUT" || errorCode === "ETIMEDOUT";

    const message = isConnectTimeout
      ? "Connection to storage server timed out. Please check network connection or retry."
      : error instanceof Error
      ? error.message
      : "Upload failed";

    const status = (error as { status?: number })?.status || (isConnectTimeout ? 504 : 500);
    const code = isConnectTimeout ? "STORAGE_TIMEOUT" : errorCode || "STORAGE_ERROR";

    return NextResponse.json(
      {
        success: 0,
        error: message,
        code,
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
