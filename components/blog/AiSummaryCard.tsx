"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Renderer from "@/components/editorjs/Renderer";
import type { EditorContent } from "@/types/editor";
import type { ResourceItem } from "@/types/api";

interface Props {
  slug: string;
  initialSummary?: EditorContent;
  linkedResources?: ResourceItem[];
}

export default function AiSummaryCard({
  slug,
  initialSummary,
  linkedResources,
}: Props) {
  const { data: session } = useSession();
  const isAdmin = ["root_admin", "super_admin", "manager"].includes(
    session?.user?.role || ""
  );

  const [summary, setSummary] = useState<EditorContent | null>(
    initialSummary && initialSummary.blocks && initialSummary.blocks.length > 0
      ? initialSummary
      : null
  );
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(Boolean(initialSummary?.blocks?.length));
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleGenerate = async (force = false) => {
    if (force) {
      setIsRegenerating(true);
    } else {
      setLoading(true);
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
      setIsExpanded(true);

      if (json.data.cached) {
        toast.success("Loaded cached summary (0 tokens)");
      } else {
        toast.success("AI summary generated & cached!");
      }
    } catch (err) {
      console.error(err);
      const cleanMessage =
        err instanceof Error && err.message && !err.message.includes("{")
          ? err.message
          : "Failed to load summary. Please try again.";
      toast.error(cleanMessage);
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  };

  return (
    <div className="mb-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-background to-surface-muted/40 p-5 shadow-sm sm:p-6 transition-all duration-200">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/25">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                AI Key Takeaways &amp; Reflection
              </h2>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                Gemini
              </span>
            </div>
            <p className="text-xs text-foreground/60">
              A 1-minute distillation of core coaching insights and micro-practices.
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {summary && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground px-2.5 py-1 rounded-lg border border-border/80 bg-background/80 hover:bg-surface-muted transition cursor-pointer"
            >
              <span>{isExpanded ? "Collapse" : "Read Takeaways"}</span>
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {isAdmin && summary && (
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              disabled={isRegenerating}
              title="Admin: Force regenerate and update cached summary"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 px-2 py-1 rounded border border-primary/20 hover:bg-primary/10 transition cursor-pointer disabled:opacity-50"
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
              <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
            </button>
          )}
        </div>
      </div>

      {/* When no summary is cached yet: Call to Action */}
      {!summary && !loading && (
        <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-foreground/70">
            Generate an instant, compassionate synthesis with interactive coaching resources.
          </p>
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-95 hover:shadow-md cursor-pointer shrink-0"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" />
            </svg>
            <span>Generate 1-Min Summary</span>
          </button>
        </div>
      )}

      {/* Loading Shimmer State */}
      {(loading || isRegenerating) && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-pulse">
          <div className="flex items-center gap-2 text-xs text-primary font-medium">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
            </svg>
            <span>Gemini is distilling key insights and wellness themes...</span>
          </div>
          <div className="h-4 w-5/6 rounded bg-surface-muted" />
          <div className="h-4 w-4/6 rounded bg-surface-muted" />
          <div className="h-16 rounded-lg bg-surface-muted/60" />
        </div>
      )}

      {/* Rendered Summary Content */}
      {summary && isExpanded && !loading && (
        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="prose prose-sm dark:prose-invert max-w-none [&>.editorjs-content]:space-y-3">
            <Renderer
              content={summary}
              linkedResources={linkedResources}
              openLinksInNewTab
            />
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-foreground/50">
            <span>Grounded in Mela Space emotional wellness practices</span>
            <span className="font-mono text-[10px]">Cached in database • Zero tokens</span>
          </div>
        </div>
      )}
    </div>
  );
}
