import mongoose, { Schema, Model } from "mongoose";
import type { EditorContent } from "@/types/editor";
import "@/models/Category";
import "@/models/User";

export interface BlogDocument extends mongoose.Document {
  title: string;
  slug: string;
  excerpt: string;
  content: EditorContent;
  categories: mongoose.Types.ObjectId[];
  status: "draft" | "published";
  publishedAt?: Date;
  author?: mongoose.Types.ObjectId;
  authorName?: string;
  isAnonymous?: boolean;
  lastEditedBy?: mongoose.Types.ObjectId;
  isPinned?: boolean;
  views?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<BlogDocument>(
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
      index: true,
    },

    excerpt: {
      type: String,
      required: true,
      maxlength: 300,
    },

    content: {
      type: Schema.Types.Mixed, // Editor.js JSON
      required: true,
    },

    categories: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      default: undefined,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    authorName: {
      type: String,
      default: "Mela Team",
      trim: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);


BlogSchema.pre("save", async function () {
  // Pinned blogs must be published; drafts are automatically unpinned
  if (this.status !== "published") {
    this.isPinned = false;
  }

  if (!this.categories || this.categories.length === 0) {
    const Category = mongoose.models.Category;
    if (!Category) return;

    let other = await Category.findOne({ slug: "other" });

    if (!other) {
      other = await Category.create({ name: "Other", slug: "other" });
    }

    this.categories = [other._id];
  }
});




if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as Record<string, unknown>).Blog;
}

// Prevent model overwrite on hot reload
export const Blog: Model<BlogDocument> =
  mongoose.models.Blog || mongoose.model<BlogDocument>("Blog", BlogSchema);


