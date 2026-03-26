"use client";

import { useState } from "react";
import { inquirySchema, type InquiryInput } from "@/lib/validators/inquiry";
import toast from "react-hot-toast";

// -----------------------------
// Constants
// -----------------------------
const REASONS = [
  "Coaching / Mentoring",
  "Collaboration",
  "Feedback on content/service",
  "Question or comment",
  "Speaking / Workshop",
  "Other",
];

// -----------------------------
// Initial State
// -----------------------------
const initialForm: InquiryInput = {
  name: "",
  email: "",
  reasons: [],
  message: "",
  wantsReply: false,
  source: "",
  allowTestimonial: false,
  honeypot: "",
};

export default function InquiryForm() {
  const [form, setForm] = useState<InquiryInput>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof InquiryInput, string>>
  >({});
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleReasonToggle = (reason: string) => {
    setForm((prev) => {
      const exists = prev.reasons.includes(reason);

      return {
        ...prev,
        reasons: exists
          ? prev.reasons.filter((r) => r !== reason)
          : [...prev.reasons, reason],
      };
    });
  };

  // -----------------------------
  // Validation
  // -----------------------------
  const validate = () => {
    const result = inquirySchema.safeParse(form);

    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: Partial<Record<keyof InquiryInput, string>> = {};

    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof InquiryInput;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    });

    setErrors(fieldErrors);
    return false;
  };

  // -----------------------------
  // Submit
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/forms/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success("Message sent successfully!");

      setForm(initialForm);
      setErrors({});
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="card p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Inquiry & Feedback</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Honeypot */}
        <input
          type="text"
          name="honeypot"
          value={form.honeypot}
          onChange={handleChange}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Name */}
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input mt-1"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium">Email Address</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="input mt-1"
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Reasons */}
        <div>
          <label className="text-sm font-medium">
            I’m reaching out for:
          </label>
          <div className="mt-2 space-y-2">
            {REASONS.map((reason) => (
              <label
                key={reason}
                className="flex gap-2 items-start text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.reasons.includes(reason)}
                  onChange={() => handleReasonToggle(reason)}
                />
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-admin-check-border bg-background peer-checked:bg-admin-check-fill"
                >
                  {form.reasons.includes(reason) && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 text-foreground"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span>{reason}</span>
              </label>
            ))}
          </div>
          {errors.reasons && (
            <p className="text-sm text-red-500 mt-1">{errors.reasons}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium">
            Your Message or Feedback
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            className="input mt-1 min-h-30"
          />
          {errors.message && (
            <p className="text-sm text-red-500 mt-1">{errors.message}</p>
          )}
        </div>

        {/* Wants Reply */}
        <label className="flex gap-2 items-start cursor-pointer">
          <input
            type="checkbox"
            name="wantsReply"
            className="sr-only peer"
            checked={form.wantsReply}
            onChange={handleChange}
          />
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-admin-check-border bg-background peer-checked:bg-admin-check-fill"
          >
            {form.wantsReply && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 text-foreground"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </span>
          <span className="text-sm">I’d like a reply</span>
        </label>

        {/* Source */}
        <div>
          <label className="text-sm font-medium">
            How did you hear about me? (optional)
          </label>
          <input
            name="source"
            value={form.source || ""}
            onChange={handleChange}
            className="input mt-1"
          />
          {errors.source && (
            <p className="text-sm text-red-500 mt-1">{errors.source}</p>
          )}
        </div>

        {/* Testimonial */}
        <label className="flex gap-2 items-start cursor-pointer">
          <input
            type="checkbox"
            name="allowTestimonial"
            className="sr-only peer"
            checked={form.allowTestimonial}
            onChange={handleChange}
          />
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-admin-check-border bg-background peer-checked:bg-admin-check-fill"
          >
            {form.allowTestimonial && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 text-foreground"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </span>
          <span className="text-sm">
            I allow this to be used as a testimonial (first name only)
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Sending..." : "Submit"}
        </button>
      </form>
    </div>
  );
}