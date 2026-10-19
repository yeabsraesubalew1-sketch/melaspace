import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import UploadedAsset, { EntityType } from "@/models/UploadedAsset";
import { trashFileVaultFile, getFileVaultApiKeyForRole } from "@/lib/filevault";

interface BlockCandidate {
  type?: string;
  data?: Record<string, unknown>;
}

/**
 * Extracts FileVault file IDs from an Editor.js blocks array.
 */
export function extractFileVaultIdsFromBlocks(blocks: unknown): number[] {
  if (!Array.isArray(blocks)) return [];

  const fileIds: number[] = [];

  for (const block of blocks as BlockCandidate[]) {
    if (!block || typeof block !== "object" || !block.data) continue;

    // Check image or file/attaches blocks
    const data = block.data;
    const candidateId =
      data.fileVaultId ??
      (data.file && typeof data.file === "object" ? (data.file as Record<string, unknown>).id : undefined) ??
      data.id;

    if (typeof candidateId === "number" && candidateId > 0) {
      fileIds.push(candidateId);
    } else if (typeof candidateId === "string" && /^\d+$/.test(candidateId)) {
      fileIds.push(parseInt(candidateId, 10));
    }
  }

  return Array.from(new Set(fileIds));
}

/**
 * Syncs assets when a blog or proposal is saved (created, drafted, updated, or published).
 * - Attaches currently used assets.
 * - Trashes any previously attached assets that were removed from the document.
 */
export async function syncEntityAssets(
  entityType: EntityType,
  entityId: string | Types.ObjectId,
  blocks: unknown,
  userRole?: string
): Promise<{ attachedCount: number; trashedCount: number }> {
  try {
    await connectDB();

    const normalizedEntityId =
      typeof entityId === "string" && Types.ObjectId.isValid(entityId)
        ? new Types.ObjectId(entityId)
        : (entityId as Types.ObjectId);

    const activeFileVaultIds = extractFileVaultIdsFromBlocks(blocks);
    const apiKey = getFileVaultApiKeyForRole(userRole);

    // 1. Mark currently used assets as attached to this entity
    let attachedCount = 0;
    if (activeFileVaultIds.length > 0) {
      const updateResult = await UploadedAsset.updateMany(
        {
          fileVaultId: { $in: activeFileVaultIds },
          status: { $in: ["temp", "attached"] },
        },
        {
          $set: {
            status: "attached",
            entityType,
            entityId: normalizedEntityId,
          },
        }
      );
      attachedCount = updateResult.modifiedCount;
    }

    // 2. Find any assets previously attached to this entity that are NO LONGER in activeFileVaultIds
    const orphanedAssets = await UploadedAsset.find({
      entityType,
      entityId: normalizedEntityId,
      status: "attached",
      fileVaultId: { $nin: activeFileVaultIds },
    });

    let trashedCount = 0;
    if (orphanedAssets.length > 0) {
      await Promise.allSettled(
        orphanedAssets.map(async (asset) => {
          const ok = await trashFileVaultFile(asset.fileVaultId, apiKey);
          if (ok) {
            asset.status = "trashed";
            await asset.save();
            trashedCount++;
          }
        })
      );
    }

    return { attachedCount, trashedCount };
  } catch (error) {
    console.error(`[FILEVAULT] Error syncing assets for ${entityType} ${entityId}:`, error);
    return { attachedCount: 0, trashedCount: 0 };
  }
}

/**
 * Trashes all assets attached to a blog or proposal when it is deleted.
 */
export async function trashEntityAssets(
  entityType: EntityType,
  entityId: string | Types.ObjectId,
  userRole?: string
): Promise<number> {
  try {
    await connectDB();

    const normalizedEntityId =
      typeof entityId === "string" && Types.ObjectId.isValid(entityId)
        ? new Types.ObjectId(entityId)
        : (entityId as Types.ObjectId);

    const attachedAssets = await UploadedAsset.find({
      entityType,
      entityId: normalizedEntityId,
      status: "attached",
    });

    if (attachedAssets.length === 0) return 0;

    const apiKey = getFileVaultApiKeyForRole(userRole);
    let trashedCount = 0;

    await Promise.allSettled(
      attachedAssets.map(async (asset) => {
        const ok = await trashFileVaultFile(asset.fileVaultId, apiKey);
        if (ok) {
          asset.status = "trashed";
          await asset.save();
          trashedCount++;
        }
      })
    );

    return trashedCount;
  } catch (error) {
    console.error(`[FILEVAULT] Error trashing assets for ${entityType} ${entityId}:`, error);
    return 0;
  }
}

/**
 * Sweeps any temporary assets older than maxAgeHours that were never attached to any document.
 */
export async function sweepAbandonedTempAssets(maxAgeHours = 4): Promise<number> {
  try {
    await connectDB();

    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const staleTempAssets = await UploadedAsset.find({
      status: "temp",
      createdAt: { $lt: cutoff },
    }).limit(50);

    if (staleTempAssets.length === 0) return 0;

    let trashedCount = 0;
    await Promise.allSettled(
      staleTempAssets.map(async (asset) => {
        const apiKey = getFileVaultApiKeyForRole(asset.uploaderRole);
        const ok = await trashFileVaultFile(asset.fileVaultId, apiKey);
        if (ok) {
          asset.status = "trashed";
          await asset.save();
          trashedCount++;
        }
      })
    );

    return trashedCount;
  } catch (error) {
    console.error("[FILEVAULT] Error sweeping abandoned temp assets:", error);
    return 0;
  }
}
