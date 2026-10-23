"use client";

import { useState, useEffect, useCallback } from "react";
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
  currentContent?: OutputData | EditorContent;
  mode?: "create" | "edit";
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

const COACHING_THEMES_LIBRARY_AM = [
  "የአእምሮ ድካምን ማስተካከል፡ ያለጸጸት ራስን የመጠበቂያ 4 ተጨባጭ ልምምዶች",
  "የውስጥ ወቃሽ ድምጽን መቆጣጠር፡ ፍጹምነትን ከመሻት ይልቅ ለራስ የሚደረግ ርህራሄ",
  "ስሜታዊ ጫናን እና ጭንቀትን ማርገብ፡ በከባድ ውጥረት ውስጥ ውስጣዊ ሰላምን ማግኘት",
  "የሀዘንና የህይወት ለውጥ ጊዜያትን በቅንነት እና በራስ ርህራሄ ማለፍ",
  "የእረፍት አስፈላጊነት፡ ከመጠን በላይ ስራንና የማያቋርጥ አጣዳፊነትን ማስወገድ",
  "ለድንገተኛ ጭንቀትና ፍርሃት የሚረዱ የአተነፋፈስ ዘዴዎች",
  "ለአመራሮች ስሜታዊ እርጋታ፡ በመጀመሪያ ለራስ ምቹ የስነ-ልቦና ከባቢ መፍጠር",
  "ወሰን ማበጀት ለራስ እንደ እንክብካቤ፡ ያለ ብዙ ማብራሪያ 'አይሆንም' ማለት",
  "ከማነጻጸር ወደ እርካታ፡ የማህበራዊ ሚዲያ ቅናትን እና የራስ ዋጋን መገንዘብ",
  "ውስጣዊ ጥርጣሬን መቋቋም፡ በራስ መተማመንን በረጋ መንፈስ መመለስ",
  "ከውድቀት ወይም ከተስፋ መቁረጥ በኋላ በራስ መተማመንን እንደገና መገንባት",
  "የጥዋት የሰላም ስነ-ስርዓት፡ የነርቭ ስርዓትን የሚጠብቁ የዕለት ተዕለት ልማዶች",
  "የጡንቻና የአካል ውጥረትን ማርገብ፡ ለስነ-ልቦና ጤንነት የሚረዱ አካላዊ ልምምዶች",
  "ራስን ከልብ ይቅር ማለት፡ ያለፈውን ጸጸት አውርዶ በአዲስ መንፈስ መጀመር",
  "አስቸጋሪ የቤተሰብ ግንኙነቶችን በስሜታዊ ሚዛንና በረጋ መንፈስ ማስተዳደር",
  "ሁሉንም ለማስደሰት ከመሮጥ መላቀቅ፡ ጤናማ የግል ድምጽን ማግኘት",
];

const REFINE_THEMES_LIBRARY_EN = [
  "Deepen somatic grounding: add bodily check-ins, sensory anchors, and vagus nerve cues to each section",
  "Shift tone to compassionate and validating: soften perfectionist urgency and hold space for burnout",
  "Actionable reframing: convert high-level theory into practical micro-habits, boundary scripts, and inquiries",
  "Translate and adapt this entire article into fluent, authentic Amharic (አማርኛ) with cultural warmth",
  "Expand closing takeaways: add 4 reflective coaching journal prompts for the reader",
  "Executive discernment: reframe this article for mindful leaders with calm presence and healthy boundaries",
  "Tighten and clarify: eliminate redundant phrasing and strengthen paragraph transitions while preserving voice",
  "Incorporate nervous system regulation: add breath pacing micro-rituals into key sections",
];

