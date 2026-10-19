import mongoose, { Schema, Model, models } from "mongoose";
import type { EditorContent } from "@/types/editor";
import "@/models/User";
import "@/models/Blog";

export type ProposalStatus = "pending" | "approved" | "rejected";
export type ProposalType = "new" | "revision";

export interface ProposalDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  excerpt?: string;
  content: EditorContent | string; // Editor.js JSON or text
  suggestedCategories: string[];
  status: ProposalStatus;
  type: ProposalType;
  targetBlogId?: mongoose.Types.ObjectId;
  adminFeedback?: string;
  isAnonymous?: boolean;
  blogId?: mongoose.Types.ObjectId;
  blogSlug?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<ProposalDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    excerpt: {
      type: String,
      maxlength: 300,
      trim: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    suggestedCategories: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    type: {
      type: String,
      enum: ["new", "revision"],
      default: "new",
      index: true,
    },
    targetBlogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
    },
    blogSlug: {
      type: String,
    },
    adminFeedback: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as Record<string, unknown>).Proposal;
}

export const Proposal: Model<ProposalDocument> =
  models.Proposal || mongoose.model<ProposalDocument>("Proposal", ProposalSchema);

export default Proposal;
