import { z } from "zod";

// -----------------------------
// Waitlist Schema
// -----------------------------
export const waitlistSchema = z.object({
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

  phone: z
    .string()
    .max(50, "Phone number is too long")
    .optional()
    .or(z.literal("")),

  country: z
    .string()
    .max(100, "Country is too long")
    .optional()
    .or(z.literal("")),

  goals: z
    .array(z.string().min(1))
    .min(1, "Select at least one goal")
    .max(6, "Too many selections"),

  message: z
    .string()
    .max(2000, "Message is too long")
    .optional()
    .or(z.literal("")),

  // 🛡️ Honeypot
  honeypot: z
    .string()
    .optional()
    .refine((val) => !val, {
      message: "Spam detected",
    }),
});

export const waitlistStatusSchema = z.object({
  status: z.enum(["new", "interested", "dismissed"]),
});

// -----------------------------
// Type Inference
// -----------------------------
export type WaitlistInput = z.infer<typeof waitlistSchema>;