"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import Renderer from "@/components/editorjs/Renderer";
import type { EditorContent } from "@/types/editor";
import type { OutputData } from "@editorjs/editorjs";

interface CoWriterResult {
  title: string;
  excerpt: string;
  categorySuggestions: string[];
  matchedCategoryIds: string[];
  matchedResourceIds: string[];
  content: EditorContent;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTitle?: string;
  onApply: (data: {
    title: string;
    excerpt: string;
    content: OutputData;
    categoryIds: string[];
    resourceIds: string[];
    append?: boolean;
  }) => void;
}

const COACHING_THEMES_LIBRARY = [
  "Navigating cognitive fatigue: 4 somatic micro-practices for boundary setting without guilt",
  "Overcoming the inner critic: A compassionate inquiry into perfectionism and nervous system safety",
  "Micro-moments of emotional grounding: How to reset when feeling chronically overwhelmed",
  "Holding space for grief and life transitions with gentle self-compassion",
  "The courage to rest: Dismantling internalized urgency and toxic productivity",
  "Somatic breath practices for acute anxiety: Finding your anchor in high-stress moments",
  "Emotional de-escalation for leaders: Creating psychological safety for yourself first",
  "Boundaries as acts of self-care: How to say 'no' without over-explaining",
  "From comparison to contentment: Mindful reflection on social media envy and self-worth",
  "Navigating imposter syndrome: Reclaiming your authority with calm inner trust",
  "Rebuilding self-trust after failure or disappointment: A somatic recovery roadmap",
  "The quiet power of micro-rituals: Building morning pacing that protects your nervous system",
  "Unclenching the jaw of life: Somatic practices for chronic muscular tension and stress",
  "Radical self-forgiveness: How to release past regret and begin again with kindness",
  "Navigating difficult family dynamics: Grounding tools for emotional equilibrium",
  "Understanding people-pleasing as a trauma response: Finding safe assertiveness",
];

type CoachingTone =
  | "grounded"
  | "somatic"
  | "actionable"
  | "compassionate"
  | "reflective"
  | "poetic"
  | "leadership"
  | "playful"
  | "direct"
  | "philosophical";

