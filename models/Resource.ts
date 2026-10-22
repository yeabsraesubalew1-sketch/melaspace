import mongoose, { Schema, Model, models } from "mongoose";
import "@/models/User";
import "@/models/Blog";

export interface ResourceFile {
  label: string;
  fileVaultId: number;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  extension: string;
}

export interface ResourceCoverImage {
  url: string;
  alt?: string;
  fileVaultId?: number;
}

export type ResourceStatus = "draft" | "published" | "trashed";

export interface ResourceDocument extends mongoose.Document {
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  category: string;
  tags: string[];
  coverImage?: ResourceCoverImage;
  files: ResourceFile[];
  downloadCount: number;
  status: ResourceStatus;
  authorId: mongoose.Types.ObjectId;
  authorName?: string;
  linkedBlogIds: mongoose.Types.ObjectId[];
  trashedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceFileSchema = new Schema<ResourceFile>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    fileVaultId: {
      type: Number,
      required: true,
      index: true,
    },
    storageKey: {
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
    extension: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false }
);

const ResourceCoverImageSchema = new Schema<ResourceCoverImage>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
    },
    fileVaultId: {
      type: Number,
    },
  },
  { _id: false }
);

const ResourceSchema = new Schema<ResourceDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    coverImage: {
      type: ResourceCoverImageSchema,
      default: undefined,
    },
    files: {
      type: [ResourceFileSchema],
      required: true,
      validate: {
        validator: (v: ResourceFile[]) => Array.isArray(v) && v.length > 0,
        message: "A resource must contain at least one file attachment.",
      },
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published", "trashed"],
      default: "draft",
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      trim: true,
      default: "Mela Team",
    },
    linkedBlogIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Blog",
        },
      ],
      default: [],
    },
    trashedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Full text indexing for title, excerpt, description, tags and category
ResourceSchema.index({
  title: "text",
  excerpt: "text",
  description: "text",
  tags: "text",
  category: "text",
});

export const Resource: Model<ResourceDocument> =
  models.Resource || mongoose.model<ResourceDocument>("Resource", ResourceSchema);

export default Resource;
