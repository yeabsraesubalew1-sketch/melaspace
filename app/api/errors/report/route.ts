import { NextResponse } from "next/server";
import { reportAppError } from "@/lib/error-reporting";

interface ErrorReportBody {
  path?: string;
  message?: string;
  stack?: string;
  digest?: string;
  source?: "public" | "admin" | "global" | "api";
  context?: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ErrorReportBody;

    if (!body?.message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    await reportAppError({
      path: body.path ?? "unknown",
      message: body.message,
      stack: body.stack,
      digest: body.digest,
      source: body.source,
      context: body.context,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
