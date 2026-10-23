import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Resource } from "@/models/Resource";
import {
  MELA_TONE_SYSTEM_INSTRUCTION,
  blogSummarySchema,
  editorJsToPlainText,
  formatResourceMentionTag,
  createSafeEditorContent,
  sanitizeAiError,
  generateGeminiJson,
} from "@/lib/gemini";
import type { ApiResponse } from "@/types/api";
import type { EditorBlock, EditorContent } from "@/types/editor";

interface Params {
  slug: string;
}

interface RawSummaryOutput {
  overview: string;
  takeaways: string[];
  quote: string;
  quoteCaption?: string;
  recommendedAction: string;
  mentionedResourceIds?: string[];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    await connectDB();

    const blog = await Blog.findOne({
      $or: [{ slug }, { slug: decodedSlug }],
      status: "published",
    })
      .select("_id title slug aiSummary linkedResourceIds")
      .lean();

    if (!blog) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Blog not found" },
        { status: 404 }
      );
    }

    if (!blog.aiSummary) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "No AI summary cached for this blog" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<EditorContent>>({
      success: true,
      data: blog.aiSummary,
    });
  } catch (error) {
    console.error("GET /api/blogs/[slug]/summary error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";

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

    await connectDB();

    const blog = await Blog.findOne({
      $or: [{ slug }, { slug: decodedSlug }],
      status: "published",
    });

    if (!blog) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Published blog not found" },
        { status: 404 }
      );
    }

    // Cache hit: Return immediately with 0 tokens if already generated and not forced
    if (blog.aiSummary && Array.isArray(blog.aiSummary.blocks) && blog.aiSummary.blocks.length > 0 && !force) {
      return NextResponse.json<ApiResponse<{ summary: EditorContent; cached: boolean }>>({
        success: true,
        data: {
          summary: blog.aiSummary,
          cached: true,
        },
      });
    }

    // If force is requested, check if user is an admin
    if (force) {
      const session = await getServerSession(authOptions);
      const isAdmin = ["root_admin", "super_admin", "manager"].includes(
        session?.user?.role || ""
      );
      if (!isAdmin) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, data: null, error: "Unauthorized to force regenerate summary" },
          { status: 403 }
        );
      }
    }

    // Extract plain text from Editor.js
    const articleText = editorJsToPlainText(blog.content);

    if (articleText.trim().length < 80) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "Article content is too short to generate an insightful summary.",
        },
        { status: 400 }
      );
    }

    // Gather available published resources to provide context for natural inline mentions
    const availableResources = await Resource.find({ status: "published" })
      .select("_id slug title category excerpt files")
      .limit(12)
      .lean();

    const resourceContext = availableResources
      .map((r) => {
        const filesCount = r.files?.length || 1;
        const totalSize = r.files?.reduce((acc: number, f: { sizeBytes?: number }) => acc + (f.sizeBytes || 0), 0) || 0;
        const sampleTag = formatResourceMentionTag({
          id: r._id.toString(),
          slug: r.slug,
          title: r.title,
          category: r.category,
          filesCount,
          sizeBytes: totalSize,
          excerpt: r.excerpt,
        });

        return `• Resource ID: "${r._id.toString()}", Title: "${r.title}", Category: "${r.category}", Excerpt: "${r.excerpt || ""}"
  Mention Tag: ${sampleTag}`;
      })
      .join("\n\n");

    const prompt = `
Please generate a compassionate, grounded executive summary for this Mela Space article titled "${blog.title}".

Article Text:
"""
${articleText.slice(0, 15000)}
"""

Available Mela Space downloadable resources that can be cited if directly relevant:
${resourceContext || "No downloadable resources currently available."}

Guidelines for the summary:
1. Provide an "overview": A gentle 2-3 sentence distillation of the post's core emotional theme and insight.
2. Provide 3 to 5 "takeaways": Bullet points detailing practical insights.
   - If an available resource directly complements a takeaway, weave in the exact Mention Tag provided above.
3. Provide a resonant "quote" from the text: A memorable, grounding reflection or coaching reminder, along with a thoughtful "quoteCaption".
4. Provide a "recommendedAction": A gentle somatic micro-practice or reflective question the reader can do in 60 seconds.
5. In "mentionedResourceIds", list any resource IDs you referenced in the takeaways.
`.trim();

    const summaryData = await generateGeminiJson<RawSummaryOutput>({
      prompt,
      systemInstruction: MELA_TONE_SYSTEM_INSTRUCTION,
      schema: blogSummarySchema,
      temperature: 0.4,
      maxOutputTokens: 2048,
    });

    // Convert into Editor.js blocks conforming to MelaSpace renderer specifications
    const blocks: EditorBlock[] = [
      {
        type: "paragraph",
        data: {
          text: summaryData.overview,
        },
      },
      {
        type: "header",
        data: {
          text: "Key Takeaways &amp; Reflections",
          level: 3,
        },
      },
      {
        type: "list",
        data: {
          style: "unordered",
          items: summaryData.takeaways.map((item) => item),
        },
      },
    ];

    if (summaryData.quote) {
      blocks.push({
        type: "quote",
        data: {
          text: summaryData.quote,
          caption: summaryData.quoteCaption || "Mela Reflection",
          alignment: "left",
        },
      });
    }

    if (summaryData.recommendedAction) {
      blocks.push({
        type: "paragraph",
        data: {
          text: `<strong>Gentle Practice:</strong> ${summaryData.recommendedAction}`,
        },
      });
    }

    const aiSummary: EditorContent = createSafeEditorContent(blocks);

    // Save cached summary onto the blog document
    blog.aiSummary = aiSummary;

    // If Gemini referenced any published resources, ensure they are in linkedResourceIds
    if (Array.isArray(summaryData.mentionedResourceIds) && summaryData.mentionedResourceIds.length > 0) {
      const existingIds = new Set((blog.linkedResourceIds || []).map((id) => id.toString()));
      let updated = false;

      for (const resId of summaryData.mentionedResourceIds) {
        if (resId && /^[a-f\d]{24}$/i.test(resId) && !existingIds.has(resId)) {
          blog.linkedResourceIds?.push(resId as unknown as (typeof blog.linkedResourceIds)[number]);
          updated = true;
        }
      }

      if (updated) {
        // Mark modified for mongoose mixed array
        blog.markModified("linkedResourceIds");
      }
    }

    blog.markModified("aiSummary");
    await blog.save();

    return NextResponse.json<ApiResponse<{ summary: EditorContent; cached: boolean }>>({
      success: true,
      data: {
        summary: aiSummary,
        cached: false,
      },
    });
  } catch (error) {
    console.error("POST /api/blogs/[slug]/summary error:", error);
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
