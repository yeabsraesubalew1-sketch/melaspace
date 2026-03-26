"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface Waitlist {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  goals: string[] | string;
  preferredLanguage?: string;
  preferredFormat?: string;
  availability?: string;
  hasCoachingExperience?: boolean;
  source?: string;
  wantsUpdates?: boolean;
  message?: string;
  status: "new" | "interested" | "dismissed";
  createdAt: string;
}

interface Props {
  waitlist: Waitlist;
}

export default function WaitlistCard({ waitlist }: Props) {
  const [status, setStatus] = useState(waitlist.status);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // -------------------------
  // PATCH
  // -------------------------
  async function updateStatus(newStatus: Waitlist["status"]) {
    if (loading || newStatus === status) return;

    const prev = status;
    setStatus(newStatus);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/forms/waitlist/${waitlist._id}`,
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
        throw new Error(json.error || "Failed");
      }

      toast.success("Status updated");
    } catch (err) {
      console.error(err);
      setStatus(prev);
      toast.error("Failed to update");
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
  // Date
  // -------------------------
  function formatDate(date: string) {
    return new Date(date).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const goalTags = Array.isArray(waitlist.goals)
    ? waitlist.goals.map((goal) => String(goal).trim()).filter(Boolean)
    : typeof waitlist.goals === "string"
      ? waitlist.goals
          .split(/[,\n]/)
          .map((goal) => goal.trim())
          .filter(Boolean)
      : [];

  const isLongMessage = (waitlist.message?.length ?? 0) > 180;

  return (
    <div className="card p-4 flex flex-col gap-4">
      <div className="flex justify-between items-start gap-4">
        {/* LEFT */}
        <div className="space-y-2">
          {/* Name + Email */}
          <div>
            <p className="font-medium">{waitlist.name}</p>

            <a
              href={`mailto:${waitlist.email}?subject=Mela Space Coaching`}
              className="text-sm text-primary underline"
            >
              {waitlist.email}
            </a>

            {waitlist.phone && (
              <p className="text-xs text-foreground/60 mt-1">
                {waitlist.phone}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-xs text-foreground/60">
            <span>{waitlist.country}</span>
            {waitlist.source && <span>Source: {waitlist.source}</span>}
            <span>
              {waitlist.wantsUpdates ? "Subscribed" : "No updates"}
            </span>
            <span>{formatDate(waitlist.createdAt)}</span>
          </div>

          {/* Preferences */}
          <div className="flex flex-wrap gap-2 text-xs">
            {waitlist.preferredLanguage && (
              <span className="px-2 py-1 rounded-full bg-admin-chip-bg border border-admin-chip-border">
                {waitlist.preferredLanguage}
              </span>
            )}

            {waitlist.preferredFormat && (
              <span className="px-2 py-1 rounded-full bg-admin-chip-bg border border-admin-chip-border">
                {waitlist.preferredFormat}
              </span>
            )}

            {waitlist.hasCoachingExperience !== undefined && (
              <span className="px-2 py-1 rounded-full bg-admin-chip-bg border border-admin-chip-border">
                {waitlist.hasCoachingExperience
                  ? "Has experience"
                  : "No experience"}
              </span>
            )}
          </div>

          {/* Goals */}
          {goalTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {goalTags.map((goal) => (
                <span
                  key={goal}
                  className="text-xs px-2 py-1 rounded-full bg-admin-chip-bg border border-admin-chip-border"
                >
                  {goal}
                </span>
              ))}
            </div>
          )}

          {/* Message */}
          {waitlist.message && (
            <div className="text-sm text-foreground/70 mt-2">
              <p className={expanded ? "" : "line-clamp-3"}>
                {waitlist.message}
              </p>

              {isLongMessage && (
                <button
                  onClick={() => setExpanded((prev) => !prev)}
                  className="text-xs text-primary mt-1 underline hover:cursor-pointer"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}
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