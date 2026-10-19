import mongoose, { Schema, Model, models } from "mongoose";

export interface BookmarkDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  blogId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<BookmarkDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

BookmarkSchema.index({ userId: 1, blogId: 1 }, { unique: true });

export const Bookmark: Model<BookmarkDocument> =
  models.Bookmark || mongoose.model<BookmarkDocument>("Bookmark", BookmarkSchema);

export default Bookmark;
