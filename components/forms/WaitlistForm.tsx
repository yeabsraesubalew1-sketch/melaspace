"use client";

import { useState } from "react";
import { waitlistSchema, type WaitlistInput } from "@/lib/validators/waitlist";
import toast from "react-hot-toast";

// -----------------------------
// Constants
// -----------------------------
const GOALS = [
  "Clarity and confidence building",
  "Focus and productivity",
  "Navigating life transitions",
  "Emotional resilience and self-regulation",
  "Purpose and values alignment",
  "Goal-setting and accountability",
  "Other",
];

// -----------------------------
// Initial State
// -----------------------------
const initialForm: WaitlistInput = {
  name: "",
  email: "",
  phone: "",
  country: "",
  goals: [],
  message: "",
  honeypot: "",
};

export default function WaitlistForm() {
  const [form, setForm] = useState<WaitlistInput>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof WaitlistInput, string>>
  >({});
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGoalToggle = (goal: string) => {
    setForm((prev) => {
      const exists = prev.goals.includes(goal);

      return {
        ...prev,
        goals: exists
          ? prev.goals.filter((g) => g !== goal)
          : [...prev.goals, goal],
      };
    });
  };

  // -----------------------------
  // Validation
  // -----------------------------
  const validate = () => {
    const result = waitlistSchema.safeParse(form);

    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: Partial<Record<keyof WaitlistInput, string>> = {};

    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof WaitlistInput;
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
      const res = await fetch("/api/forms/waitlist", {
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

      toast.success("You’ve been added to the waitlist!");

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
      <h2 className="text-xl font-semibold mb-4">Join Coaching Waitlist</h2>

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

        {/* Phone */}
        <div>
          <label className="text-sm font-medium">
            Phone (optional)
          </label>
          <input
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            className="input mt-1"
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="text-sm font-medium">
            Country (optional)
          </label>
          <input
            name="country"
            value={form.country || ""}
            onChange={handleChange}
            className="input mt-1"
          />
          {errors.country && (
            <p className="text-sm text-red-500 mt-1">{errors.country}</p>
          )}
        </div>

        {/* Goals */}
        <div>
          <label className="text-sm font-medium">
            What are you looking for?
          </label>
          <div className="mt-2 space-y-2">
            {GOALS.map((goal) => (
              <label
                key={goal}
                className="flex gap-2 items-start text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.goals.includes(goal)}
                  onChange={() => handleGoalToggle(goal)}
                />
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-admin-check-border bg-background peer-checked:bg-admin-check-fill"
                >
                  {form.goals.includes(goal) && (
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
                <span>{goal}</span>
              </label>
            ))}
          </div>
          {errors.goals && (
            <p className="text-sm text-red-500 mt-1">{errors.goals}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium">
            Tell us more (optional)
          </label>
          <textarea
            name="message"
            value={form.message || ""}
            onChange={handleChange}
            className="input mt-1 min-h-30"
          />
          {errors.message && (
            <p className="text-sm text-red-500 mt-1">{errors.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Submitting..." : "Join Waitlist"}
        </button>
      </form>
    </div>
  );
}