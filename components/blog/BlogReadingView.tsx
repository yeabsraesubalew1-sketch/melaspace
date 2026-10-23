"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Renderer from "@/components/editorjs/Renderer";
import type { EditorContent } from "@/types/editor";
import type { ResourceItem } from "@/types/api";

interface Props {
  slug: string;
  fullContent: EditorContent;
  initialSummary?: EditorContent;
  blogTitle?: string;
  readingTime: number;
  linkedResources?: ResourceItem[];
}

export default function BlogReadingView({
  slug,
  fullContent,
  initialSummary,
  blogTitle,
  readingTime,
  linkedResources,
}: Props) {
  const { data: session } = useSession();
  const isAdmin = ["root_admin", "super_admin", "manager"].includes(
    session?.user?.role || ""
  );

  const [mode, setMode] = useState<"article" | "summary">("article");
  const [summary, setSummary] = useState<EditorContent | null>(
    initialSummary && initialSummary.blocks && initialSummary.blocks.length > 0
      ? initialSummary
      : null
  );
  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const loadSummary = async (force = false) => {
    if (summary && !force) {
      setMode("summary");
      return;
    }

    if (force) {
      setIsRegenerating(true);
    } else {
      setLoading(true);
      setMode("summary");
    }

    try {
      const endpoint = force
        ? `/api/blogs/${encodeURIComponent(slug)}/summary?force=true`
        : `/api/blogs/${encodeURIComponent(slug)}/summary`;

      const res = await fetch(endpoint, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate summary");
      }

      setSummary(json.data.summary);
      setMode("summary");

      if (json.data.cached) {
        // Cached in DB (0 tokens)
      } else {
        toast.success("AI summary generated & cached", { id: "summary-loaded" });
      }
    } catch (err) {
      console.error(err);
      const cleanMessage =
        err instanceof Error && err.message && !err.message.includes("{")
          ? err.message
          : "Unable to load summary right now. Please try again.";
      toast.error(cleanMessage, { id: "summary-error" });
      setMode("article");
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleToggleMode = (targetMode: "article" | "summary") => {
    if (targetMode === "article") {
      setMode("article");
    } else {
      loadSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Reading Mode Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        {/* View Toggle Tabs */}
        <div className="inline-flex items-center rounded-xl border border-border/80 bg-surface-muted/50 p-1 shadow-xs">
          <button
            type="button"
            onClick={() => handleToggleMode("article")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              mode === "article"
                ? "bg-background text-foreground shadow-xs"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <svg
              className="h-3.5 w-3.5 opacity-70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span>Full Article</span>
            <span className="text-[10px] opacity-50 font-normal">({readingTime}m)</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleMode("summary")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              mode === "summary"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-foreground/75 hover:text-foreground hover:bg-background/40"
            }`}
          >
            <svg
              className="h-3 w-3 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            <span>Summary</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                mode === "summary"
                  ? "bg-white/20 text-white"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              AI
            </span>
          </button>
        </div>

        {/* Right side controls: Admin regenerate or read time badge */}
        <div className="flex items-center gap-2">
          {mode === "summary" && isAdmin && (
            <button
              type="button"
              onClick={() => loadSummary(true)}
              disabled={isRegenerating || loading}
              title="Admin: Force regenerate and update cached summary"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground/70 hover:bg-surface-muted hover:text-foreground transition cursor-pointer disabled:opacity-50"
            >
              <svg
                className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isRegenerating ? "Regenerating..." : "Regenerate Summary"}</span>
            </button>
          )}

          {mode === "summary" && (
            <span className="text-[11px] text-foreground/50 hidden sm:inline">
              1-minute digest
            </span>
          )}
        </div>
      </div>

      {/* Mode 1: Full Article View */}
      {mode === "article" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <Renderer
            content={fullContent}
            blogTitle={blogTitle}
            linkedResources={linkedResources}
            openLinksInNewTab
          />
        </div>
      )}

      {/* Mode 2: Loading Skeleton View */}
      {mode === "summary" && loading && (
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-6 sm:p-8 space-y-6 animate-pulse">
          <div className="flex items-center gap-2.5 text-xs font-medium text-primary">
            <svg
              className="h-4 w-4 animate-spin text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
            </svg>
            <span>Gemini is distilling key takeaways and coaching reflections...</span>
          </div>

          <div className="space-y-3">
            <div className="h-5 w-3/4 rounded bg-surface-muted" />
            <div className="h-4 w-full rounded bg-surface-muted/70" />
            <div className="h-4 w-5/6 rounded bg-surface-muted/60" />
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="h-4 w-48 rounded bg-surface-muted" />
            <div className="h-3.5 w-11/12 rounded bg-surface-muted/70" />
            <div className="h-3.5 w-5/6 rounded bg-surface-muted/60" />
            <div className="h-3.5 w-4/5 rounded bg-surface-muted/60" />
          </div>

          <div className="h-20 rounded-xl bg-surface-muted/50 border border-border/40" />
        </div>
      )}

      {/* Mode 2: Structured AI Summary View */}
      {mode === "summary" && !loading && summary && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Summary Banner Header */}
          <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/[0.08] via-primary/[0.03] to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  AI Key Insights &amp; Executive Summary
                </h3>
              </div>
              <p className="text-xs text-foreground/65">
                Core coaching themes and practical micro-practices distilled from the full article.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMode("article")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0"
            >
              <span>View Full Article</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* Rendered Summary via <Renderer /> */}
          <div className="prose prose-neutral dark:prose-invert max-w-none [&>.editorjs-content]:space-y-4">
            <Renderer
              content={summary}
              linkedResources={linkedResources}
              openLinksInNewTab
            />
          </div>

          {/* Bottom Switch-Back Card */}
          <div className="rounded-2xl border border-border bg-surface-muted/30 p-5 sm:p-6 text-center space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Ready to explore the complete deep dive?
            </h4>
            <p className="text-xs text-foreground/60 max-w-md mx-auto">
              Read the full {readingTime}-minute article with in-depth reflections, case studies, and full coaching context.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode("article");
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-95 cursor-pointer"
              >
                <span>Read Full Article ({readingTime} min)</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
