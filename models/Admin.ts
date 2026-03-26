import mongoose, { Schema, Model, models } from "mongoose";

export interface AdminDocument {
  email: string;
  createdAt: Date;
}

const AdminSchema = new Schema<AdminDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent model overwrite errors in dev / hot reload
const Admin: Model<AdminDocument> =
  models.Admin || mongoose.model<AdminDocument>("Admin", AdminSchema);

export default Admin;
