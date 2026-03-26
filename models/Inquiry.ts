import mongoose, { Schema, Model } from "mongoose";

export interface InquiryDocument extends mongoose.Document {
  name: string;
  email: string;
  reasons: string[];
  message: string;
  wantsReply: boolean;
  source?: string;
  status: "new" | "interested" | "dismissed";
  allowTestimonial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<InquiryDocument>(
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

    reasons: {
      type: [String],
      required: true,
    },

    message: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },

    wantsReply: {
      type: Boolean,
      required: true,
    },

    source: {
      type: String,
      required: false,
      maxlength: 100,
      trim: true,
    },

    status: {
      type: String,
      enum: ["new", "interested", "dismissed"],
      default: "new",
    },

    allowTestimonial: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite on hot reload
export const Inquiry: Model<InquiryDocument> =
  mongoose.models.Inquiry ||
  mongoose.model<InquiryDocument>("Inquiry", InquirySchema);