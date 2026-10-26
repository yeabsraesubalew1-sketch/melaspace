import mongoose, { Schema, Model, models } from "mongoose";
import type { UserRole } from "@/models/User";

export interface CommentDocument extends mongoose.Document {
  blogId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorRoleAtCreation: UserRole;
  displayAsMelaTeam: boolean;
  content: string;
  parentId?: mongoose.Types.ObjectId | null;
  replyTo?: {
    userId?: mongoose.Types.ObjectId;
    name?: string;
  };
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  replyCount: number;
  isDeleted: boolean;
  deletedBy?: mongoose.Types.ObjectId;
  deletedByRole?: UserRole;
  deletedReason?: "by_author" | "by_moderation";
  isPinned: boolean;
  pinnedAt?: Date;
  pinnedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<CommentDocument>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorRoleAtCreation: {
      type: String,
      enum: ["root_admin", "super_admin", "manager", "author", "user"],
      default: "user",
    },
    displayAsMelaTeam: {
      type: Boolean,
      default: false,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    replyTo: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
        trim: true,
      },
    },
    likes: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deletedByRole: {
      type: String,
      enum: ["root_admin", "super_admin", "manager", "author", "user"],
    },
    deletedReason: {
      type: String,
      enum: ["by_author", "by_moderation"],
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    pinnedAt: {
      type: Date,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for sorting and tree retrieval
CommentSchema.index({ blogId: 1, parentId: 1, isPinned: -1, createdAt: -1 });
CommentSchema.index({ blogId: 1, parentId: 1, isPinned: -1, likesCount: -1 });
CommentSchema.index({ parentId: 1, createdAt: 1 });

if (process.env.NODE_ENV !== "production") {
  delete (models as Record<string, unknown>).Comment;
}

export const Comment: Model<CommentDocument> =
  models.Comment || mongoose.model<CommentDocument>("Comment", CommentSchema);

export default Comment;
