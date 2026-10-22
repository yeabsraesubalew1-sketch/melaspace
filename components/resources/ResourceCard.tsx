"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { ResourceItem } from "@/types/api";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFormatDetails(ext: string) {
  const e = (ext || "").toLowerCase();
  if (["pdf"].includes(e)) {
    return {
      label: "PDF",
      badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      accentBorder: "group-hover:border-rose-500/40",
      bgGradient: "from-rose-500/15 via-rose-500/5 to-transparent",
    };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(e)) {
    return {
      label: "ZIP ARCHIVE",
      badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      accentBorder: "group-hover:border-amber-500/40",
      bgGradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    };
  }
  if (["doc", "docx", "txt", "md", "rtf"].includes(e)) {
    return {
      label: "DOCUMENT",
      badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      accentBorder: "group-hover:border-blue-500/40",
      bgGradient: "from-blue-500/15 via-blue-500/5 to-transparent",
    };
  }
  if (["xls", "xlsx", "csv"].includes(e)) {
    return {
      label: "SPREADSHEET",
      badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      accentBorder: "group-hover:border-emerald-500/40",
      bgGradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    };
  }
  if (["ppt", "pptx", "key"].includes(e)) {
    return {
      label: "SLIDES",
      badgeClass: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      accentBorder: "group-hover:border-orange-500/40",
      bgGradient: "from-orange-500/15 via-orange-500/5 to-transparent",
    };
  }
  return {
    label: e.toUpperCase() || "FILE",
    badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    accentBorder: "group-hover:border-purple-500/40",
    bgGradient: "from-purple-500/15 via-purple-500/5 to-transparent",
  };
}

export default function ResourceCard({ resource }: { resource: ResourceItem }) {
  const [downloading, setDownloading] = useState(false);
  const files = resource.files || [];
  const isBundle = files.length > 1;
  const primaryFile = files[0];
  const primaryExt = primaryFile?.extension || "file";
  const formatInfo = getFormatDetails(primaryExt);
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!primaryFile) return;

    setDownloading(true);
    const downloadUrl = `/api/resources/${encodeURIComponent(resource.slug)}/download?fileVaultId=${primaryFile.fileVaultId}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
    }, 1500);
  };

  return (
    <div className="relative group">
      {/* Visual multi-card deck stacking effect for multi-file bundles */}
      {isBundle && (
        <>
          <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl border border-border/40 bg-surface/40 -z-10 transition-transform duration-300 group-hover:translate-x-2.5 group-hover:translate-y-2.5" />
          <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-2xl border border-border/60 bg-surface/70 -z-10 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:translate-y-1.5" />
        </>
      )}

      <div
        className={`relative flex flex-col justify-between h-full rounded-2xl border border-border/80 bg-background/95 p-5 sm:p-6 transition-all duration-300 backdrop-blur-xs hover:-translate-y-1 hover:shadow-xl ${formatInfo.accentBorder}`}
      >
        <div>
          {/* Header row: Category & Format Badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
              {resource.category}
            </span>

            <div className="flex items-center gap-1.5">
              {isBundle ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>{files.length} Files • Deck</span>
                </span>
              ) : (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${formatInfo.badgeClass}`}
                >
                  {formatInfo.label}
                </span>
              )}
            </div>
          </div>

          {/* Cover image if available */}
          {resource.coverImage?.url && (
            <div className="relative mb-4 h-36 w-full overflow-hidden rounded-xl border border-border/60 bg-surface-muted">
              <Image
                src={resource.coverImage.url}
                alt={resource.coverImage.alt || resource.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}

          {/* Title & Excerpt */}
          <Link href={`/resources/${resource.slug}`} className="block focus:outline-hidden">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
              {resource.title}
            </h3>
          </Link>

          {resource.excerpt && (
            <p className="mt-2 text-xs sm:text-sm text-foreground/70 leading-relaxed line-clamp-3">
              {resource.excerpt}
            </p>
          )}

          {/* File Pills / Deck Preview */}
          {isBundle ? (
            <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5">
              <p className="text-[11px] font-medium text-foreground/50 uppercase tracking-wider">
                Included in Deck:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {files.slice(0, 3).map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border/60 text-xs text-foreground/80"
                  >
                    <span className="font-bold uppercase text-[9px] text-primary">{f.extension}</span>
                    <span className="truncate max-w-[150px]">{f.label || f.originalName}</span>
                  </span>
                ))}
                {files.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-lg bg-surface-muted text-[11px] text-foreground/50">
                    +{files.length - 3} more files
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-foreground/50">
              <span className="truncate max-w-[200px]">{primaryFile?.label || primaryFile?.originalName}</span>
              <span>{formatBytes(totalSizeBytes)}</span>
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-foreground/50">
            <svg className="h-3.5 w-3.5 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{resource.downloadCount || 0} downloads</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/resources/${resource.slug}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-surface-muted transition-colors"
            >
              Details
            </Link>

            {isBundle ? (
              <Link
                href={`/resources/${resource.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-xs"
              >
                <span>View Deck</span>
                <span>&rarr;</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{downloading ? "Downloading..." : "Download"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
