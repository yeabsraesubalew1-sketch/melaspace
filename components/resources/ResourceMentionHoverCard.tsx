"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface HoverCardData {
  title: string;
  category: string;
  filesCount: number;
  sizeBytes: number;
  excerpt: string;
  slug: string;
  href: string;
  x: number;
  y: number;
  placement: "top" | "bottom";
  isInsideEditor: boolean;
  isPublished?: boolean;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

let cachedPublishedSlugs: Set<string> | null = null;
let isFetchingPublished = false;

async function checkPublishedStatus(slug: string): Promise<boolean> {
  if (!slug) return false;
  if (cachedPublishedSlugs) {
    return cachedPublishedSlugs.has(slug);
  }
  if (isFetchingPublished) {
    return true; // assume published while fetching
  }

  isFetchingPublished = true;
  try {
    const res = await fetch("/api/resources?limit=100");
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      cachedPublishedSlugs = new Set(json.data.map((r: { slug: string }) => r.slug));
      return cachedPublishedSlugs.has(slug);
    }
  } catch (err) {
    console.error("[ResourceMentionHoverCard] error checking published status:", err);
  } finally {
    isFetchingPublished = false;
  }
  return true;
}

export default function ResourceMentionHoverCard() {
  const { data: session } = useSession();
  const isAdmin = ["root_admin", "super_admin", "manager"].includes(session?.user?.role || "");

  const [cardData, setCardData] = useState<HoverCardData | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardElementRef = useRef<HTMLDivElement | null>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseOver = async (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".resource-mention") as HTMLElement | null;

      if (!target) {
        // If mouse moved inside the card, keep it open
        if (cardElementRef.current && cardElementRef.current.contains(e.target as Node)) {
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
        }
        return;
      }

      targetElementRef.current = target;

      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }

      const rect = target.getBoundingClientRect();
      const slug = target.getAttribute("data-resource-slug") || "";
      const title = target.getAttribute("data-resource-title") || target.textContent?.replace(/^📎\s*/, "") || "Resource";
      const category = target.getAttribute("data-resource-category") || "Resource";
      const filesCount = parseInt(target.getAttribute("data-resource-files") || "1", 10);
      const sizeBytes = parseInt(target.getAttribute("data-resource-size") || "0", 10);
      const excerpt = target.getAttribute("data-resource-excerpt") || "";
      const href = target.getAttribute("href") || (slug ? `/resources/${slug}` : "");

      const isInsideEditor = Boolean(target.closest(".editor-wrapper"));

      const cardWidth = 270;
      const placement: "top" | "bottom" = rect.top < 140 ? "bottom" : "top";

      // Calculate horizontal center, clamped to screen edges
      const targetCenter = rect.left + rect.width / 2;
      const minX = cardWidth / 2 + 12;
      const maxX = window.innerWidth - cardWidth / 2 - 12;
      const x = Math.max(minX, Math.min(maxX, targetCenter));

      // Calculate vertical position
      const y = placement === "top" ? rect.top - 8 : rect.bottom + 8;

      setCardData({
        title,
        category,
        filesCount,
        sizeBytes,
        excerpt,
        slug,
        href,
        x,
        y,
        placement,
        isInsideEditor,
        isPublished: true,
      });

      // If inside the editor or user is admin, check if the resource is still published in the background
      if (isInsideEditor && slug) {
        const isPub = await checkPublishedStatus(slug);
        setCardData((prev) => (prev && prev.slug === slug ? { ...prev, isPublished: isPub } : prev));
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".resource-mention");
      const isLeavingCard = cardElementRef.current && cardElementRef.current.contains(e.target as Node);

      if (target || isLeavingCard) {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
          setCardData(null);
        }, 160);
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  const handleRemoveMention = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = targetElementRef.current;
    if (!target) return;

    // Extract original text without 📎 prefix
    const rawText = target.textContent?.replace(/^📎\s*/, "") || target.textContent || "";
    const textNode = document.createTextNode(rawText);

    const parent = target.parentNode;
    if (parent) {
      parent.replaceChild(textNode, target);

      // Dispatch input event to notify Editor.js saver
      const editorWrapper = (parent as HTMLElement).closest?.(".editor-wrapper");
      if (editorWrapper) {
        editorWrapper.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    setCardData(null);
    toast.success("Resource mention removed", {
      id: "mention-removed",
      duration: 2000,
    });
  };

  if (!cardData || typeof document === "undefined") return null;

  const fileLabel = cardData.filesCount > 1 ? `Deck (${cardData.filesCount} files)` : "1 File";
  const sizeLabel = cardData.sizeBytes > 0 ? `• ${formatBytes(cardData.sizeBytes)}` : "";
  const canRemove = cardData.isInsideEditor || isAdmin;

  const content = (
    <div
      ref={cardElementRef}
      onMouseEnter={() => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
      }}
      onMouseLeave={() => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
          setCardData(null);
        }, 160);
      }}
      style={{
        position: "fixed",
        left: `${cardData.x}px`,
        top: `${cardData.y}px`,
        transform: `translate(-50%, ${cardData.placement === "top" ? "-100%" : "0"})`,
        zIndex: 99999,
        pointerEvents: "auto",
      }}
      className="w-[270px] rounded-xl border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl p-3 text-left transition-all duration-150 animate-in fade-in zoom-in-95 pointer-events-auto"
    >
      {/* Top category & meta row */}
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 truncate max-w-[130px]">
          {cardData.category}
        </span>
        <span className="text-foreground/50 font-medium truncate">
          {fileLabel} {sizeLabel}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-bold text-xs text-foreground line-clamp-2 mt-2 leading-snug">
        {cardData.title}
      </h4>

      {/* Minimal excerpt (not too much info) */}
      {cardData.excerpt ? (
        <p className="text-[11px] text-foreground/60 line-clamp-2 mt-1 leading-relaxed">
          {cardData.excerpt}
        </p>
      ) : null}

      {/* Fail-safe warning if the resource was drafted or trashed */}
      {cardData.isInsideEditor && cardData.isPublished === false && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2 text-[10px] text-amber-700 dark:text-amber-300 mt-2 space-y-0.5">
          <div className="font-semibold flex items-center gap-1">
            <span>⚠️</span>
            <span>Resource Unpublished</span>
          </div>
          <p className="text-foreground/65 leading-tight">
            This resource was trashed or drafted. Public visitors will see this as plain text.
          </p>
        </div>
      )}

      {/* Footer view link + Remove Mention button */}
      <div className="border-t border-border/40 mt-2.5 pt-2 flex items-center justify-between gap-2">
        {cardData.href ? (
          <Link
            href={cardData.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View Resource</span>
            <span>↗</span>
          </Link>
        ) : (
          <span className="text-[10px] text-foreground/40 font-mono">Resource Hub</span>
        )}

        {/* 1-Click Remove Mention Button */}
        {canRemove && (
          <button
            type="button"
            onClick={handleRemoveMention}
            title="Remove this mention and restore plain text"
            className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer border border-rose-500/20"
          >
            <span>✕</span>
            <span>Remove Mention</span>
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
