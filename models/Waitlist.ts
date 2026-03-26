import mongoose, { Schema, Model } from "mongoose";

export interface WaitlistDocument extends mongoose.Document {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  goals: string[];
  message?: string;
  status: "new" | "interested" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistSchema = new Schema<WaitlistDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      required: false,
      maxlength: 50,
      trim: true,
    },

    country: {
      type: String,
      required: false,
      maxlength: 100,
      trim: true,
    },

    goals: {
      type: [String],
      required: true,
    },

    message: {
      type: String,
      required: false,
      maxlength: 2000,
      trim: true,
    },

    status: {
      type: String,
      enum: ["new", "interested", "dismissed"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite on hot reload
export const Waitlist: Model<WaitlistDocument> =
  mongoose.models.Waitlist ||
  mongoose.model<WaitlistDocument>("Waitlist", WaitlistSchema);