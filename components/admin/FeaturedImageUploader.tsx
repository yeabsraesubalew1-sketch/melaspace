"use client";

import { useState, useRef, useId } from "react";
import toast from "react-hot-toast";
import type { FeaturedImage } from "@/types/api";

interface Props {
  value?: FeaturedImage | null;
  onChange: (image: FeaturedImage | null) => void;
  title?: string;
  disabled?: boolean;
}

// Curated SVG gradient presets for one-click branded covers
export const DEFAULT_COVER_PRESETS: Array<{
  id: string;
  name: string;
  gradientClass: string;
  svgDataUri: string;
}> = [
  {
    id: "emerald-aurora",
    name: "Emerald Aurora",
    gradientClass: "from-emerald-500/30 via-teal-500/20 to-surface-muted",
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23059669"/><stop offset="50%" stop-color="%230d9488"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><radialGradient id="r1" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="%2334d399" stop-opacity="0.4"/><stop offset="100%" stop-color="%23059669" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23g1)"/><rect width="100%" height="100%" fill="url(%23r1)"/><circle cx="950" cy="180" r="280" fill="%232dd4bf" opacity="0.18"/><circle cx="250" cy="450" r="320" fill="%23059669" opacity="0.25"/><path d="M0,450 Q300,300 600,420 T1200,350 L1200,630 L0,630 Z" fill="%23022c22" opacity="0.35"/></svg>`,
  },
  {
    id: "cosmic-violet",
    name: "Cosmic Violet",
    gradientClass: "from-indigo-500/30 via-purple-500/20 to-surface-muted",
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234338ca"/><stop offset="50%" stop-color="%237c3aed"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><radialGradient id="r2" cx="70%" cy="30%" r="70%"><stop offset="0%" stop-color="%23a855f7" stop-opacity="0.4"/><stop offset="100%" stop-color="%237c3aed" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23g2)"/><rect width="100%" height="100%" fill="url(%23r2)"/><circle cx="250" cy="180" r="260" fill="%23c084fc" opacity="0.18"/><circle cx="980" cy="420" r="300" fill="%236366f1" opacity="0.25"/><path d="M0,480 Q400,320 800,450 T1200,380 L1200,630 L0,630 Z" fill="%231e1b4b" opacity="0.35"/></svg>`,
  },
  {
    id: "sunset-ember",
    name: "Sunset Ember",
    gradientClass: "from-amber-500/30 via-orange-500/20 to-surface-muted",
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d97706"/><stop offset="50%" stop-color="%23ea580c"/><stop offset="100%" stop-color="%2318181b"/></linearGradient><radialGradient id="r3" cx="40%" cy="30%" r="70%"><stop offset="0%" stop-color="%23fbbf24" stop-opacity="0.4"/><stop offset="100%" stop-color="%23d97706" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23g3)"/><rect width="100%" height="100%" fill="url(%23r3)"/><circle cx="850" cy="200" r="280" fill="%23f97316" opacity="0.2"/><circle cx="200" cy="480" r="320" fill="%23f59e0b" opacity="0.25"/><path d="M0,460 Q350,330 700,440 T1200,360 L1200,630 L0,630 Z" fill="%23431407" opacity="0.35"/></svg>`,
  },
  {
    id: "cyber-slate",
    name: "Cyber Slate",
    gradientClass: "from-cyan-500/30 via-sky-500/20 to-surface-muted",
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7"/><stop offset="50%" stop-color="%230891b2"/><stop offset="100%" stop-color="%23090d16"/></linearGradient><radialGradient id="r4" cx="60%" cy="40%" r="70%"><stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.35"/><stop offset="100%" stop-color="%230284c7" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23g4)"/><rect width="100%" height="100%" fill="url(%23r4)"/><circle cx="320" cy="220" r="240" fill="%2306b6d4" opacity="0.18"/><circle cx="920" cy="380" r="300" fill="%230284c7" opacity="0.22"/><path d="M0,470 Q300,350 700,430 T1200,390 L1200,630 L0,630 Z" fill="%23082f49" opacity="0.4"/></svg>`,
  },
];

