import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";

interface Params {
  slug: string;
}

// POST /api/blogs/[slug]/view
// Atomically increments view counter for a published blog
export async function POST(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });
    }

    await connectDB();

    const result = await Blog.updateOne(
      { slug, status: "published" },
      { $inc: { views: 1 } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/blogs/[slug]/view error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
