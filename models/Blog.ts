import mongoose, { Schema, Model } from "mongoose";
import type { EditorContent } from "@/types/editor";
import "@/models/Category";

export interface BlogDocument extends mongoose.Document {
  title: string;
  slug: string;
  excerpt: string;
  content: EditorContent;
  categories: mongoose.Types.ObjectId[];
  status: "draft" | "published";
  publishedAt?: Date;
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




// Prevent model overwrite on hot reload
export const Blog: Model<BlogDocument> =
  mongoose.models.Blog || mongoose.model<BlogDocument>("Blog", BlogSchema);


