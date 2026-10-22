"use client";

import Link from "next/link";
import { useState } from "react";
import type { ResourceItem } from "@/types/api";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFormatBadgeColor(ext: string): { bg: string; text: string; border: string } {
  const e = ext.toLowerCase();
  if (["pdf"].includes(e)) {
    return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(e)) {
    return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" };
  }
  if (["doc", "docx", "txt", "md", "rtf"].includes(e)) {
    return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" };
  }
  if (["xls", "xlsx", "csv"].includes(e)) {
    return { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" };
  }
  if (["ppt", "pptx"].includes(e)) {
    return { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" };
  }
  return { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" };
}

export default function LinkedResourcesModule({ resources }: { resources?: ResourceItem[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!resources || resources.length === 0) {
    return null;
  }

  const handleDownload = async (slug: string, fileVaultId: number, downloadKey: string) => {
    try {
      setDownloadingId(downloadKey);
      const downloadUrl = `/api/resources/${encodeURIComponent(slug)}/download?fileVaultId=${fileVaultId}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to trigger download:", err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  return (
    <section className="my-12 rounded-2xl border border-border/80 bg-surface/50 p-6 sm:p-8 backdrop-blur-xs shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Related Resources & Downloads
            </h2>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {resources.length} {resources.length === 1 ? "Item" : "Items"}
            </span>
          </div>
        </div>

        <Link
          href="/resources"
          className="text-xs font-medium text-foreground/70 hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Explore All Resources &rarr;
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {resources.map((resource) => {
          const files = resource.files || [];
          const isBundle = files.length > 1;
          const primaryFile = files[0];
          const primaryExt = primaryFile?.extension || "file";
          const badgeStyle = getFormatBadgeColor(primaryExt);
          const totalSize = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

          return (
            <div
              key={resource.id}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                  >
                    {isBundle ? `Deck (${files.length} Files)` : primaryExt.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-foreground/45">
                    {formatBytes(totalSize)}
                  </span>
                </div>

                <Link href={`/resources/${resource.slug}`}>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {resource.title}
                  </h3>
                </Link>

                {resource.excerpt && (
                  <p className="mt-1.5 text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                    {resource.excerpt}
                  </p>
                )}

                {/* Bundle files list */}
                {isBundle && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {files.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-muted border border-border/60 text-[10px] text-foreground/75 truncate max-w-[140px]"
                      >
                        <span className="font-bold uppercase text-[9px] text-primary">{f.extension}</span>
                        <span className="truncate">{f.label || f.originalName}</span>
                      </span>
                    ))}
                    {files.length > 3 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-foreground/40 font-medium">
                        +{files.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <span className="text-[11px] text-foreground/45 flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {resource.downloadCount || 0} downloads
                </span>

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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <span>View Deck</span>
                      <span>&rarr;</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={downloadingId === resource.id}
                      onClick={() => handleDownload(resource.slug, primaryFile.fileVaultId, resource.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>{downloadingId === resource.id ? "Downloading..." : "Download"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
