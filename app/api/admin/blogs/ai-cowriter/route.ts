import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { Resource } from "@/models/Resource";
import {
  MELA_TONE_SYSTEM_INSTRUCTION,
  coWriterSchema,
  formatResourceMentionTag,
  createSafeEditorContent,
  sectionsToEditorBlocks,
  sanitizeAiError,
  generateGeminiJson,
} from "@/lib/gemini";
import type { ApiResponse } from "@/types/api";
import type { EditorContent } from "@/types/editor";

export type CoachingTone =
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

interface CoWriterRequestBody {
  topic: string;
  tone?: CoachingTone;
  targetLength?: "short" | "standard" | "deep";
  language?: "en" | "am";
  existingTitle?: string;
  existingContent?: EditorContent;
}

function editorContentToText(content?: EditorContent): string {
  if (!content?.blocks || !Array.isArray(content.blocks)) return "";
  return content.blocks
    .map((b) => {
      const data = (b.data || {}) as Record<string, unknown>;
      if (b.type === "header") return `## ${typeof data.text === "string" ? data.text : ""}`;
      if (b.type === "paragraph") return typeof data.text === "string" ? data.text : "";
      if (b.type === "quote") {
        const text = typeof data.text === "string" ? data.text : "";
        const caption = typeof data.caption === "string" ? `\n— ${data.caption}` : "";
        return `> ${text}${caption}`;
      }
      if (b.type === "list") {
        const items = Array.isArray(data.items) ? data.items : [];
        return items
          .map((it: unknown) => `- ${typeof it === "string" ? it : (it as { content?: string })?.content || ""}`)
          .join("\n");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

interface RawCoWriterOutput {
  title: string;
  excerpt: string;
  categorySuggestions: string[];
  matchedCategoryIds?: string[];
  matchedResourceIds?: string[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
    takeaways?: string[];
    quote?: string;
    quoteCaption?: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = ["root_admin", "super_admin", "manager"].includes(
      session?.user?.role || ""
    );

    if (!session || !isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "GEMINI_API_KEY is not configured on the server. Please check your environment variables.",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as CoWriterRequestBody;
    const {
      topic,
      tone = "grounded",
      targetLength = "standard",
      existingTitle,
      existingContent,
      language = "en",
    } = body;

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "Please provide a topic, notes, or editing instructions.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch existing categories from MongoDB so Gemini can match them
    const categories = await Category.find()
      .select("_id name slug")
      .lean();

    const categoryListContext = categories
      .map((c) => `- ID: "${c._id.toString()}", Name: "${c.name}", Slug: "${c.slug}"`)
      .join("\n");

    // Fetch published resources from MongoDB so Gemini can match & cite them inline
    const publishedResources = await Resource.find({ status: "published" })
      .select("_id slug title category excerpt files")
      .limit(20)
      .lean();

    const resourceContext = publishedResources
      .map((r) => {
        const filesCount = r.files?.length || 1;
        const totalSize =
          r.files?.reduce((acc: number, f: { sizeBytes?: number }) => acc + (f.sizeBytes || 0), 0) || 0;
        const tag = formatResourceMentionTag({
          id: r._id.toString(),
          slug: r.slug,
          title: r.title,
          category: r.category,
          filesCount,
          sizeBytes: totalSize,
          excerpt: r.excerpt,
        });

        return `• Resource ID: "${r._id.toString()}", Title: "${r.title}", Category: "${r.category}", Excerpt: "${r.excerpt || ""}"
  Inline Mention HTML Tag: ${tag}`;
      })
      .join("\n\n");

    const lengthInstructions =
      targetLength === "short"
        ? "Target Length: Concise coaching read (approx. 500-750 words, 5-8 rich blocks)."
        : targetLength === "deep"
          ? "Target Length: In-depth holistic guide (approx. 1400-1800 words, 12-16 rich blocks including headers, inquiries, quotes, and somatic exercises)."
          : "Target Length: Standard editorial guide (approx. 900-1200 words, 8-12 rich blocks with balanced theory and micro-practices).";

    const TONE_INSTRUCTIONS: Record<string, string> = {
      somatic:
        "Tone Focus: Somatic, breath-oriented, and nervous-system regulating. Invite bodily check-ins, sensory anchors, vagus nerve cues, and physical awareness.",
      actionable:
        "Tone Focus: Action-oriented coaching. Provide clear, supportive micro-habits, boundary frameworks, scripts, and everyday practices.",
      compassionate:
        "Tone Focus: Deeply compassionate, validating, and tender. Emphasize self-forgiveness, holding space for burnout, grief, and emotional rest without shame.",
      reflective:
        "Tone Focus: Reflective inquiry and deep journaling. Center around thought-provoking coaching inquiries, open questions, and inner contemplation.",
      poetic:
        "Tone Focus: Poetic, soulful, and evocative. Use spacious imagery, natural metaphors, and lyrical resonance that touches the heart.",
      leadership:
        "Tone Focus: Mindful leadership and emotional intelligence. High-capacity discernment, calm executive presence, grounded authority, and healthy boundaries.",
      playful:
        "Tone Focus: Playful, lighthearted, and expansive. Gentle humor, creative curiosity, inviting lightness and ease into heavy topics.",
      direct:
        "Tone Focus: Direct, candid, and discerning coaching. Honest, loving accountability that cuts through rationalization with clarity and human warmth.",
      philosophical:
        "Tone Focus: Philosophical and contemplative wisdom. Stoic reflections, existential depth, and broad philosophical perspectives on life transitions.",
      grounded:
        "Tone Focus: Grounded, authentic, and empathetic coaching. Thought-provoking yet warm, practical, and deeply human.",
    };

    const toneInstructions = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.grounded;

    const languageInstructions =
      language === "am"
        ? `
CRITICAL LANGUAGE DIRECTIVE: WRITE IN FLUENT, AUTHENTIC AMHARIC (አማርኛ)
- You MUST generate the ENTIRE article in natural, emotionally resonant Amharic (አማርኛ) using proper Ge'ez Fidel script.
- "title": Captivating, warm Amharic blog post title (e.g. የስሜት ጤንነት እና ውስጣዊ ሰላም).
- "excerpt": Engaging Amharic SEO meta description (approx. 120-180 characters).
- "categorySuggestions": 1 to 3 relevant category names in Amharic (e.g. "የስሜት ጤንነት", "የውስጥ ሰላም", "እረፍት").
- "sections": Write all "heading", "paragraphs", "takeaways", and "quote" in rich, compassionate Amharic.
- Reflect Ethiopian cultural warmth, communal understanding, and tender somatic self-care.
- All JSON schema property keys must remain in English as defined in the schema.
`.trim()
        : "Language Directive: Write in English following Mela Space editorial voice.";

    const existingArticleText = editorContentToText(existingContent);
    const isEditingExisting = Boolean(existingArticleText.trim());

    const prompt = isEditingExisting
      ? `
You are the expert editorial co-writer for Mela Space, a mindful coaching and emotional wellness platform.

EDITORIAL DIRECTIVE: EDIT & REFINE EXISTING ARTICLE
You are given an existing article from the editor and specific admin instructions on what to revise, improve, expand, translate, or adjust.
- Carefully review the existing article content below.
- Apply the admin's edit instructions precisely (e.g., adding somatic practices, adjusting tone, translating/adapting language, tightening prose, or expanding takeaways).
- Maintain or enhance the depth, structure, and emotional resonance of the piece.
- You can keep or refine the "title" and "excerpt" so they fit the updated article perfectly.

EXISTING ARTICLE CONTENT:
"""
${existingArticleText}
"""
${existingTitle ? `Current Title: "${existingTitle}"` : ""}

ADMIN EDIT & REVISION INSTRUCTIONS:
"""
${topic.trim()}
"""

${languageInstructions}
${toneInstructions}
${lengthInstructions}

Available Mela Space Categories in MongoDB:
${categoryListContext || "No categories created yet."}

Available Mela Space Published Downloadable Resources in MongoDB:
${resourceContext || "No published resources available."}

Requirements for the generated JSON:
1. "title": The refined, captivating blog post title.
2. "excerpt": An engaging SEO meta description between 120 and 160 characters.
3. "matchedCategoryIds": An array of existing Category IDs from the list above that best match this topic.
4. "categorySuggestions": An array of 1-3 category names.
5. "matchedResourceIds": An array of Resource IDs from the list above that genuinely add value to this article.
6. "sections": 3 to 6 structured sections making up the complete revised post.
   - "heading": Section header (Level 2).
   - "paragraphs": 1 to 3 rich, empathetic coaching paragraphs for this section. If a published resource directly fits the text, embed its exact "Inline Mention HTML Tag" provided above within the paragraph text so our reader hovercard activates seamlessly!
   - "takeaways": Optional array of 2-4 bullet reflection prompts or micro-habits.
   - "quote": Optional memorable coaching reflection or quote for this section, with "quoteCaption".
`.trim()
      : `
You are the expert co-writer for Mela Space, a mindful coaching and emotional wellness platform.

Draft a complete, publication-ready article based on the following admin guidance:

Admin Topic / Outline / Notes:
"""
${topic.trim()}
"""
${existingTitle ? `Working Title (if relevant): "${existingTitle}"` : ""}

${languageInstructions}
${toneInstructions}
${lengthInstructions}

Available Mela Space Categories in MongoDB:
${categoryListContext || "No categories created yet."}

Available Mela Space Published Downloadable Resources in MongoDB:
${resourceContext || "No published resources available."}

Requirements for the generated JSON:
1. "title": A warm, captivating, human-centered blog post title.
2. "excerpt": An engaging SEO meta description between 120 and 160 characters.
3. "matchedCategoryIds": An array of existing Category IDs from the list above that best match this topic.
4. "categorySuggestions": An array of 1-3 category names.
5. "matchedResourceIds": An array of Resource IDs from the list above that genuinely add value to this article.
6. "sections": 3 to 5 structured sections making up the complete post.
   - "heading": Section header (Level 2).
   - "paragraphs": 1 to 3 rich, empathetic coaching paragraphs for this section. If a published resource directly fits the text, embed its exact "Inline Mention HTML Tag" provided above within the paragraph text so our reader hovercard activates seamlessly!
   - "takeaways": Optional array of 2-4 bullet reflection prompts or micro-habits.
   - "quote": Optional memorable coaching reflection or quote for this section, with "quoteCaption".
`.trim();

    const coWriterResult = await generateGeminiJson<RawCoWriterOutput>({
      prompt,
      systemInstruction: MELA_TONE_SYSTEM_INSTRUCTION,
      schema: coWriterSchema,
      temperature: 0.6,
      maxOutputTokens: language === "am" ? 6000 : 4096,
    });

    // Two-way category matching: resolve suggested category names to existing MongoDB IDs
    const categoryMapByName = new Map<string, string>();
    const categoryMapBySlug = new Map<string, string>();
    for (const c of categories) {
      categoryMapByName.set(c.name.toLowerCase().trim(), c._id.toString());
      categoryMapBySlug.set(c.slug.toLowerCase().trim(), c._id.toString());
    }

    const matchedIdsSet = new Set<string>();

    for (const id of coWriterResult.matchedCategoryIds || []) {
      if (typeof id === "string" && categories.some((c) => c._id.toString() === id)) {
        matchedIdsSet.add(id);
      }
    }

    for (const name of coWriterResult.categorySuggestions || []) {
      const clean = name.trim().toLowerCase();
      const existingId = categoryMapByName.get(clean) || categoryMapBySlug.get(clean);
      if (existingId) {
        matchedIdsSet.add(existingId);
      }
    }

    // Convert structured sections into valid Editor.js blocks
    const editorBlocks = sectionsToEditorBlocks(coWriterResult.sections || []);
    const safeContent: EditorContent = createSafeEditorContent(editorBlocks);

    return NextResponse.json<
      ApiResponse<{
        title: string;
        excerpt: string;
        categorySuggestions: string[];
        matchedCategoryIds: string[];
        matchedResourceIds: string[];
        content: EditorContent;
      }>
    >({
      success: true,
      data: {
        title: coWriterResult.title?.trim() || "Untitled Reflection",
        excerpt: coWriterResult.excerpt?.trim() || "",
        categorySuggestions: coWriterResult.categorySuggestions || [],
        matchedCategoryIds: Array.from(matchedIdsSet),
        matchedResourceIds: coWriterResult.matchedResourceIds || [],
        content: safeContent,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/blogs/ai-cowriter error:", error);
    const friendlyError = sanitizeAiError(error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: friendlyError,
      },
      { status: 500 }
    );
  }
}
