"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import ResourceModal from "@/components/admin/ResourceModal";
import type { ResourceItem } from "@/types/api";

const ALLOWED_ADMIN_ROLES = ["root_admin", "super_admin", "manager"];

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function AdminResourcesPage() {
  const { data: session, status: authStatus } = useSession();

  const [activeTab, setActiveTab] = useState<"published" | "draft" | "trashed">("published");
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, published: 0, draft: 0, trashed: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);

  const userRole = session?.user?.role;
  const isAllowed = userRole && ALLOWED_ADMIN_ROLES.includes(userRole);

  const fetchResources = useCallback(async () => {
    if (!isAllowed) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        limit: "50",
      });
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/admin/resources?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setResources(json.data || []);
        if (json.counts) {
          setCounts(json.counts);
        }
      } else {
        toast.error(json.error || "Failed to load resources");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error fetching resources");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, isAllowed]);

  useEffect(() => {
    if (isAllowed) {
      fetchResources();
    }
  }, [fetchResources, isAllowed]);

  // Trash (soft delete)
  const handleTrash = async (id: string, title: string) => {
    if (!confirm(`Move "${title}" to Trash? Files will be soft-deleted in FileVault.`)) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success(`"${title}" moved to trash`);
        fetchResources();
      } else {
        toast.error(json.error || "Failed to trash resource");
      }
    } catch {
      toast.error("Network error trashing resource");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Restore from trash
  const handleRestore = async (id: string, title: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/resources/${id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`"${title}" restored to published`);
        fetchResources();
      } else {
        toast.error(json.error || "Failed to restore resource");
      }
    } catch {
      toast.error("Network error restoring resource");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Permanent Purge
  const handlePurge = async (id: string, title: string) => {
    const confirmation = prompt(
      `WARNING: This will permanently delete "${title}" and purge all associated files from FileVault forever. This cannot be undone.\n\nType "PURGE" to confirm:`
    );
    if (confirmation !== "PURGE") {
      if (confirmation !== null) toast.error("Purge cancelled: confirmation phrase did not match");
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/resources/${id}?purge=true`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success(`"${title}" and its FileVault files were permanently purged`);
        fetchResources();
      } else {
        toast.error(json.error || "Failed to purge resource");
      }
    } catch {
      toast.error("Network error purging resource");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Download test
  const handleDownloadTest = (slug: string, fileVaultId: number) => {
    const downloadUrl = `/api/resources/${encodeURIComponent(slug)}/download?fileVaultId=${fileVaultId}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authStatus === "loading") {
    return (
      <div className="p-8 text-center text-sm text-foreground/50 animate-pulse">
        Checking permissions...
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
        <p className="text-sm text-foreground/60 max-w-md mx-auto">
          The Resource Hub and FileVault asset management are reserved for Administrators and Managers. Authors can link existing resources from within the Blog Editor.
        </p>
        <Link href="/admin/blogs" className="btn btn-secondary text-xs inline-block">
          Return to Blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground/50 mb-1">
            <Link href="/admin" className="hover:underline">Admin</Link>
            <span>/</span>
            <span>Resources</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Resource Hub & Decks
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60">
            Upload, bundle, and manage companion resources, downloadable decks, and blog attachments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingResource(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary text-xs px-4 py-2.5 shadow-sm self-start sm:self-auto cursor-pointer"
        >
          + New Resource
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-border/80 gap-6 text-xs sm:text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("published")}
          className={`pb-3 relative cursor-pointer transition ${
            activeTab === "published"
              ? "text-primary font-bold border-b-2 border-primary"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          Published
          <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-foreground/70">
            {counts.published}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("draft")}
          className={`pb-3 relative cursor-pointer transition ${
            activeTab === "draft"
              ? "text-primary font-bold border-b-2 border-primary"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          Drafts
          <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-foreground/70">
            {counts.draft}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("trashed")}
          className={`pb-3 relative cursor-pointer transition ${
            activeTab === "trashed"
              ? "text-rose-500 font-bold border-b-2 border-rose-500"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          Trash
          <span className="ml-2 rounded-full bg-rose-500/10 text-rose-500 px-2 py-0.5 text-[11px]">
            {counts.trashed}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter resources by title, category, or file..."
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 pl-9 text-xs text-foreground placeholder:text-foreground/40 focus:outline-hidden focus:border-primary"
        />
        <svg
          className="absolute left-3 top-2.5 h-4 w-4 text-foreground/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Resources Table / Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-xl border border-border bg-surface-muted animate-pulse" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <p className="font-semibold text-foreground text-sm">
            {search
              ? "No resources found matching your search"
              : activeTab === "published"
              ? "No published resources yet. Click '+ New Resource' to publish your first one!"
              : activeTab === "draft"
              ? "No draft resources."
              : "Trash is clean."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-2xl border border-border bg-surface/30 overflow-hidden">
          {resources.map((item) => {
            const files = item.files || [];
            const isBundle = files.length > 1;
            const primaryFile = files[0];
            const totalSize = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
            const isActing = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-surface-muted/40"
              >
                <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface border border-border text-foreground/75">
                      {item.category}
                    </span>

                    {isBundle ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        Deck ({files.length} Files)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-muted border border-border/80 text-foreground/80">
                        {primaryFile?.extension?.toUpperCase() || "FILE"}
                      </span>
                    )}

                    <span className="text-[11px] text-foreground/45">
                      {formatBytes(totalSize)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {item.title}
                    </h3>
                    {item.status === "published" && (
                      <Link
                        href={`/resources/${item.slug}`}
                        target="_blank"
                        className="text-[11px] text-primary hover:underline font-mono shrink-0"
                      >
                        /resources/{item.slug} ↗
                      </Link>
                    )}
                  </div>

                  <p className="text-xs text-foreground/60 line-clamp-1">
                    {item.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground/45 pt-0.5">
                    <span>{item.downloadCount || 0} downloads</span>
                    <span>•</span>
                    <span>
                      {item.linkedBlogIds?.length || 0} linked{" "}
                      {item.linkedBlogIds?.length === 1 ? "article" : "articles"}
                    </span>
                    <span>•</span>
                    <span>
                      Updated {new Date(item.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {primaryFile && (
                    <button
                      type="button"
                      onClick={() => handleDownloadTest(item.slug, primaryFile.fileVaultId)}
                      title="Download file test via FileVault"
                      className="p-2 rounded-lg border border-border hover:bg-surface-muted text-foreground/75 text-xs font-medium cursor-pointer"
                    >
                      ⬇ Download
                    </button>
                  )}

                  {activeTab !== "trashed" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingResource(item);
                          setIsModalOpen(true);
                        }}
                        className="btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleTrash(item.id, item.title)}
                        className="text-xs text-rose-500 hover:text-rose-600 px-2 py-1.5 font-medium cursor-pointer disabled:opacity-50"
                      >
                        Trash
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleRestore(item.id, item.title)}
                        className="btn btn-secondary text-xs px-3 py-1.5 cursor-pointer text-emerald-600 disabled:opacity-50"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handlePurge(item.id, item.title)}
                        className="text-xs text-rose-500 hover:text-rose-600 px-2 py-1.5 font-bold cursor-pointer disabled:opacity-50"
                      >
                        Purge Permanently
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <ResourceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingResource(null);
        }}
        onSaved={fetchResources}
        resourceToEdit={editingResource}
      />
    </div>
  );
}
