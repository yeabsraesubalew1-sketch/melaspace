import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type { EditorContent, EditorBlock } from "@/types/editor";

/**
 * Singleton Gemini client configured via Google AI Studio API key.
 */
const apiKey = process.env.GEMINI_API_KEY || "";

export const ai = new GoogleGenAI({
  apiKey,
});

export const GEMINI_PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];
export const GEMINI_MODEL = GEMINI_PRIMARY_MODEL;

/**
 * Sanitizes raw SDK / API errors into friendly, concise user-facing messages.
 * Prevents raw JSON dumps, technical stack traces, or endpoint URLs from reaching toasts.
 */
export function sanitizeAiError(error: unknown): string {
  if (!error) return "An unexpected error occurred with the AI service.";

  const raw = error instanceof Error ? error.message : String(error);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        const innerMsg = String(parsed.error.message);
        if (
          parsed.error.code === 503 ||
          innerMsg.includes("high demand") ||
          innerMsg.includes("UNAVAILABLE") ||
          innerMsg.includes("overloaded")
        ) {
          return "The AI service is experiencing temporary high demand. Please try again in a moment.";
        }
        if (
          parsed.error.code === 404 ||
          innerMsg.includes("no longer available") ||
          innerMsg.includes("not found")
        ) {
          return "The configured AI model is temporarily unavailable or updating. Please try again shortly.";
        }
        if (
          parsed.error.code === 429 ||
          innerMsg.includes("quota") ||
          innerMsg.includes("rate limit")
        ) {
          return "AI service is currently busy. Please wait a moment and try again.";
        }
        if (
          parsed.error.code === 401 ||
          parsed.error.code === 403 ||
          innerMsg.includes("API key")
        ) {
          return "Gemini API key is invalid or unauthorized. Please verify your GEMINI_API_KEY.";
        }
        return (
          innerMsg.split("We recommend")[0].split("https://")[0].trim() ||
          "AI generation failed. Please try again."
        );
      }
    }
  } catch {
    // fallback
  }

  if (/503|high demand|unavailable|overloaded/i.test(raw)) {
    return "The AI service is experiencing temporary high demand. Please try again in a moment.";
  }
  if (/quota|rate limit|429/i.test(raw)) {
    return "AI service rate limit reached. Please wait a moment and try again.";
  }
  if (/api key|unauthorized|401|403/i.test(raw)) {
    return "Invalid or unauthorized Gemini API key.";
  }
  if (/not found|404|no longer available/i.test(raw)) {
    return "AI model is currently updating. Please try again shortly.";
  }

  if (raw.length > 100 || raw.includes("{") || raw.includes("http")) {
    return "AI service encountered an issue while processing your request. Please try again.";
  }

  return raw;
}

/**
 * Tone & Voice Guardrails tailored specifically for Mela Space:
 * Coaching, emotional wellness, somatic reflection, and personal growth.
 */
export const MELA_TONE_SYSTEM_INSTRUCTION = `
You are the lead empathetic editorial voice for Mela Space, a mindful sanctuary for personal coaching, emotional wellness, somatic reflection, and self-discovery.

Core Voice & Tone Guardrails:
1. Grounded & Empathetic: Write with gentle, compassionate resonance. Validate human vulnerability and emotional pacing without judgment.
2. Non-Clinical & Accessible: Avoid heavy medical diagnostic jargon or clinical detachment. Instead, use warm, somatic, nervous-system-informed language (e.g., "gentle awareness", "emotional grounding", "internal safety", "micro-reflections").
3. Anti-Toxic Positivity: Never demand instant positivity, aggressive hustle, or "fixing" oneself. Acknowledge grief, burnout, overwhelm, and fatigue as valid human experiences requiring space and breath.
4. Actionable & Reflective: Pair insights with spacious inquiry, journal prompts, breath cues, or gentle micro-practices that readers can integrate today without guilt.
5. Formatting & Cleanliness: Produce clean HTML formatting for block texts without markdown asterisks or raw brackets inside the HTML tags.
`.trim();

/**
 * Converts Editor.js JSON content into a clean, markdown-like plain text format
 * ideal for Gemini to read and comprehend context.
 */
export function editorJsToPlainText(content: EditorContent | null | undefined): string {
  if (!content || !Array.isArray(content.blocks)) return "";

  const lines: string[] = [];

  for (const block of content.blocks) {
    if (!block || typeof block !== "object") continue;
    const data = block.data as Record<string, unknown> | undefined;

    switch (block.type) {
      case "header": {
        const text = typeof data?.text === "string" ? data.text.replace(/<[^>]+>/g, "").trim() : "";
        const level = typeof data?.level === "number" ? data.level : 2;
        if (text) lines.push(`${"#".repeat(level)} ${text}`);
        break;
      }
      case "paragraph": {
        const text = typeof data?.text === "string" ? data.text.replace(/<[^>]+>/g, "").trim() : "";
        if (text) lines.push(text);
        break;
      }
      case "list": {
        const items = Array.isArray(data?.items) ? data?.items : [];
        for (const item of items) {
          const itemText =
            typeof item === "string"
              ? item
              : typeof (item as { content?: string })?.content === "string"
                ? (item as { content: string }).content
                : "";
          const stripped = itemText.replace(/<[^>]+>/g, "").trim();
          if (stripped) lines.push(`• ${stripped}`);
        }
        break;
      }
      case "quote": {
        const text = typeof data?.text === "string" ? data.text.replace(/<[^>]+>/g, "").trim() : "";
        const caption = typeof data?.caption === "string" ? data.caption.replace(/<[^>]+>/g, "").trim() : "";
        if (text) lines.push(`> "${text}"${caption ? ` — ${caption}` : ""}`);
        break;
      }
      default:
        break;
    }
  }

  return lines.join("\n\n");
}

