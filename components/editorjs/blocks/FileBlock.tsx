import type { FileBlock as FileBlockType } from "../types";

interface Props {
  block: FileBlockType;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFileVisual(extension = "", mime = "") {
  const ext = extension.toLowerCase().replace(/^\./, "");
  
  if (ext === "pdf" || mime.includes("pdf")) {
    return {
      badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    };
  }
  if (["doc", "docx", "odt", "rtf", "txt"].includes(ext) || mime.includes("word")) {
    return {
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    };
  }
  if (["xls", "xlsx", "csv", "ods"].includes(ext) || mime.includes("excel") || mime.includes("spreadsheet")) {
    return {
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    };
  }
  if (["ppt", "pptx", "odp"].includes(ext) || mime.includes("presentation")) {
    return {
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    };
  }
  if (["zip", "tar", "gz", "7z", "rar"].includes(ext) || mime.includes("zip") || mime.includes("compressed")) {
    return {
      badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    };
  }
  if (["mp3", "wav", "ogg", "m4a"].includes(ext) || mime.includes("audio")) {
    return {
      badgeClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
      iconBg: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
    };
  }
  if (["mp4", "webm", "mov"].includes(ext) || mime.includes("video")) {
    return {
      badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    };
  }

  return {
    badgeClass: "bg-foreground/5 text-foreground/70 border-border",
    iconBg: "bg-surface-muted text-foreground/70",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  };
}

export default function FileBlock({ block }: Props) {
  const {
    id,
    fileVaultId,
    downloadUrl,
    url,
    original_name,
    title,
    size_bytes,
    mime_type,
    extension,
  } = block.data;

  const targetFileId = id || fileVaultId;
  const effectiveDownloadUrl =
    downloadUrl || (targetFileId ? `/api/uploads/download/${targetFileId}` : url);

  const displayTitle = title || original_name || "Attachment";
  const formattedSize = formatBytes(size_bytes);
  const ext = extension || (original_name ? original_name.split(".").pop() : "");
  const visual = getFileVisual(ext, mime_type);

  if (!effectiveDownloadUrl) return null;

  return (
    <div className="my-6 not-prose">
      <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-border/80 bg-gradient-to-br from-surface-muted/40 via-background to-surface-muted/20 shadow-xs hover:shadow-md hover:border-foreground/30 transition-all duration-200">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* File Icon */}
          <div
            className={`flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-xl border border-border/60 ${visual.iconBg} shadow-xs group-hover:scale-105 transition-transform duration-200`}
          >
            {visual.icon}
          </div>

          {/* Meta Info */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
              {displayTitle}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-foreground/55">
              {ext && (
                <span
                  className={`uppercase font-mono font-semibold text-[10px] px-2 py-0.5 rounded-full border ${visual.badgeClass}`}
                >
                  {ext}
                </span>
              )}
              {formattedSize && (
                <span className="font-medium text-foreground/60">{formattedSize}</span>
              )}
              {original_name && original_name !== displayTitle && (
                <span className="truncate max-w-[220px] text-foreground/40 italic">
                  ({original_name})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Premium Action Download Button */}
        <div className="flex items-center self-end sm:self-center shrink-0">
          <a
            href={effectiveDownloadUrl}
            download={original_name || true}
            className="group/btn inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-foreground bg-surface-muted/70 hover:bg-foreground hover:text-background border border-border/80 hover:border-transparent shadow-xs hover:shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Download</span>
          </a>
        </div>
      </div>
    </div>
  );
}