const REFINE_THEMES_LIBRARY_AM = [
  "አካላዊና ስሜታዊ እርጋታን ማጎልበት፡ በእያንዳንዱ ክፍል ውስጥ የነርቭ ስርዓትን የሚያረጋጉ ልምምዶችን ማካተት",
  "የአጻጻፍ ስልቱን የበለጠ አዛኝ እና አጽናኝ ማድረግ፡ ራስን ከመውቀስ ይልቅ ርህራሄንና እረፍትን ማጉላት",
  "ተጨባጭ የዕለት ተዕለት ልምምዶች፡ ወደ ተግባር የሚቀየሩ ጥቃቅን ልማዶችን እና ወሰን የማበጀት ዘዴዎችን ማከል",
  "ጽሁፉን ወደ እንግሊዝኛ ወይም ሙሉ አቀላጥፎ አማርኛ መቀየርና ማስተካከል",
  "የማጠቃለያ ሃሳቦችን ማስፋት፡ ለአንባቢው 4 ጥልቅ የግል ማስታወሻ መጻፊያ ጥያቄዎችን ማካተት",
  "ለአመራሮች ተስማሚ ማድረግ፡ በስሜታዊ ብስለት እና በረጋ መንፈስ ውሳኔዎችን የማሳለፍ ጥበብ",
  "ጽሁፉን ይበልጥ ግልጽ እና አጭር ማድረግ፡ ዋናውን ፍሬ ነገር ሳያጣ አላስፈላጊ ቃላትን መቀነስ",
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

function getSuggestionStorageKey(lang: "en" | "am", isRefine: boolean) {
  return `melaspace_ai_suggestions_${isRefine ? "refine" : "draft"}_${lang}`;
}

function getStoredSuggestions(lang: "en" | "am", isRefine: boolean): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getSuggestionStorageKey(lang, isRefine));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore storage read issues
  }
  return null;
}