/**
 * Creates an exact MelaSpace resource mention anchor tag matching the hovercard parser.
 */
export function formatResourceMentionTag(resource: {
  id: string;
  slug: string;
  title: string;
  category?: string;
  filesCount?: number;
  sizeBytes?: number;
  excerpt?: string;
}): string {
  const cleanTitle = resource.title.replace(/"/g, "&quot;");
  const cleanCategory = (resource.category || "Resource").replace(/"/g, "&quot;");
  const cleanExcerpt = (resource.excerpt || "").slice(0, 120).replace(/"/g, "&quot;");
  const files = resource.filesCount ?? 1;
  const size = resource.sizeBytes ?? 0;

  return `<a class="resource-mention" data-resource-id="${resource.id}" data-resource-slug="${resource.slug}" data-resource-title="${cleanTitle}" data-resource-category="${cleanCategory}" data-resource-files="${files}" data-resource-size="${size}" data-resource-excerpt="${cleanExcerpt}" href="/resources/${resource.slug}">${cleanTitle}</a>`;
}

/**
 * Strips redundant paperclip emojis inside or immediately before <a class="resource-mention">
 * to prevent doubled icons (CSS ::before already provides the single 📎).
 */
export function cleanResourceMentionsInHtml(html: string): string {
  if (!html || typeof html !== "string") return html;
  return html
    .replace(/(<a\b[^>]*class=["'][^"']*resource-mention[^"']*["'][^>]*>)\s*📎\s*/gi, "$1")
    .replace(/📎\s*(<a\b[^>]*class=["'][^"']*resource-mention)/gi, "$1");
}

/**
 * Validates and normalizes raw JSON blocks into valid EditorContent.
 */
export function createSafeEditorContent(blocks: EditorBlock[]): EditorContent {
  return {
    time: Date.now(),
    blocks: Array.isArray(blocks) ? blocks : [],
    version: "2.31.3",
  };
}

/**
 * JSON Schema for Blog Summary (Feature 1)
 */
export const blogSummarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overview: {
      type: Type.STRING,
      description: "A 2-3 sentence grounded, compassionate synthesis of the core theme.",
    },
    takeaways: {
      type: Type.ARRAY,
      description: "3 to 5 core takeaways or reflective inquiries. Can include inline HTML formatting like <strong> or resource mentions if provided in context.",
      items: {
        type: Type.STRING,
      },
    },
    quote: {
      type: Type.STRING,
      description: "A resonant, memorable quote or coaching reflection extracted from the article.",
    },
    quoteCaption: {
      type: Type.STRING,
      description: "Caption or attribution for the quote (e.g. 'Mela Reflection', 'Gentle Practice', or the author name).",
    },
    recommendedAction: {
      type: Type.STRING,
      description: "A gentle somatic or micro-coaching step the reader can try right now.",
    },
    mentionedResourceIds: {
      type: Type.ARRAY,
      description: "List of resource IDs from the available resources that were referenced or recommended.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["overview", "takeaways", "quote", "recommendedAction"],
};

/**
 * JSON Schema for Admin AI Co-Writer (Feature 2)
 */
export const coWriterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Compelling, emotionally resonant blog title following Mela Space aesthetics (human-centered, engaging, not clickbait).",
    },
    excerpt: {
      type: Type.STRING,
      description: "120-160 character SEO meta description that captures reader intrigue and search intent.",
    },
    categorySuggestions: {
      type: Type.ARRAY,
      description: "Suggested category names for this blog post.",
      items: {
        type: Type.STRING,
      },
    },
    matchedCategoryIds: {
      type: Type.ARRAY,
      description: "Category IDs from the provided existing categories list that best match this post.",
      items: {
        type: Type.STRING,
      },
    },
    matchedResourceIds: {
      type: Type.ARRAY,
      description: "Resource IDs from the provided published resources list that complement this article.",
      items: {
        type: Type.STRING,
      },
    },
    sections: {
      type: Type.ARRAY,
      description: "3 to 5 structured sections making up the complete coaching post.",
      items: {
        type: Type.OBJECT,
        properties: {
          heading: {
            type: Type.STRING,
            description: "Section header (Level 2).",
          },
          paragraphs: {
            type: Type.ARRAY,
            description: "1 to 3 rich, empathetic coaching paragraphs for this section. Weave in resource mention HTML tag if relevant.",
            items: { type: Type.STRING },
          },
          takeaways: {
            type: Type.ARRAY,
            description: "Optional bullet list of 2-4 reflection prompts or micro-practices.",
            items: { type: Type.STRING },
          },
          quote: {
            type: Type.STRING,
            description: "Optional memorable coaching reflection or quote for this section.",
          },
          quoteCaption: {
            type: Type.STRING,
            description: "Optional attribution caption for the quote.",
          },
        },
        required: ["heading", "paragraphs"],
      },
    },
  },
  required: ["title", "excerpt", "categorySuggestions", "sections"],
};

/**
 * Converts structured sections into standard Editor.js blocks
 */
export function sectionsToEditorBlocks(
  sections: Array<{
    heading: string;
    paragraphs: string[];
    takeaways?: string[];
    quote?: string;
    quoteCaption?: string;
  }>
): EditorBlock[] {
  const blocks: EditorBlock[] = [];

  if (!Array.isArray(sections)) return blocks;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (!sec) continue;

    // Header block
    if (sec.heading && sec.heading.trim()) {
      blocks.push({
        type: "header",
        data: {
          text: sec.heading.trim(),
          level: 2,
        },
      });
    }

    // Paragraph blocks
    if (Array.isArray(sec.paragraphs)) {
      for (const p of sec.paragraphs) {
        if (typeof p === "string" && p.trim()) {
          blocks.push({
            type: "paragraph",
            data: { text: cleanResourceMentionsInHtml(p.trim()) },
          });
        }
      }
    }

    // Quote block
    if (sec.quote && sec.quote.trim()) {
      blocks.push({
        type: "quote",
        data: {
          text: cleanResourceMentionsInHtml(sec.quote.trim()),
          caption: sec.quoteCaption?.trim() || "Mela Reflection",
          alignment: "left",
        },
      });
    }

    // List block
    if (Array.isArray(sec.takeaways) && sec.takeaways.length > 0) {
      const items = sec.takeaways
        .filter((t) => typeof t === "string" && t.trim())
        .map((t) => cleanResourceMentionsInHtml(t.trim()));
      if (items.length > 0) {
        blocks.push({
          type: "list",
          data: {
            style: "unordered",
            items,
          },
        });
      }
    }

    // Delimiter between major sections (except the last section)
    if (i < sections.length - 1) {
      blocks.push({
        type: "delimiter",
        data: {},
      });
    }
  }

  return blocks;
}

/**
 * Strips markdown codeblocks and extracts valid JSON boundaries
 */
export function cleanJsonString(raw: string): string {
  let cleaned = (raw || "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

/**
 * Attempts to repair slightly malformed or truncated JSON (e.g. if token limit cut off string)
 */
export function attemptJsonRepair(jsonStr: string): string {
  let str = jsonStr.trim();
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "\\" && inString) {
      escaped = !escaped;
      continue;
    }
    if (c === '"' && !escaped) {
      inString = !inString;
    }
    escaped = false;
  }
  if (inString) {
    str += '"';
  }

  let openBraces = 0;
  let openBrackets = 0;
  inString = false;
  escaped = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "\\" && inString) {
      escaped = !escaped;
      continue;
    }
    if (c === '"' && !escaped) {
      inString = !inString;
      continue;
    }
    escaped = false;
    if (!inString) {
      if (c === "{") openBraces++;
      if (c === "}") openBraces = Math.max(0, openBraces - 1);
      if (c === "[") openBrackets++;
      if (c === "]") openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  while (openBrackets > 0) {
    str += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    str += "}";
    openBraces--;
  }

  return str;
}

export interface GenerateGeminiJsonOptions {
  prompt: string;
  systemInstruction?: string;
  schema?: Schema;
  temperature?: number;
  maxOutputTokens?: number;
  primaryModel?: string;
}

/**
 * Generates JSON from Gemini with automatic multi-model fallback and transient retry logic.
 */
export async function generateGeminiJson<T>({
  prompt,
  systemInstruction = MELA_TONE_SYSTEM_INSTRUCTION,
  schema,
  temperature = 0.6,
  maxOutputTokens = 4096,
  primaryModel = GEMINI_PRIMARY_MODEL,
}: GenerateGeminiJsonOptions): Promise<T> {
  const modelsToTry = [
    primaryModel,
    ...GEMINI_FALLBACK_MODELS.filter((m) => m !== primaryModel),
  ];

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature,
            maxOutputTokens,
          },
        });

        const rawText = response.text || "";
        const cleaned = cleanJsonString(rawText);

        try {
          return JSON.parse(cleaned) as T;
        } catch {
          const repaired = attemptJsonRepair(cleaned);
          return JSON.parse(repaired) as T;
        }
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient =
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("429") ||
          msg.includes("quota") ||
          msg.includes("rate limit") ||
          msg.includes("overloaded");

        if (isTransient && attempt === 1) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }

        break;
      }
    }
  }

  throw lastError || new Error("Failed to generate valid response from AI");
}
