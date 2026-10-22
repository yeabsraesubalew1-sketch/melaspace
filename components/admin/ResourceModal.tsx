"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { ResourceItem, ResourceFileItem, ResourceCoverImageItem } from "@/types/api";

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  resourceToEdit?: ResourceItem | null;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

const COMMON_CATEGORIES = [
  "Clarity & Reflection",
  "Emotional Health",
  "Productivity & Work",
  "Guided Workbooks",
  "Cheatsheets & Templates",
  "Audio & Decks",
  "General Resources",
];

export default function ResourceModal({
  isOpen,
  onClose,
  onSaved,
  resourceToEdit,
}: ResourceModalProps) {
  const isEditing = Boolean(resourceToEdit);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [coverImage, setCoverImage] = useState<ResourceCoverImageItem | null>(null);

  const [files, setFiles] = useState<ResourceFileItem[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<
    Array<{ fileName: string; progress: number; id: string }>
  >([]);
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  // Linked blogs state
  const [availableBlogs, setAvailableBlogs] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [selectedBlogIds, setSelectedBlogIds] = useState<string[]>([]);
  const [blogSearch, setBlogSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (resourceToEdit) {
        setTitle(resourceToEdit.title || "");
        setSlug(resourceToEdit.slug || "");
        setExcerpt(resourceToEdit.excerpt || "");
        setDescription(resourceToEdit.description || "");
        if (COMMON_CATEGORIES.includes(resourceToEdit.category)) {
          setCategory(resourceToEdit.category);
          setCustomCategory("");
        } else {
          setCategory("custom");
          setCustomCategory(resourceToEdit.category || "");
        }
        setTagsInput(resourceToEdit.tags?.join(", ") || "");
        setStatus(resourceToEdit.status === "draft" ? "draft" : "published");
        setCoverImage(resourceToEdit.coverImage || null);
        setFiles(resourceToEdit.files || []);
        setSelectedBlogIds(resourceToEdit.linkedBlogIds || []);
      } else {
        setTitle("");
        setSlug("");
        setExcerpt("");
        setDescription("");
        setCategory(COMMON_CATEGORIES[0]);
        setCustomCategory("");
        setTagsInput("");
        setStatus("published");
        setCoverImage(null);
        setFiles([]);
        setSelectedBlogIds([]);
      }
      setUploadingFiles([]);
    }
  }, [isOpen, resourceToEdit]);

  // Load available blogs to link
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function fetchBlogs() {
      try {
        const res = await fetch("/api/admin/blogs?limit=50&status=published");
        const json = await res.json();
        if (json.success && isMounted) {
          setAvailableBlogs(
            (json.data || []).map((b: { id: string; title: string; slug: string }) => ({
              id: b.id,
              title: b.title,
              slug: b.slug,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load blogs for linking:", err);
      }
    }
    fetchBlogs();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Cover image upload handler
  const handleCoverUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    setIsCoverUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", "featured_image");
    formData.append("entityType", "resource");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.onload = () => {
      setIsCoverUploading(false);
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.file) {
          setCoverImage({
            url: res.file.url,
            alt: title || res.file.original_name,
            fileVaultId: res.file.id,
          });
          toast.success("Cover image uploaded");
        } else {
          toast.error(res.error || "Failed to upload cover image");
        }
      } catch {
        toast.error("Upload error");
      }
    };
    xhr.onerror = () => {
      setIsCoverUploading(false);
      toast.error("Network error during cover upload");
    };
    xhr.send(formData);
  };

  // Deck files upload handler
  const handleFilesUpload = (uploadedFiles: FileList | File[]) => {
    Array.from(uploadedFiles).forEach((file) => {
      const uploadId = Math.random().toString(36).substring(2, 9);
      setUploadingFiles((prev) => [...prev, { fileName: file.name, progress: 0, id: uploadId }]);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", "resource_file");
      formData.append("entityType", "resource");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/uploads");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles((prev) =>
            prev.map((item) => (item.id === uploadId ? { ...item, progress: percent } : item))
          );
        }
      };

      xhr.onload = () => {
        setUploadingFiles((prev) => prev.filter((item) => item.id !== uploadId));
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && res.file) {
            const ext = (file.name.split(".").pop() || "bin").toLowerCase();
            const cleanLabel = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

            setFiles((prev) => [
              ...prev,
              {
                label: cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1),
                fileVaultId: res.file.id,
                storageKey: res.file.storage_key,
                originalName: res.file.original_name,
                mimeType: res.file.mime_type || file.type || "application/octet-stream",
                sizeBytes: res.file.size_bytes || file.size,
                extension: ext,
              },
            ]);
            toast.success(`Uploaded: ${file.name}`);
          } else {
            toast.error(res.error || `Failed to upload ${file.name}`);
          }
        } catch {
          toast.error(`Upload failed for ${file.name}`);
        }
      };

      xhr.onerror = () => {
        setUploadingFiles((prev) => prev.filter((item) => item.id !== uploadId));
        toast.error(`Network error uploading ${file.name}`);
      };

      xhr.send(formData);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileLabel = (index: number, newLabel: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, label: newLabel } : f))
    );
  };

  const toggleBlogLink = (id: string) => {
    if (selectedBlogIds.includes(id)) {
      setSelectedBlogIds((prev) => prev.filter((bId) => bId !== id));
    } else {
      setSelectedBlogIds((prev) => [...prev, id]);
    }
  };

  // Submit resource
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!excerpt.trim()) {
      toast.error("Excerpt summary is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description / Guide is required");
      return;
    }
    const finalCategory = category === "custom" ? customCategory.trim() : category;
    if (!finalCategory) {
      toast.error("Category is required");
      return;
    }
    if (files.length === 0) {
      toast.error("Please upload at least one file to this resource deck");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim(),
        description: description.trim(),
        category: finalCategory,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        coverImage: coverImage?.url ? coverImage : undefined,
        files,
        status,
        linkedBlogIds: selectedBlogIds,
      };

      const endpoint = isEditing
        ? `/api/admin/resources/${resourceToEdit?.id}`
        : "/api/admin/resources";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save resource");
      }

      toast.success(isEditing ? "Resource updated successfully!" : "Resource created successfully!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save resource");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBlogs = availableBlogs.filter((b) =>
    b.title.toLowerCase().includes(blogSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isEditing ? "Edit Resource" : "Create New Resource"}
            </h2>
            <p className="text-xs text-foreground/50">
              Upload files to FileVault, assign companion deck labels, and optionally link to articles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-surface-muted transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">
                Resource Title <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekly Clarity Workbook & Reflection Sheet"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-hidden focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">
                Custom URL Slug (Optional)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-title"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-hidden focus:border-primary font-mono text-xs"
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">
                Category <span className="text-primary">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-hidden focus:border-primary"
              >
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="custom">+ Custom Category</option>
              </select>
              {category === "custom" && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name"
                  className="w-full mt-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-primary"
                  required
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">
                Status
              </label>
              <div className="flex gap-4 pt-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === "published"}
                    onChange={() => setStatus("published")}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Published (Publicly live)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === "draft"}
                    onChange={() => setStatus("draft")}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Draft</span>
                </label>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Short Excerpt / Card Summary <span className="text-primary">*</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief 1-2 sentence overview shown on resource cards and search results..."
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-hidden focus:border-primary"
              required
            />
          </div>

          {/* Full Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Full Description & Instructions <span className="text-primary">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation, how to use this deck, reflection prompts, or companion instructions..."
              rows={5}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-hidden focus:border-primary"
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="mindfulness, clarity, journaling, pdf"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Cover Image Uploader */}
          <div className="space-y-2 border-t border-border/60 pt-4">
            <label className="text-xs font-semibold text-foreground/80 block">
              Cover Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              {coverImage?.url ? (
                <div className="relative h-20 w-32 rounded-lg border border-border overflow-hidden bg-surface-muted group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage.url} alt="Cover preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImage(null)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-medium transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="h-20 w-32 rounded-lg border border-dashed border-border bg-surface/50 flex flex-col items-center justify-center text-[11px] text-foreground/50">
                  <span>No cover</span>
                </div>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleCoverUpload(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isCoverUploading}
                className="btn btn-secondary text-xs px-3 py-1.5"
              >
                {isCoverUploading ? "Uploading..." : coverImage ? "Change Cover" : "Upload Cover Image"}
              </button>
            </div>
          </div>

          {/* MULTI-FILE DECK ATTACHMENTS (FileVault) */}
          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-foreground">
                  File Attachments & Bundle Decks <span className="text-primary">*</span>
                </label>
                <p className="text-xs text-foreground/50">
                  Upload one or more files (PDF, ZIP, spreadsheets, docs). Uploads are stored securely on FileVault.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesUpload(e.target.files);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary text-xs px-3.5 py-1.5 shadow-xs"
              >
                + Add Files
              </button>
            </div>

            {/* Drop / Drag Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFilesUpload(e.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-xl border border-dashed border-border hover:border-primary/50 bg-surface/30 text-center cursor-pointer transition space-y-1"
            >
              <svg className="mx-auto h-7 w-7 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xs font-medium text-foreground">
                Drop files here or click to browse
              </p>
              <p className="text-[11px] text-foreground/45">
                Supports unlimited size uploads up to 1GB per file
              </p>
            </div>

            {/* Progress indicators for currently uploading files */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-2">
                {uploadingFiles.map((up) => (
                  <div key={up.id} className="p-3 rounded-lg border border-border bg-surface-muted/50 text-xs space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="truncate max-w-xs">{up.fileName}</span>
                      <span>{up.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-150"
                        style={{ width: `${up.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Uploaded Files Table */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground/70">
                  {files.length} {files.length === 1 ? "File attached:" : "Files in Deck:"}
                </p>
                <div className="divide-y divide-border/40 rounded-xl border border-border overflow-hidden bg-surface/40">
                  {files.map((file, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                          {file.extension}
                        </span>
                        <div className="truncate">
                          <input
                            type="text"
                            value={file.label}
                            onChange={(e) => updateFileLabel(idx, e.target.value)}
                            placeholder="File Label (e.g., Printable PDF)"
                            className="font-medium text-foreground bg-transparent border-b border-border focus:border-primary focus:outline-hidden px-1 py-0.5 w-full max-w-sm"
                          />
                          <p className="text-[10px] text-foreground/45 mt-0.5 truncate">
                            {file.originalName} • {formatBytes(file.sizeBytes)} • FileVault ID: {file.fileVaultId}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-rose-500 hover:text-rose-600 text-xs font-medium self-end sm:self-center cursor-pointer p-1"
                        title="Remove file"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LINK TO ARTICLES (Two-way linking) */}
          <div className="space-y-3 border-t border-border/60 pt-4">
            <label className="text-sm font-bold text-foreground block">
              Link to Companion Articles
            </label>
            <p className="text-xs text-foreground/50">
              Articles selected here will automatically feature this download deck at the bottom, and will be displayed on this resource page.
            </p>

            <input
              type="text"
              value={blogSearch}
              onChange={(e) => setBlogSearch(e.target.value)}
              placeholder="Search published articles to link..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-hidden focus:border-primary"
            />

            <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-surface/30 p-2 space-y-1">
              {filteredBlogs.length === 0 ? (
                <p className="text-xs text-foreground/50 p-2 text-center">
                  No matching published blogs found
                </p>
              ) : (
                filteredBlogs.map((b) => {
                  const isChecked = selectedBlogIds.includes(b.id);
                  return (
                    <label
                      key={b.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                        isChecked ? "bg-primary/10 border border-primary/20" : "hover:bg-surface-muted"
                      }`}
                    >
                      <span className="truncate pr-2 font-medium text-foreground">{b.title}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleBlogLink(b.id)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary text-xs px-5 py-2 shadow-sm"
            >
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
