"use client";

import { useState } from "react";

interface DownloadFileButtonProps {
  slug: string;
  fileVaultId: number;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "subtle";
}

export default function DownloadFileButton({
  slug,
  fileVaultId,
  label = "Download",
  className = "",
  variant = "primary",
}: DownloadFileButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDownloading(true);
    const downloadUrl = `/api/resources/${encodeURIComponent(slug)}/download?fileVaultId=${fileVaultId}`;
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

  const baseStyle =
    "inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 select-none";

  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm px-4 py-2.5",
    secondary: "bg-surface border border-border text-foreground hover:bg-surface-muted px-4 py-2.5",
    subtle: "text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={downloading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span>{downloading ? "Starting download..." : label}</span>
    </button>
  );
}
