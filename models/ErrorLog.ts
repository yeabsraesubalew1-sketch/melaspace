import mongoose, { Model, Schema } from "mongoose";

export interface ErrorLogDocument extends mongoose.Document {
  path: string;
  message: string;
  stack?: string;
  digest?: string;
  source?: "public" | "admin" | "global" | "api";
  context?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ErrorLogSchema = new Schema<ErrorLogDocument>(
  {
    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    stack: {
      type: String,
      required: false,
      maxlength: 15000,
    },
    digest: {
      type: String,
      required: false,
      maxlength: 300,
      index: true,
    },
    source: {
      type: String,
      enum: ["public", "admin", "global", "api"],
      required: false,
      index: true,
    },
    context: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ErrorLog: Model<ErrorLogDocument> =
  mongoose.models.ErrorLog ||
  mongoose.model<ErrorLogDocument>("ErrorLog", ErrorLogSchema);
