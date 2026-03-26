"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  reasons: string[];
  message: string;
  wantsReply: boolean;
  source?: string;
  status: "new" | "interested" | "dismissed";
  allowTestimonial: boolean;
  createdAt: string;
}

interface Props {
  inquiry: Inquiry;
}

export default function InquiryCard({ inquiry }: Props) {
  const [status, setStatus] = useState(inquiry.status);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // -------------------------
  // PATCH handler
  // -------------------------
  async function updateStatus(newStatus: Inquiry["status"]) {
    if (loading || newStatus === status) return;

    const prevStatus = status;

    setStatus(newStatus);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/forms/inquiry/${inquiry._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to update");
      }

      toast.success("Status updated");
    } catch (err) {
      console.error(err);
      setStatus(prevStatus);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // Status styles
  // -------------------------
  const statusStyles = {
    new: "bg-yellow-100 text-yellow-700 border-yellow-300",
    interested: "bg-green-100 text-green-700 border-green-300",
    dismissed: "bg-gray-100 text-gray-600 border-gray-300",
  };

  // -------------------------
  // Actions
  // -------------------------
  function renderActions() {
    switch (status) {
      case "new":
        return (
          <>
            <button
              onClick={() => updateStatus("interested")}
              disabled={loading}
              className="btn btn-primary"
            >
              Mark Interested
            </button>

            <button
              onClick={() => updateStatus("dismissed")}
              disabled={loading}
              className="btn btn-ghost border"
            >
              Dismiss
            </button>
          </>
        );

      case "interested":
        return (
          <>
            <button
              onClick={() => updateStatus("dismissed")}
              disabled={loading}
              className="btn btn-ghost border"
            >
              Dismiss
            </button>

            <button
              onClick={() => updateStatus("new")}
              disabled={loading}
              className="btn btn-secondary"
            >
              Revert
            </button>
          </>
        );

      case "dismissed":
        return (
          <button
            onClick={() => updateStatus("interested")}
            disabled={loading}
            className="btn btn-primary"
          >
            Mark Interested
          </button>
        );
    }
  }

  // -------------------------
  // Format date
  // -------------------------
  function formatDate(date: string) {
    return new Date(date).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // -------------------------
  // Message logic
  // -------------------------
  const isLong = inquiry.message.length > 180;

  return (
    <div className="card p-4 flex flex-col gap-4">
      <div className="flex justify-between items-start gap-4">
        {/* LEFT */}
        <div className="space-y-2">
          <div>
            <p className="font-medium">{inquiry.name}</p>

            <a
              href={`mailto:${inquiry.email}?subject=Mela Space Inquiry`}
              className="text-sm text-primary underline"
            >
              {inquiry.email}
            </a>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-xs text-foreground/60">
            {inquiry.source && <span>Source: {inquiry.source}</span>}
            <span>
              {inquiry.wantsReply ? "Wants reply" : "No reply"}
            </span>
            <span>{formatDate(inquiry.createdAt)}</span>
          </div>

          {/* Reasons */}
          {inquiry.reasons?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {inquiry.reasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded-full bg-admin-chip-bg border border-admin-chip-border"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Message */}
          <div className="text-sm text-foreground/70 mt-2">
            <p className={expanded ? "" : "line-clamp-3"}>
              {inquiry.message}
            </p>

            {isLong && (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="text-xs text-primary mt-1 underline hover:cursor-pointer"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <span
          className={`text-xs px-2 py-1 rounded border ${statusStyles[status]}`}
        >
          {status}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 flex-wrap">{renderActions()}</div>
    </div>
  );
}