export default function AiCoWriterModal({
  isOpen,
  onClose,
  currentTitle,
  onApply,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<CoachingTone>("grounded");
  const [targetLength, setTargetLength] = useState<"short" | "standard" | "deep">("standard");
  const [loading, setLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<CoWriterResult | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "meta">("preview");

  const [suggestionOffset, setSuggestionOffset] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    COACHING_THEMES_LIBRARY.slice(0, 4)
  );
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  const handleShuffleSuggestions = () => {
    const nextOffset = (suggestionOffset + 4) % COACHING_THEMES_LIBRARY.length;
    setSuggestionOffset(nextOffset);
    setSuggestions(COACHING_THEMES_LIBRARY.slice(nextOffset, nextOffset + 4));
  };

  const handleRegenerateAiIdeas = async () => {
    setIsGeneratingIdeas(true);
    try {
      const url = topic.trim()
        ? `/api/admin/blogs/ai-cowriter/ideas?topic=${encodeURIComponent(topic.trim())}`
        : "/api/admin/blogs/ai-cowriter/ideas";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setSuggestions(json.data);
        toast.success("Generated 4 fresh coaching themes!");
      } else {
        const errorMsg = json.error || "Failed to generate AI ideas";
        toast.error(errorMsg);
        handleShuffleSuggestions();
      }
    } catch (err) {
      console.error("handleRegenerateAiIdeas error:", err);
      toast.error("Failed to fetch fresh ideas. Shuffled library instead.");
      handleShuffleSuggestions();
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or rough notes first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/blogs/ai-cowriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          tone,
          targetLength,
          existingTitle: currentTitle || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate article");
      }

      setResult(json.data);
      setActiveTab("preview");
      toast.success("Article drafted by Gemini!");
    } catch (err) {
      console.error(err);
      const cleanMessage =
        err instanceof Error && err.message && !err.message.includes("{")
          ? err.message
          : "Failed to generate article with AI. Please try again.";
      toast.error(cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (append = false) => {
    if (!result) return;
    setIsApplying(true);

    try {
      // 1. Fetch current categories from MongoDB to check what exists
      const res = await fetch("/api/categories");
      const json = await res.json();
      const existingCategories: Array<{ _id: string; name: string; slug: string }> =
        json.success && Array.isArray(json.data) ? json.data : [];

      const categoryMapByName = new Map<string, string>();
      const categoryMapBySlug = new Map<string, string>();
      for (const c of existingCategories) {
        categoryMapByName.set(c.name.toLowerCase().trim(), c._id);
        categoryMapBySlug.set(c.slug.toLowerCase().trim(), c._id);
      }

      const finalCategoryIds = new Set<string>(result.matchedCategoryIds || []);
      const newlyCreatedNames: string[] = [];

      // 2. Resolve or create categories from categorySuggestions if accepting draft
      if (!append && Array.isArray(result.categorySuggestions)) {
        for (const rawName of result.categorySuggestions) {
          const name = rawName.trim();
          if (!name) continue;
          const lower = name.toLowerCase();

          const existingId = categoryMapByName.get(lower) || categoryMapBySlug.get(lower);
          if (existingId) {
            finalCategoryIds.add(existingId);
          } else {
            // Create category in MongoDB
            try {
              const createRes = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
              });
              const createJson = await createRes.json();
              if (createJson.success && createJson.data?._id) {
                finalCategoryIds.add(createJson.data._id);
                newlyCreatedNames.push(name);
              } else if (createRes.status === 409) {
                // Already exists (slug clash), refetch and find ID
                const refetch = await fetch("/api/categories");
                const refetchJson = await refetch.json();
                const found = (refetchJson.data as Array<{ _id: string; name: string }>).find(
                  (cat) => cat.name.toLowerCase() === lower
                );
                if (found) finalCategoryIds.add(found._id);
              }
            } catch (createErr) {
              console.error("Failed to create category:", name, createErr);
            }
          }
        }
      }

      // 3. Dispatch global category refresh so CategorySelector on the page updates its state
      if (newlyCreatedNames.length > 0) {
        window.dispatchEvent(new CustomEvent("refresh-categories"));
      }

      // 4. Pass resolved and newly created category IDs to blog editor
      onApply({
        title: result.title,
        excerpt: result.excerpt,
        content: result.content as OutputData,
        categoryIds: Array.from(finalCategoryIds),
        resourceIds: result.matchedResourceIds || [],
        append,
      });

      if (newlyCreatedNames.length > 0) {
        toast.success(`Created & applied categories: ${newlyCreatedNames.join(", ")}`);
      } else {
        toast.success(append ? "Appended AI content to editor" : "Applied AI draft to article!");
      }

      onClose();
    } catch (err) {
      console.error("Error applying AI draft:", err);
      onApply({
        title: result.title,
        excerpt: result.excerpt,
        content: result.content as OutputData,
        categoryIds: result.matchedCategoryIds || [],
        resourceIds: result.matchedResourceIds || [],
        append,
      });
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 bg-surface-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 text-white shadow-sm">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  AI Editorial Co-Writer
                </h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                  Gemini
                </span>
                {result && !loading && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Draft Ready</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/60">
                Generate grounded, empathetic coaching articles with auto-matched categories &amp; resource hovercards.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground/50 hover:bg-surface-muted hover:text-foreground transition cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Prompt / Topic Configuration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-1.5">
                Topic, Rough Notes, or Coaching Theme
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Type your topic, bullet points, podcast transcript, or client reflection themes..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary resize-y"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="rounded-xl border border-border/70 bg-surface-muted/30 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground/85">
                    Coaching Themes &amp; Prompt Inspiration
                  </span>
                  <span className="text-[10px] text-foreground/50 hidden sm:inline">
                    (click to use)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleShuffleSuggestions}
                    title="Shuffle curated coaching themes from library"
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-background border border-border/70 transition cursor-pointer shadow-2xs"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Shuffle</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerateAiIdeas}
                    disabled={isGeneratingIdeas}
                    title="Generate 4 fresh custom coaching ideas with Gemini AI"
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <svg
                      className={`h-3 w-3 ${isGeneratingIdeas ? "animate-spin" : ""}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                    </svg>
                    <span>{isGeneratingIdeas ? "Generating..." : "Regenerate Ideas (AI)"}</span>
                  </button>
                </div>
              </div>

              {isGeneratingIdeas ? (
                <div className="flex items-center justify-center py-4 gap-2 text-xs font-medium text-primary animate-pulse">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                  <span>Gemini is generating 4 fresh coaching themes...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((promptText, i) => {
                    const isSelected = topic.trim() === promptText.trim();
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTopic(promptText);
                          toast.success("Loaded theme into topic!");
                        }}
                        className={`group flex items-start gap-2 rounded-xl p-2.5 text-left text-xs transition cursor-pointer border ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/40 shadow-2xs"
                            : "border-border/80 bg-background/90 text-foreground/80 hover:border-primary/50 hover:bg-background hover:text-foreground"
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 rounded-full p-0.5 ${isSelected ? "text-primary" : "text-primary/70 group-hover:text-primary"}`}>
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                          </svg>
                        </div>
                        <span className="line-clamp-2 leading-relaxed">{promptText}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Controls Row: Tone & Length */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-1.5">
                  Coaching Tone &amp; Voice
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as CoachingTone)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="grounded">Grounded &amp; Empathetic (Default)</option>
                  <option value="somatic">Somatic &amp; Nervous System Regulating</option>
                  <option value="actionable">Actionable Habits &amp; Inquiries</option>
                  <option value="compassionate">Deep Validation &amp; Holding Space</option>
                  <option value="reflective">Mindful Inquiry &amp; Deep Journaling</option>
                  <option value="poetic">Poetic, Soulful &amp; Lyrical Reflection</option>
                  <option value="leadership">Mindful Leadership &amp; Executive Presence</option>
                  <option value="playful">Playful, Expansive &amp; Creative Curiosity</option>
                  <option value="direct">Direct, Candid &amp; Discerning Coaching</option>
                  <option value="philosophical">Philosophical &amp; Contemplative Wisdom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-1.5">
                  Target Depth &amp; Length
                </label>
                <select
                  value={targetLength}
                  onChange={(e) => setTargetLength(e.target.value as typeof targetLength)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="short">Quick Read (~600 words)</option>
                  <option value="standard">Standard Editorial (~1,000 words)</option>
                  <option value="deep">In-Depth Holistic Guide (~1,500 words)</option>
                </select>
              </div>
            </div>

            {/* Generate Trigger Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/95 hover:to-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
                    </svg>
                    <span>Gemini is generating post...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" />
                    </svg>
                    <span>Draft Article with Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Inspection Section */}
          {result && (
            <div className="border-t border-border/80 pt-5 space-y-4">
              {/* Draft Complete Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 sm:p-4 text-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-xs shrink-0">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">
                        Draft Complete &amp; Ready for Review
                      </h4>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Generated
                      </span>
                    </div>
                    <p className="text-xs opacity-85">
                      Review below. Clicking &ldquo;Apply Everything&rdquo; auto-creates suggested categories and applies the content.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                  <span className="rounded-lg bg-background/80 px-2.5 py-1 text-foreground border border-border/60 shadow-2xs">
                    {result.content.blocks.length} blocks
                  </span>
                  {result.categorySuggestions?.length > 0 && (
                    <span className="rounded-lg bg-background/80 px-2.5 py-1 text-foreground border border-border/60 shadow-2xs">
                      {result.categorySuggestions.length} categories
                    </span>
                  )}
                  {result.matchedResourceIds?.length > 0 && (
                    <span className="rounded-lg bg-background/80 px-2.5 py-1 text-foreground border border-border/60 shadow-2xs">
                      {result.matchedResourceIds.length} resources cited
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-between border-b border-border">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition cursor-pointer ${
                      activeTab === "preview"
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    Article Preview ({result.content.blocks.length} Blocks)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("meta")}
                    className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition cursor-pointer ${
                      activeTab === "meta"
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    Title, Excerpt &amp; Matched Meta
                  </button>
                </div>

                <span className="text-[11px] text-foreground/50">
                  Ready to apply to your editor
                </span>
              </div>

              {/* Tab 1: Preview Body via <Renderer /> */}
              {activeTab === "preview" && (
                <div className="rounded-xl border border-border/80 bg-background p-4 sm:p-6 space-y-4 max-h-[360px] overflow-y-auto">
                  <h1 className="text-2xl font-bold leading-tight">{result.title}</h1>
                  <p className="text-xs text-foreground/60 italic border-l-2 border-primary/50 pl-3">
                    {result.excerpt}
                  </p>
                  <hr className="border-border/50" />
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Renderer content={result.content} openLinksInNewTab />
                  </div>
                </div>
              )}

              {/* Tab 2: Meta Breakdown */}
              {activeTab === "meta" && (
                <div className="space-y-3 rounded-xl border border-border bg-surface-muted/20 p-4 text-xs">
                  <div>
                    <span className="font-semibold text-foreground/60 uppercase text-[10px]">Title:</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">{result.title}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-foreground/60 uppercase text-[10px]">
                      SEO Excerpt ({result.excerpt.length} chars):
                    </span>
                    <p className="text-foreground/80 mt-0.5">{result.excerpt}</p>
                  </div>

                  {result.categorySuggestions?.length > 0 && (
                    <div>
                      <span className="font-semibold text-foreground/60 uppercase text-[10px]">
                        Suggested Categories:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {result.categorySuggestions.map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium text-[11px]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.matchedResourceIds?.length > 0 && (
                    <div>
                      <span className="font-semibold text-foreground/60 uppercase text-[10px]">
                        Suggested Downloadable Resources:
                      </span>
                      <p className="text-[11px] text-foreground/65 mt-0.5">
                        {result.matchedResourceIds.length} resources matched and cited inline.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="text-xs text-foreground/60 hover:text-foreground transition cursor-pointer underline underline-offset-4"
                  >
                    Clear &amp; Start Over
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    title="Regenerate this draft with Gemini"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted transition cursor-pointer disabled:opacity-50"
                  >
                    <svg
                      className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>{loading ? "Regenerating..." : "Regenerate Draft"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApply(true)}
                    disabled={isApplying}
                    title="Keep current title & categories, but append the generated blocks to editor"
                    className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted transition cursor-pointer disabled:opacity-50"
                  >
                    Append Content Only
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApply(false)}
                    disabled={isApplying}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                  >
                    {isApplying ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
                        </svg>
                        <span>Applying &amp; Creating Categories...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Apply Everything (Title, Excerpt, Content &amp; Categories)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
