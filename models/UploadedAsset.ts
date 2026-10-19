import mongoose, { Schema, Model, models } from "mongoose";
import "@/models/User";

export type AssetType = "image" | "file";
export type AssetStatus = "temp" | "attached" | "trashed";
export type EntityType = "blog" | "proposal";

export interface UploadedAssetDocument extends mongoose.Document {
  fileVaultId: number;
  storageKey: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  assetType: AssetType;
  uploaderId: mongoose.Types.ObjectId;
  uploaderRole: string;
  status: AssetStatus;
  entityType?: EntityType;
  entityId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UploadedAssetSchema = new Schema<UploadedAssetDocument>(
  {
    fileVaultId: {
      type: Number,
      required: true,
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    assetType: {
      type: String,
      enum: ["image", "file"],
      required: true,
      index: true,
    },
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    uploaderRole: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["temp", "attached", "trashed"],
      default: "temp",
      index: true,
    },
    entityType: {
      type: String,
      enum: ["blog", "proposal"],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

UploadedAssetSchema.index({ uploaderId: 1, status: 1 });
UploadedAssetSchema.index({ entityType: 1, entityId: 1, status: 1 });

if (process.env.NODE_ENV !== "production") {
  delete (models as Record<string, unknown>).UploadedAsset;
}

export const UploadedAsset: Model<UploadedAssetDocument> =
  models.UploadedAsset ||
  mongoose.model<UploadedAssetDocument>("UploadedAsset", UploadedAssetSchema);

export default UploadedAsset;
