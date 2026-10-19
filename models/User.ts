import mongoose, { Schema, Model, models } from "mongoose";

export type UserRole = "root_admin" | "super_admin" | "manager" | "author" | "user";
export type UserStatus = "active" | "kicked";

export interface UserDocument extends mongoose.Document {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  tokenVersion: number;
  bio?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Explorer",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["root_admin", "super_admin", "manager", "author", "user"],
      default: "user",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "kicked"],
      default: "active",
      index: true,
    },
    tokenVersion: {
      type: Number,
      default: 1,
    },
    bio: {
      type: String,
      maxlength: 300,
      trim: true,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite on dev / hot reload
export const User: Model<UserDocument> =
  models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;