export default function FeaturedImageUploader({
  value,
  onChange,
  title,
  disabled = false,
}: Props) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPresets, setShowPresets] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleUploadFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP, GIF, SVG).");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.file) {
          onChange({
            url: res.file.url,
            alt: value?.alt || title || res.file.original_name,
            caption: value?.caption || "",
            fileVaultId: res.file.id,
            storageKey: res.file.storage_key,
          });
          toast.success("Featured image uploaded!");
        } else {
          toast.error(res.error || "Failed to upload image");
        }
      } catch {
        toast.error("Upload failed to complete");
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      toast.error("Network error during upload. Please try again.");
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", "featured_image");

    xhr.send(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const handleApplyPreset = (preset: typeof DEFAULT_COVER_PRESETS[0]) => {
    onChange({
      url: preset.svgDataUri,
      alt: value?.alt || `${title || "Article"} cover graphic`,
      caption: value?.caption || "",
    });
    setShowPresets(false);
    toast.success(`Applied ${preset.name} cover!`);
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
              Featured Image
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Exempt from quota
            </span>
          </div>
          <p className="text-xs text-foreground/50">
            Displays as the primary cover banner and thumbnail across article cards and social shares.
          </p>
        </div>

        {value && !disabled && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground/80 hover:bg-surface-muted transition cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Replace</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Remove</span>
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="rounded-xl border border-border bg-surface-muted/50 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Uploading featured image...</span>
            <span className="font-mono text-foreground/60">{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-foreground transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview when image exists */}
      {value?.url && !isUploading && (
        <div className="space-y-3">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-xl border border-border/80 bg-surface-muted/40 shadow-xs group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.url}
              alt={value.alt || title || "Featured image preview"}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-background/90 text-foreground border border-border/80 backdrop-blur-xs">
              Cover Preview
            </div>
          </div>

          {/* Alt & Caption inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-foreground/60 uppercase tracking-wide mb-1">
                Alt Text (Accessibility &amp; SEO)
              </label>
              <input
                type="text"
                placeholder={title ? `Defaults to: "${title}"` : "Image description for screen readers..."}
                value={value.alt || ""}
                onChange={(e) => onChange({ ...value, alt: e.target.value })}
                disabled={disabled}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none transition focus:border-foreground/50 focus:ring-1 focus:ring-foreground/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-foreground/60 uppercase tracking-wide mb-1">
                Caption (Optional)
              </label>
              <input
                type="text"
                placeholder="Credit, source or brief caption..."
                value={value.caption || ""}
                onChange={(e) => onChange({ ...value, caption: e.target.value })}
                disabled={disabled}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none transition focus:border-foreground/50 focus:ring-1 focus:ring-foreground/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty Dropzone when no image */}
      {!value?.url && !isUploading && (
        <div className="space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
              isDragging
                ? "border-foreground bg-surface-muted/60"
                : "border-border hover:border-foreground/50 hover:bg-surface-muted/30"
            }`}
          >
            <div className="rounded-full bg-surface-muted p-2.5 text-foreground/60 group-hover:text-foreground group-hover:scale-105 transition">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag &amp; drop an image
              </p>
              <p className="text-xs text-foreground/50">
                PNG, JPG, WebP, GIF, or SVG • Recommended ratio 16:9 (1200×630)
              </p>
            </div>
          </div>

          {/* Quick preset selector toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-foreground/50 text-[11px]">
              No custom photo? Pick an abstract branded gradient cover:
            </span>
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs font-medium text-foreground/80 hover:text-foreground underline underline-offset-4 cursor-pointer"
            >
              {showPresets ? "Hide Presets" : "✨ Pick Preset"}
            </button>
          </div>

          {showPresets && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 animate-in fade-in duration-200">
              {DEFAULT_COVER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-border hover:border-foreground/50 transition cursor-pointer text-left shadow-xs hover:shadow-md"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.svgDataUri}
                      alt={preset.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-2 bg-background/90 border-t border-border/50 text-[11px] font-medium text-foreground truncate">
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
