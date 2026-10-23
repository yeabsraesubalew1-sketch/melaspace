import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  MELA_TONE_SYSTEM_INSTRUCTION,
  generateGeminiJson,
  sanitizeAiError,
} from "@/lib/gemini";
import { Type, type Schema } from "@google/genai";
import type { ApiResponse } from "@/types/api";

const ideasSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ideas: {
      type: Type.ARRAY,
      description: "4 compelling, fresh, and grounded coaching themes or article angles for Mela Space.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["ideas"],
};

export async function GET(req: Request) {
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
        { success: false, data: null, error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const context = searchParams.get("topic")?.trim() || "";

    const prompt = context
      ? `Provide 4 fresh, thought-provoking coaching article angles exploring "${context}". Each should be a compelling single sentence proposing practical reflections or somatic insights.`
      : `Provide 4 diverse, timely coaching themes for Mela Space exploring emotional wellness, burnout recovery, nervous system regulation, or self-compassion. Each should be a compelling single sentence proposing practical reflections or somatic insights.`;

    const parsed = await generateGeminiJson<{ ideas: string[] }>({
      prompt,
      systemInstruction: MELA_TONE_SYSTEM_INSTRUCTION,
      schema: ideasSchema,
      temperature: 0.8,
      maxOutputTokens: 1000,
    });

    const ideas: string[] = Array.isArray(parsed?.ideas) ? parsed.ideas.slice(0, 4) : [];

    return NextResponse.json<ApiResponse<string[]>>({
      success: true,
      data: ideas,
    });
  } catch (err) {
    console.error("GET /api/admin/blogs/ai-cowriter/ideas error:", err);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: sanitizeAiError(err),
      },
      { status: 500 }
    );
  }
}
