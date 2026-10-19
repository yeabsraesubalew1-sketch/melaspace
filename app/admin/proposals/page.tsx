"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Renderer from "@/components/editorjs/Renderer";
import type { EditorContent } from "@/types/editor";

interface ProposalDoc {
  _id: string;
  title: string;
  excerpt?: string;
  content: EditorContent | string;
  suggestedCategories: string[];
  status: "pending" | "approved" | "rejected";
  type?: "new" | "revision";
  targetBlogId?: {
    _id?: string;
    title?: string;
    slug?: string;
  };
  adminFeedback?: string;
  isAnonymous?: boolean;
  blogId?: string;
  blogSlug?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  reviewedBy?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  reviewedAt?: string;
  createdAt: string;
}

export default function AdminProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proposals?all=true");
      const json = await res.json();
      if (res.ok && json.success) {
        setProposals(json.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const feedback = feedbackInput[id]?.trim() || undefined;
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminFeedback: feedback }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to update proposal`);
      }

      toast.success(json.message || `Proposal ${status}`);
      await fetchProposals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update proposal");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this proposal permanently?")) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete proposal");
      }

      toast.success("Proposal deleted");
      setProposals((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete proposal");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (filterStatus === "all") return true;
    return p.status === filterStatus;
  });

  const pendingCount = proposals.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Post Proposals</h1>
          <p className="text-sm text-foreground/60">
            Review article ideas and rich drafts submitted by community explorers.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 text-xs">
          {(["pending", "approved", "rejected", "all"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition cursor-pointer ${
                filterStatus === status
                  ? "bg-foreground text-background"
                  : "text-foreground/70 hover:bg-surface-muted"
              }`}
            >
              {status === "pending" ? `Pending (${pendingCount})` : status}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl border border-border bg-surface-muted animate-pulse" />
          ))}
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="rounded-xl border border-border/70 bg-surface-muted/30 p-12 text-center">
          <p className="text-base font-semibold text-foreground/80">No proposals found</p>
          <p className="text-xs text-foreground/50 mt-1">
            {filterStatus === "pending"
              ? "All caught up! No pending proposals awaiting review."
              : `No proposals with status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((prop) => {
            const authorName = prop.userId?.name || "Explorer";
            const authorEmail = prop.userId?.email || "";
            const isProcessing = Boolean(actionLoading[prop._id]);
            const isEditorContent =
              typeof prop.content === "object" && prop.content !== null && "blocks" in prop.content;

            return (
              <div
                key={prop._id}
                className="rounded-xl border border-border bg-background p-5 shadow-sm space-y-4 transition hover:border-foreground/30"
              >
                {/* Proposal Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="flex flex-wrap items-center gap-2">
                    {prop.isAnonymous ? (
                      <span className="font-semibold text-sm text-foreground">
                        Anonymous
                        <span className="text-xs font-normal text-foreground/50 ml-1.5">
                          (by {authorName} {authorEmail ? `• ${authorEmail}` : ""})
                        </span>
                      </span>
                    ) : (
                      <span className="font-semibold text-sm text-foreground">
                        {authorName}
                        {authorEmail && (
                          <span className="text-xs text-foreground/50 font-normal ml-1">
                            ({authorEmail})
                          </span>
                        )}
                      </span>
                    )}

                    <span className="text-xs text-foreground/40">•</span>
                    <span className="text-xs text-foreground/50">
                      {new Date(prop.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {prop.type === "revision" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        Revision Proposal
                      </span>
                    )}

                    {prop.status === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    )}
                    {prop.status === "approved" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approved &amp; Live
                      </span>
                    )}
                    {prop.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Rejected
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(prop._id)}
                      disabled={isProcessing}
                      className="text-xs px-2 py-1 rounded text-foreground/50 hover:text-rose-500 transition cursor-pointer"
                      title="Delete proposal"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Target Blog Link if Revision */}
                {prop.type === "revision" && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between gap-2">
                    <span>
                      Proposed changes for existing published blog: <strong>{prop.title}</strong>
                    </span>
                    {prop.blogSlug && (
                      <a
                        href={`/blogs/${prop.blogSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline hover:opacity-80"
                      >
                        View Live Post ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Content */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground leading-snug">
                    {prop.title}
                  </h3>
                  {prop.excerpt && (
                    <p className="text-xs text-foreground/60 italic mt-1">
                      Summary: {prop.excerpt}
                    </p>
                  )}

                  {/* Render Editor.js or Text content */}
                  <div className="mt-3 rounded-xl border border-border/60 bg-surface-muted/30 p-4 max-h-72 overflow-y-auto">
                    {isEditorContent ? (
                      <Renderer
                        content={{
                          time: (prop.content as Partial<EditorContent>).time ?? Date.now(),
                          version: (prop.content as Partial<EditorContent>).version ?? "2.31.3",
                          blocks: (prop.content as { blocks: EditorContent["blocks"] }).blocks ?? [],
                        }}
                        openLinksInNewTab
                      />
                    ) : (
                      <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed font-mono">
                        {String(prop.content)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories & Anonymous flag */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/60">
                  {prop.suggestedCategories?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">Categories:</span>
                      {prop.suggestedCategories.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-full bg-surface-muted border border-border text-[11px]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {prop.isAnonymous && (
                    <span className="px-2 py-0.5 rounded-full bg-surface-muted border border-border text-[11px] text-foreground/50 italic">
                      Public author: &ldquo;Anonymous&rdquo;
                    </span>
                  )}
                </div>

                {/* Blame / Audit info */}
                {prop.reviewedBy && (
                  <div className="rounded-lg bg-surface-muted/40 p-2.5 text-xs border border-border/60 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-foreground/70">
                      {prop.status === "approved" ? "Approved" : "Reviewed"} by{" "}
                      <strong className="text-foreground">{prop.reviewedBy.name}</strong>{" "}
                      <span className="text-foreground/50">({prop.reviewedBy.role?.replace("_", " ")})</span>
                      {prop.reviewedAt && (
                        <span className="text-foreground/50 ml-1">
                          on{" "}
                          {new Date(prop.reviewedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </span>

                    {prop.status === "approved" && prop.blogSlug && (
                      <a
                        href={`/blogs/${prop.blogSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium underline text-foreground hover:opacity-80"
                      >
                        Live Blog (/blogs/{prop.blogSlug}) ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Feedback Display if already exists */}
                {prop.adminFeedback && (
                  <div className="rounded-lg bg-surface-muted/60 p-2.5 text-xs border-l-2 border-foreground/40">
                    <span className="font-semibold block text-[11px] text-foreground/80">Admin Feedback:</span>
                    <p className="text-foreground/70 italic">&ldquo;{prop.adminFeedback}&rdquo;</p>
                  </div>
                )}

                {/* Action Area */}
                <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="Add or update reviewer feedback for author..."
                    value={feedbackInput[prop._id] ?? prop.adminFeedback ?? ""}
                    onChange={(e) =>
                      setFeedbackInput((prev) => ({ ...prev, [prop._id]: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none transition focus:border-foreground/50"
                  />

                  <div className="flex items-center gap-2">
                    {prop.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(prop._id, "rejected")}
                          disabled={isProcessing}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(prop._id, "approved")}
                          disabled={isProcessing}
                          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                        >
                          {prop.type === "revision" ? "Approve & Update Live Blog" : "Approve & Publish Live"}
                        </button>
                      </>
                    )}

                    {prop.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(prop._id, "rejected")}
                        disabled={isProcessing}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
                      >
                        Revoke Approval (Set to Draft)
                      </button>
                    )}

                    {prop.status === "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(prop._id, "approved")}
                        disabled={isProcessing}
                        className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                      >
                        {prop.type === "revision" ? "Re-approve & Update Live Blog" : "Re-approve & Publish Live"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
