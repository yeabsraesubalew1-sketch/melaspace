import { z } from "zod";

// -----------------------------
// Inquiry Schema
// -----------------------------
export const inquirySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .trim(),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),

  reasons: z
    .array(z.string().min(1))
    .min(1, "Select at least one reason")
    .max(5, "Too many selections"),

  message: z
    .string()
    .min(1, "Message is required")
    .max(2000, "Message is too long")
    .trim(),

  wantsReply: z.boolean(),

  source: z
    .string()
    .max(100, "Source is too long")
    .optional()
    .or(z.literal("")),

  allowTestimonial: z.boolean(),

  // 🛡️ Honeypot field (MUST stay empty)
  honeypot: z
    .string()
    .optional()
    .refine((val) => !val, {
      message: "Spam detected",
    }),
});

// -----------------------------
// Type Inference
// -----------------------------
export type InquiryInput = z.infer<typeof inquirySchema>;