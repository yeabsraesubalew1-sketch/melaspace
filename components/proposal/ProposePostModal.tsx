"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { OutputData } from "@editorjs/editorjs";

const Editor = dynamic(() => import("@/components/admin/Editor"), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-xl border border-border bg-surface-muted animate-pulse flex items-center justify-center text-xs text-foreground/50">
      Loading Editor...
    </div>
  ),
});

interface ApprovedCategory {
  _id: string;
  name: string;
  slug: string;
}

interface ProposalItem {
  _id: string;
  title: string;
  excerpt?: string;
  content: OutputData | string;
  suggestedCategories: string[];
  status: "pending" | "approved" | "rejected";
  type?: "new" | "revision";
  targetBlogId?: {
    _id?: string;
    title?: string;
    slug?: string;
  } | string;
  adminFeedback?: string;
  isAnonymous?: boolean;
  blogId?: string;
  blogSlug?: string;
  reviewedBy?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  reviewedAt?: string;
  createdAt: string;
}

interface ProposePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProposePostModal({
  isOpen,
  onClose,
}: ProposePostModalProps) {
  const [activeTab, setActiveTab] = useState<"new" | "list">("new");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<OutputData>({ blocks: [] });
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [approvedCategories, setApprovedCategories] = useState<ApprovedCategory[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revision state (proposing a change for an approved live blog)
  const [revisionTargetBlogId, setRevisionTargetBlogId] = useState<string | null>(null);
  const [revisionBlogTitle, setRevisionBlogTitle] = useState<string | null>(null);
  const [revisionBlogSlug, setRevisionBlogSlug] = useState<string | null>(null);
  const [isResubmittingRejected, setIsResubmittingRejected] = useState(false);

  // Management / List state
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch approved categories
  useEffect(() => {
    if (!isOpen) return;
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories?all=true");
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) {
          setApprovedCategories(json.data);
        }
      } catch (err) {
        console.error("Failed to load approved categories:", err);
      }
    };
    loadCategories();
  }, [isOpen]);

  const fetchProposals = useCallback(async () => {
    setIsLoadingProposals(true);
    try {
      const res = await fetch("/api/proposals");
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setProposals(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch proposals", err);
    } finally {
      setIsLoadingProposals(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProposals();
    }
  }, [isOpen, fetchProposals]);

  if (!isOpen) return null;

  const pendingCount = proposals.filter((p) => p.status === "pending").length;
  const approvedCount = proposals.filter((p) => p.status === "approved").length;
  const rejectedCount = proposals.filter((p) => p.status === "rejected").length;

  const filteredProposals = proposals.filter((p) => {
    if (filterStatus === "all") return true;
    return p.status === filterStatus;
  });

  const handleToggleApprovedCategory = (categoryName: string) => {
    if (categories.includes(categoryName)) {
      setCategories(categories.filter((c) => c !== categoryName));
    } else {
      if (categories.length >= 5) {
        toast.error("Maximum 5 categories per proposal");
        return;
      }
      setCategories([...categories, categoryName]);
    }
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Category already added");
      return;
    }
    if (categories.length >= 5) {
      toast.error("Maximum 5 categories per proposal");
      return;
    }
    setCategories([...categories, trimmed]);
    setCustomCategoryInput("");
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const resetForm = () => {
    setEditingProposalId(null);
    setRevisionTargetBlogId(null);
    setRevisionBlogTitle(null);
    setRevisionBlogSlug(null);
    setIsResubmittingRejected(false);
    setTitle("");
    setExcerpt("");
    setContent({ blocks: [] });
    setCategories([]);
    setIsAnonymous(false);
  };

  // Regular edit for pending proposal
  const handleEditClick = (prop: ProposalItem) => {
    if (prop.status !== "pending") {
      toast.error("Only pending proposals can be edited in place.");
      return;
    }
    setEditingProposalId(prop._id);
    setRevisionTargetBlogId(null);
    setRevisionBlogTitle(null);
    setRevisionBlogSlug(null);
    setIsResubmittingRejected(false);

    setTitle(prop.title);
    setExcerpt(prop.excerpt || "");
    setIsAnonymous(Boolean(prop.isAnonymous));

    if (typeof prop.content === "object" && prop.content !== null && "blocks" in prop.content) {
      setContent(prop.content as OutputData);
    } else if (typeof prop.content === "string") {
      setContent({
        blocks: [{ type: "paragraph", data: { text: prop.content } }],
      });
    } else {
      setContent({ blocks: [] });
    }

    setCategories(prop.suggestedCategories || []);
    setActiveTab("new");
  };

  // "Propose a Change" for an approved post
  const handleProposeChange = (prop: ProposalItem) => {
    const targetId =
      prop.blogId ||
      (typeof prop.targetBlogId === "object" && prop.targetBlogId?._id
        ? prop.targetBlogId._id
        : typeof prop.targetBlogId === "string"
          ? prop.targetBlogId
          : prop._id);

    if (!targetId) {
      toast.error("Cannot find the target article to propose changes for.");
      return;
    }

    setEditingProposalId(null);
    setIsResubmittingRejected(false);
    setRevisionTargetBlogId(targetId);
    setRevisionBlogTitle(prop.title);
    setRevisionBlogSlug(prop.blogSlug || null);

    setTitle(prop.title);
    setExcerpt(prop.excerpt || "");
    setIsAnonymous(Boolean(prop.isAnonymous));

    if (typeof prop.content === "object" && prop.content !== null && "blocks" in prop.content) {
      setContent(prop.content as OutputData);
    } else if (typeof prop.content === "string") {
      setContent({
        blocks: [{ type: "paragraph", data: { text: prop.content } }],
      });
    } else {
      setContent({ blocks: [] });
    }

    setCategories(prop.suggestedCategories || []);
    setActiveTab("new");
  };

  // "Revise & Resubmit" for rejected proposal
  const handleReviseAndResubmit = (prop: ProposalItem) => {
    setEditingProposalId(null);
    setRevisionTargetBlogId(null);
    setRevisionBlogTitle(null);
    setRevisionBlogSlug(null);
    setIsResubmittingRejected(true);

    setTitle(prop.title);
    setExcerpt(prop.excerpt || "");
    setIsAnonymous(Boolean(prop.isAnonymous));

    if (typeof prop.content === "object" && prop.content !== null && "blocks" in prop.content) {
      setContent(prop.content as OutputData);
    } else if (typeof prop.content === "string") {
      setContent({
        blocks: [{ type: "paragraph", data: { text: prop.content } }],
      });
    } else {
      setContent({ blocks: [] });
    }

    setCategories(prop.suggestedCategories || []);
    setActiveTab("new");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete / withdraw this proposal?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete proposal");
      }

      toast.success("Proposal removed successfully");
      setProposals((prev) => prev.filter((p) => p._id !== id));
      if (editingProposalId === id) {
        resetForm();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete proposal");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.blocks || content.blocks.length === 0) {
      toast.error("Content is required. Please add some content in the editor.");
      return;
    }

    const currentImages = (content.blocks || []).filter((b) => b.type === "image").length;
    const currentFiles = (content.blocks || []).filter((b) => b.type === "file" || b.type === "attaches").length;

    if (currentImages > 3) {
      toast.error("Limit exceeded: Explorers can upload a maximum of 3 images per proposal.");
      return;
    }
    if (currentFiles > 3) {
      toast.error("Limit exceeded: Explorers can upload a maximum of 3 files per proposal.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEditing = Boolean(editingProposalId);
      const url = isEditing ? `/api/proposals/${editingProposalId}` : "/api/proposals";
      const method = isEditing ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        suggestedCategories: categories,
        isAnonymous,
      };

      if (!isEditing && revisionTargetBlogId) {
        payload.type = "revision";
        payload.targetBlogId = revisionTargetBlogId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            (isEditing
              ? "Failed to update proposal"
              : revisionTargetBlogId
                ? "Failed to submit proposed changes"
                : "Failed to submit proposal")
        );
      }

      toast.success(
        json.message ||
          (isEditing
            ? "Proposal updated successfully!"
            : revisionTargetBlogId
              ? "Proposed changes submitted for editor review!"
              : "Post proposal submitted for admin review!")
      );

      resetForm();
      await fetchProposals();
      setActiveTab("list");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-border bg-background p-6 shadow-xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Propose a Blog Post</h2>
            <p className="text-xs text-foreground/60 mt-0.5">
              Submit ideas &amp; revisions for our editorial team. Active pending: {pendingCount}/3.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-surface-muted hover:text-foreground transition cursor-pointer"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "new"
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-surface-muted"
            }`}
          >
            {editingProposalId ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Pending Proposal</span>
              </>
            ) : revisionTargetBlogId ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Propose a Change</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Proposal</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "list"
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-surface-muted"
            }`}
          >
            <span>My Proposals</span>
            {proposals.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "list"
                    ? "bg-background/20 text-background"
                    : "bg-surface-muted text-foreground"
                }`}
              >
                {proposals.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents: Scrollable Area */}
        <div className="flex-1 overflow-y-auto pr-1 mt-2">
          {activeTab === "new" ? (
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* Revision Banner */}
              {revisionTargetBlogId && (
                <div className="flex items-center justify-between rounded-lg bg-blue-500/10 border border-blue-500/20 px-3.5 py-2.5 text-xs text-blue-700 dark:text-blue-300">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">Proposing changes for published article:</span>
                    <span>{revisionBlogTitle || "Live Article"}</span>
                    {revisionBlogSlug && (
                      <Link
                        href={`/blogs/${revisionBlogSlug}`}
                        target="_blank"
                        className="text-[11px] underline hover:opacity-80 mt-0.5"
                      >
                        View Live Article ↗
                      </Link>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="font-medium underline hover:opacity-80 cursor-pointer ml-3 shrink-0"
                  >
                    Cancel Revision
                  </button>
                </div>
              )}

              {/* Rejected Re-submission Banner */}
              {isResubmittingRejected && (
                <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                  <span>
                    Revising previously rejected proposal. Submitting will send a fresh proposal for review.
                  </span>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="font-medium underline hover:opacity-80 cursor-pointer ml-3 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Pending Edit Banner */}
              {editingProposalId && (
                <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  <span>Editing pending proposal</span>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="font-medium underline hover:opacity-80 cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="proposal-title" className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                  Proposed Title *
                </label>
                <input
                  id="proposal-title"
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Web Architecture Patterns for 2026"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-foreground/50 focus:ring-1 focus:ring-foreground/50"
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label htmlFor="proposal-excerpt" className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                  Summary / Excerpt (optional)
                </label>
                <input
                  id="proposal-excerpt"
                  type="text"
                  maxLength={300}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief 1-2 sentence overview of what this post covers"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-foreground/50 focus:ring-1 focus:ring-foreground/50"
                />
              </div>

              {/* Categories: Approved Pills + Custom Input */}
              <div className="space-y-2 rounded-xl border border-border bg-surface-muted/30 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                    Categories (Pick from approved or add custom)
                  </label>
                  <span className="text-[11px] text-foreground/50">{categories.length}/5 selected</span>
                </div>

                {/* Approved Category Pills */}
                {approvedCategories.length > 0 && (
                  <div>
                    <span className="text-[11px] text-foreground/60 block mb-1.5">Approved categories:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {approvedCategories.map((cat) => {
                        const isSelected = categories.includes(cat.name);
                        return (
                          <button
                            key={cat._id}
                            type="button"
                            onClick={() => handleToggleApprovedCategory(cat.name)}
                            className={`px-2.5 py-1 rounded-full text-xs transition cursor-pointer border ${
                              isSelected
                                ? "bg-foreground text-background border-foreground font-medium"
                                : "bg-background text-foreground/75 border-border hover:bg-surface-muted"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Category Input */}
                <div className="pt-1">
                  <span className="text-[11px] text-foreground/60 block mb-1">Add custom category:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomCategory();
                        }
                      }}
                      placeholder="Type a new category name..."
                      className="flex-1 rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs text-foreground outline-none transition focus:border-foreground/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface-muted transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Active Selected Categories */}
                {categories.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[11px] text-foreground/60 block mb-1">Attached to proposal:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-surface-muted border border-border text-foreground/80 font-medium"
                        >
                          {cat}
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat)}
                            className="hover:text-rose-500 transition ml-0.5 cursor-pointer text-xs"
                            aria-label={`Remove ${cat}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* EditorJS Canvas */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                    Article Draft / Outline *
                  </label>
                  {(() => {
                    const imgCount = (content.blocks || []).filter((b) => b.type === "image").length;
                    const flCount = (content.blocks || []).filter((b) => b.type === "file" || b.type === "attaches").length;
                    return (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                            imgCount >= 3
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold"
                              : "bg-surface-muted text-foreground/60 border-border"
                          }`}
                        >
                          Images: {imgCount}/3
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                            flCount >= 3
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold"
                              : "bg-surface-muted text-foreground/60 border-border"
                          }`}
                        >
                          Files: {flCount}/3
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <p className="text-xs text-foreground/50">
                  Format headings, bullet points, quotes, and upload up to 3 images and 3 files (max 100MB each).
                </p>
                <div className="min-h-[220px]">
                  <Editor
                    key={editingProposalId || revisionTargetBlogId || (isResubmittingRejected ? "revise" : "new-proposal")}
                    initialData={content}
                    onChange={setContent}
                  />
                </div>
              </div>

              {/* Anonymous Submission Toggle (Credited as "Anonymous", NOT "Mela Team") */}
              <div className="rounded-xl border border-border bg-surface-muted/30 p-3.5 flex items-start gap-3">
                <input
                  id="propose-anonymous"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-foreground focus:ring-1 focus:ring-foreground cursor-pointer"
                />
                <label htmlFor="propose-anonymous" className="text-xs space-y-0.5 cursor-pointer select-none">
                  <span className="font-medium text-foreground block">
                    Submit proposal anonymously as &ldquo;Anonymous&rdquo;
                  </span>
                  <span className="text-foreground/60 block">
                    If accepted and published, the article will publicly credit &ldquo;Anonymous&rdquo; instead of your display name. (&ldquo;Mela Team&rdquo; is reserved for platform staff). Editors can still review your submission history.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                {(editingProposalId || revisionTargetBlogId || isResubmittingRejected) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || (!editingProposalId && pendingCount >= 3)}
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingProposalId
                      ? "Update Proposal"
                      : revisionTargetBlogId
                        ? "Submit Proposed Changes"
                        : "Submit Proposal"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Explorer Submissions Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted/30 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterStatus("all")}
                    className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                      filterStatus === "all"
                        ? "bg-foreground text-background"
                        : "text-foreground/70 hover:bg-surface-muted"
                    }`}
                  >
                    All ({proposals.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus("pending")}
                    className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                      filterStatus === "pending"
                        ? "bg-foreground text-background"
                        : "text-foreground/70 hover:bg-surface-muted"
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus("approved")}
                    className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                      filterStatus === "approved"
                        ? "bg-foreground text-background"
                        : "text-foreground/70 hover:bg-surface-muted"
                    }`}
                  >
                    Approved ({approvedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus("rejected")}
                    className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                      filterStatus === "rejected"
                        ? "bg-foreground text-background"
                        : "text-foreground/70 hover:bg-surface-muted"
                    }`}
                  >
                    Rejected ({rejectedCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab("new");
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Proposal</span>
                </button>
              </div>

              {isLoadingProposals ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-xl border border-border bg-surface-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="rounded-xl border border-border/70 bg-surface-muted/30 p-8 text-center">
                  <p className="text-sm font-medium text-foreground/80">
                    {filterStatus === "all"
                      ? "No proposals submitted yet"
                      : `No proposals with status "${filterStatus}"`}
                  </p>
                  <p className="text-xs text-foreground/50 mt-1">
                    {filterStatus === "pending"
                      ? "You have no proposals awaiting editorial review."
                      : filterStatus === "approved"
                        ? "No approved posts yet. Submit an article idea to get featured!"
                        : filterStatus === "rejected"
                          ? "No rejected proposals."
                          : "Have an interesting idea or article draft? Propose your first blog post!"}
                  </p>
                  {filterStatus === "all" && (
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setActiveTab("new");
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface-muted transition cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Proposal
                    </button>
                  )}
                </div>
              ) : (
                filteredProposals.map((prop) => (
                  <div
                    key={prop._id}
                    className="rounded-xl border border-border bg-background p-4 shadow-xs transition space-y-3 hover:border-foreground/30"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {prop.type === "revision" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            Revision Proposal
                          </span>
                        )}

                        {prop.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Review
                          </span>
                        )}
                        {prop.status === "approved" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approved &amp; Published
                          </span>
                        )}
                        {prop.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Not Accepted
                          </span>
                        )}

                        <span className="text-[11px] text-foreground/50">
                          {new Date(prop.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2">
                        {/* Approved: Propose a Change + View Live Article */}
                        {prop.status === "approved" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleProposeChange(prop)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-surface-muted transition cursor-pointer"
                              title="Propose an edit or update for this published blog"
                            >
                              <svg className="h-3 w-3 text-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Propose a Change</span>
                            </button>

                            {prop.blogSlug && (
                              <Link
                                href={`/blogs/${prop.blogSlug}`}
                                onClick={onClose}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-foreground text-background hover:opacity-90 transition cursor-pointer"
                              >
                                <span>View Live</span>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </Link>
                            )}
                          </>
                        )}

                        {/* Rejected: Revise & Resubmit + Delete */}
                        {prop.status === "rejected" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReviseAndResubmit(prop)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-foreground text-background hover:opacity-90 transition cursor-pointer"
                              title="Revise content and send back as a fresh proposal"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Revise &amp; Resubmit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(prop._id)}
                              disabled={deletingId === prop._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
                            >
                              <span>{deletingId === prop._id ? "..." : "Delete"}</span>
                            </button>
                          </>
                        )}

                        {/* Pending: Edit + Withdraw */}
                        {prop.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditClick(prop)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-surface-muted transition cursor-pointer"
                            >
                              <svg className="h-3 w-3 text-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(prop._id)}
                              disabled={deletingId === prop._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
                            >
                              <span>{deletingId === prop._id ? "..." : "Withdraw"}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <h4 className="font-semibold text-sm sm:text-base text-foreground leading-snug">
                      {prop.title}
                    </h4>

                    {prop.excerpt && (
                      <p className="text-xs text-foreground/70 line-clamp-2">
                        {prop.excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {prop.suggestedCategories?.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-surface-muted text-foreground/70 border border-border"
                        >
                          {c}
                        </span>
                      ))}

                      {prop.isAnonymous && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-muted text-foreground/50 border border-border italic">
                          Public author: &ldquo;Anonymous&rdquo;
                        </span>
                      )}
                    </div>

                    {/* Blame / Reviewer Details */}
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
                      </div>
                    )}

                    {/* Admin Feedback Box */}
                    {prop.adminFeedback && (
                      <div className="mt-2 rounded-lg bg-surface-muted/80 p-2.5 border-l-2 border-foreground/30 text-xs">
                        <span className="font-semibold block text-[11px] text-foreground/80 mb-0.5">
                          Editorial Feedback:
                        </span>
                        <p className="text-foreground/70 italic">&ldquo;{prop.adminFeedback}&rdquo;</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