export default function AiCoWriterModal({
  isOpen,
  onClose,
  currentTitle,
  currentContent,
  mode,
  onApply,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<"en" | "am">("en");
  const [tone, setTone] = useState<CoachingTone>("grounded");
  const [targetLength, setTargetLength] = useState<"short" | "standard" | "deep">("standard");
  const [loading, setLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<CoWriterResult | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "meta">("preview");

  // Workflow mode: "draft" (new) or "refine" (edit existing content)
  const hasExistingContent = Boolean(currentContent?.blocks && currentContent.blocks.length > 0);
  const [workflowMode, setWorkflowMode] = useState<"draft" | "refine">("draft");

  // Browser notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  const isRefine = workflowMode === "refine";

  const getLibrary = useCallback(
    (lang: "en" | "am", refine: boolean) => {
      if (refine) {
        return lang === "am" ? REFINE_THEMES_LIBRARY_AM : REFINE_THEMES_LIBRARY_EN;
      }
      return lang === "am" ? COACHING_THEMES_LIBRARY_AM : COACHING_THEMES_LIBRARY;
    },
    []
  );

  const [suggestionOffset, setSuggestionOffset] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>(() => {
    return COACHING_THEMES_LIBRARY.slice(0, 4);
  });
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  // Load persisted suggestions from localStorage on mount or when mode/language changes
  useEffect(() => {
    const stored = getStoredSuggestions(language, isRefine);
    if (stored) {
      setSuggestions(stored.slice(0, 4));
    } else {
      const lib = getLibrary(language, isRefine);
      setSuggestions(lib.slice(0, 4));
    }
    setSuggestionOffset(0);
  }, [language, isRefine, getLibrary]);

  // Sync initial workflowMode when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || hasExistingContent) {
        setWorkflowMode("refine");
      } else {
        setWorkflowMode("draft");
      }
    }
  }, [isOpen, mode, hasExistingContent]);

  // Check notification permission on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === "granted") {
          toast.success("Browser notifications enabled!");
        } else if (perm === "denied") {
          toast.error("Notifications blocked in browser settings.");
        }
      } catch {
        // ignore
      }
    }
  };

  const handleShuffleSuggestions = () => {
    const lib = getLibrary(language, isRefine);
    const nextOffset = (suggestionOffset + 4) % lib.length;
    setSuggestionOffset(nextOffset);
    const nextSlice = lib.slice(nextOffset, nextOffset + 4);
    setSuggestions(nextSlice);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          getSuggestionStorageKey(language, isRefine),
          JSON.stringify(nextSlice)
        );
      } catch {}
    }
  };

  const handleRegenerateAiIdeas = async () => {
    setIsGeneratingIdeas(true);
    try {
      const base = `/api/admin/blogs/ai-cowriter/ideas?language=${language}${isRefine ? "&mode=refine" : ""}`;
      const url = topic.trim()
        ? `${base}&topic=${encodeURIComponent(topic.trim())}`
        : base;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setSuggestions(json.data);
        // Persist to localStorage across logins
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              getSuggestionStorageKey(language, isRefine),
              JSON.stringify(json.data)
            );
          } catch {}
        }
        toast.success(
          language === "am"
            ? "4 አዳዲስ የርዕስ ሃሳቦች ተዘጋጅተዋል!"
            : "Generated 4 fresh coaching themes!"
        );
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
      toast.error(
        language === "am"
          ? isRefine
            ? "እባክዎን ማሻሻያ መመሪያዎን ያስገቡ"
            : "እባክዎን መጀመሪያ የጽሁፉን ርዕስ ወይም ማስታወሻ ያስገቡ"
          : isRefine
            ? "Please enter your editing instructions"
            : "Please enter a topic or rough notes first"
      );
      return;
    }

    // Auto-prompt browser notification permission if not yet decided
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission().then((p) => setNotificationPermission(p));
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
          language,
          existingTitle: currentTitle || undefined,
          existingContent: isRefine ? (currentContent as EditorContent) : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate article");
      }

      setResult(json.data);
      setActiveTab("preview");

      // Notify through browser if allowed
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          const notif = new Notification(
            language === "am" ? "የጽሁፍ ዝግጅት ተጠናቋል! ✍️" : "Article Ready! ✍️",
            {
              body:
                language === "am"
                  ? `"${json.data.title}" በተሳካ ሁኔታ ተጠናቋል። ለማየትና ለመተግበር እዚህ ይጫኑ!`
                  : `Gemini has finished ${isRefine ? "refining" : "drafting"} "${json.data.title}". Click to review and apply!`,
              icon: "/favicon.ico",
            }
          );
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch (notifErr) {
          console.warn("Browser notification error:", notifErr);
        }
      }

      toast.success(
        language === "am"
          ? isRefine
            ? "ጽሁፉ በጀሚኒ ተሻሽሏል!"
            : "ጽሁፉ በጀሚኒ ተዘጋጅቷል!"
          : isRefine
            ? "Article refined with Gemini!"
            : "Article drafted by Gemini!"
      );
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
      // 1. Fetch current categories from MongoDB with ?all=true so unpublished/new categories are visible
      const res = await fetch("/api/categories?all=true");
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
      const newlyCreatedDocs: Array<{ _id: string; name: string; slug: string }> = [];

      // 2. Resolve or create categories from categorySuggestions if accepting draft
      if (!append && Array.isArray(result.categorySuggestions)) {
        for (const rawName of result.categorySuggestions) {
          const name = rawName.trim();
          if (!name) continue;
          const lower = name.toLowerCase();

          const existingId = categoryMapByName.get(lower) || categoryMapBySlug.get(lower);
          if (existingId) {
            finalCategoryIds.add(existingId);
            const foundExisting = existingCategories.find((c) => c._id === existingId);
            if (foundExisting) newlyCreatedDocs.push(foundExisting);
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
                newlyCreatedDocs.push({
                  _id: createJson.data._id,
                  name: createJson.data.name || name,
                  slug: createJson.data.slug || "",
                });
              } else if (createRes.status === 409) {
                // Already exists (slug clash), refetch all and find ID
                const refetch = await fetch("/api/categories?all=true");
                const refetchJson = await refetch.json();
                const found = (refetchJson.data as Array<{ _id: string; name: string; slug: string }>).find(
                  (cat) => cat.name.toLowerCase() === lower
                );
                if (found) {
                  finalCategoryIds.add(found._id);
                  newlyCreatedDocs.push(found);
                }
              }
            } catch (createErr) {
              console.error("Failed to create category:", name, createErr);
            }
          }
        }
      }

      // 3. Dispatch global category refresh with the full document objects for immediate rendering
      if (newlyCreatedDocs.length > 0) {
        window.dispatchEvent(
          new CustomEvent("refresh-categories", { detail: newlyCreatedDocs })
        );
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

      if (newlyCreatedDocs.length > 0) {
        toast.success(`Applied & matched categories: ${newlyCreatedDocs.map((c) => c.name).join(", ")}`);
      } else {
        toast.success(
          append
            ? "Appended AI content to editor"
            : isRefine
              ? "Applied refined article to editor!"
              : "Applied AI draft to article!"
        );
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
                Generate or refine empathetic coaching articles with auto-matched categories &amp; resource hovercards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Permission Indicator */}
            {notificationPermission === "granted" ? (
              <span
                title="Browser notifications active when AI generation finishes"
                className="hidden sm:inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Alerts On</span>
              </span>
            ) : notificationPermission === "default" ? (
              <button
                type="button"
                onClick={handleRequestNotification}
                title="Enable browser alerts when Gemini finishes drafting"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-foreground/70 hover:text-foreground hover:bg-surface-muted border border-border/70 transition cursor-pointer"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Notify me</span>
              </button>
            ) : null}

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
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Workflow Mode Tabs (if article content already exists) */}
          {hasExistingContent && (
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-muted/40 p-1.5">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setWorkflowMode("refine")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isRefine
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-foreground/70 hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Edit / Refine Current Article</span>
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-white/20">
                    Existing
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkflowMode("draft")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    !isRefine
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-foreground/70 hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                  <span>Draft Brand New Article</span>
                </button>
              </div>

              <span className="text-[11px] text-foreground/50 hidden md:inline px-2">
                {isRefine
                  ? "Gemini will improve your current draft"
                  : "Drafts a completely new post from scratch"}
              </span>
            </div>
          )}

          {/* Prompt / Topic Configuration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-1.5">
                {isRefine
                  ? language === "am"
                    ? "የማሻሻያ፣ የለውጥ፣ ወይም የትርጉም መመሪያ"
                    : "Edit & Refinement Instructions"
                  : language === "am"
                    ? "የጽሁፉ ርዕስ፣ ማስታወሻ ወይም ሃሳቦች"
                    : "Topic, Rough Notes, or Coaching Theme"}
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  isRefine
                    ? language === "am"
                      ? "ጽሁፉ ላይ ምን እንዲታከል ወይም እንዲሻሻል እንደሚፈልጉ ይጻፉ (ለምሳሌ 'የአተነፋፈስ ልምምዶችን አክብርበት'፣ 'የስሜት እርጋታን አጉላበት'፣ 'በአማርኛ ቀይረው')..."
                      : "Tell Gemini what to edit, refine, or add (e.g. 'Deepen the somatic practices', 'Rewrite in Amharic', 'Add journaling questions at the end', 'Make the tone more compassionate')..."
                    : language === "am"
                      ? "የጽሁፉን ርዕስ፣ ነጥቦች፣ ወይም የትኩረት ሃሳቦች እዚህ ያስገቡ..."
                      : "Type your topic, bullet points, podcast transcript, or client reflection themes..."
                }
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary resize-y"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="rounded-xl border border-border/70 bg-surface-muted/30 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground/85">
                    {isRefine
                      ? language === "am"
                        ? "የማሻሻያ ሃሳቦችና ጥቆማዎች"
                        : "Editing Directives & Suggestions"
                      : language === "am"
                        ? "የጽሁፍ ርዕስ ሃሳቦች (አማርኛ)"
                        : "Coaching Themes & Prompt Inspiration"}
                  </span>
                  <span className="text-[10px] text-foreground/50 hidden sm:inline">
                    {language === "am" ? "(ለመምረጥ ይጫኑ)" : "(click to use)"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleShuffleSuggestions}
                    title={language === "am" ? "የተመረጡ ሃሳቦችን ቀይር" : "Shuffle curated suggestions from library"}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground/75 hover:text-foreground hover:bg-background border border-border/70 transition cursor-pointer shadow-2xs"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{language === "am" ? "ቀይር" : "Shuffle"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerateAiIdeas}
                    disabled={isGeneratingIdeas}
                    title={language === "am" ? "በጀሚኒ 4 አዳዲስ ሃሳቦችን ፍጠር" : "Generate 4 fresh custom ideas with Gemini AI"}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <svg
                      className={`h-3 w-3 ${isGeneratingIdeas ? "animate-spin" : ""}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                    </svg>
                    <span>
                      {isGeneratingIdeas
                        ? language === "am"
                          ? "በማዘጋጀት ላይ..."
                          : "Generating..."
                        : language === "am"
                          ? "አዳዲስ ሃሳቦች (AI)"
                          : "Regenerate Ideas (AI)"}
                    </span>
                  </button>
                </div>
              </div>

              {isGeneratingIdeas ? (
                <div className="flex items-center justify-center py-4 gap-2 text-xs font-medium text-primary animate-pulse">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                  <span>
                    {language === "am"
                      ? "ጀሚኒ 4 አዳዲስ ሃሳቦችን እያዘጋጀ ነው..."
                      : "Gemini is generating 4 fresh suggestions..."}
                  </span>
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
                          toast.success(language === "am" ? "ሃሳቡ ተመርጧል!" : "Loaded into prompt!");
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

            {/* Controls Row: Language, Tone & Length */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-1.5 flex items-center justify-between">
                  <span>Language / ቋንቋ</span>
                  <span className="text-[10px] text-primary font-normal">{language === "am" ? "አማርኛ" : "English"}</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => {
                    const nextLang = e.target.value as "en" | "am";
                    setLanguage(nextLang);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="en">English (Default)</option>
                  <option value="am">Amharic (አማርኛ)</option>
                </select>
              </div>

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
                    <span>
                      {language === "am"
                        ? isRefine
                          ? "ጀሚኒ ጽሁፉን እያሻሻለ ነው..."
                          : "ጀሚኒ ጽሁፉን በማዘጋጀት ላይ ነው..."
                        : isRefine
                          ? "Gemini is refining article..."
                          : "Gemini is generating post..."}
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" />
                    </svg>
                    <span>
                      {isRefine
                        ? language === "am"
                          ? "በጀሚኒ ጽሁፉን አሻሽል"
                          : "Refine Article with Gemini"
                        : language === "am"
                          ? "በጀሚኒ ጽሁፍ አዘጋጅ"
                          : "Draft Article with Gemini"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Inspection Section */}
          {result && (
            <div className="border-t border-border/80 pt-5 space-y-4">
              {/* High-Contrast Draft Complete Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-600/40 bg-emerald-500/15 dark:bg-emerald-950/50 p-4 text-foreground shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                        {isRefine
                          ? language === "am"
                            ? "የጽሁፉ ማሻሻያ ተጠናቋል!"
                            : "Article Refinement Complete & Ready"
                          : language === "am"
                            ? "የጽሁፉ ዝግጅት ተጠናቋል!"
                            : "Draft Complete & Ready for Review"}
                      </h4>
                      <span className="rounded-full bg-emerald-600/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 border border-emerald-600/30">
                        {isRefine
                          ? language === "am"
                            ? "ተሻሽሏል"
                            : "Refined"
                          : language === "am"
                            ? "ተዘጋጅቷል"
                            : "Generated"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-900/95 dark:text-emerald-200 mt-0.5">
                      {language === "am"
                        ? "ከታች ያለውን ረቂቅ ይገምግሙ። «ሁሉንም ተግብር» ሲጫኑ የተጠቆሙ ምድቦች ተፈጥረው ጽሁፉ ይተገበራል።"
                        : "Review below. Clicking \"Apply Everything\" auto-creates suggested categories and applies the content."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  <span className="rounded-lg bg-background/90 px-2.5 py-1 text-foreground border border-border/80 shadow-2xs">
                    {result.content.blocks.length} blocks
                  </span>
                  {result.categorySuggestions?.length > 0 && (
                    <span className="rounded-lg bg-background/90 px-2.5 py-1 text-foreground border border-border/80 shadow-2xs">
                      {result.categorySuggestions.length} categories
                    </span>
                  )}
                  {result.matchedResourceIds?.length > 0 && (
                    <span className="rounded-lg bg-background/90 px-2.5 py-1 text-foreground border border-border/80 shadow-2xs">
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
                <div
                  className={`rounded-xl border border-border/80 bg-background p-4 sm:p-6 space-y-4 max-h-[360px] overflow-y-auto ${
                    language === "am" ? "font-amharic" : ""
                  }`}
                  lang={language}
                >
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
                        <span>Applying &amp; Matching Categories...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>
                          {isRefine
                            ? "Apply Refined Article & Categories"
                            : "Apply Everything (Title, Excerpt, Content & Categories)"}
                        </span>
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
