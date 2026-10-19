import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import Bookmark from "@/models/Bookmark";
import { Blog } from "@/models/Blog";
import { Types } from "mongoose";

interface Params {
  slug: string;
}

// POST /api/blogs/[slug]/bookmark
// Toggles bookmark status for the current authenticated user using slug or ID
export async function POST(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing blog identifier" }, { status: 400 });
    }

    await connectDB();

    const query = Types.ObjectId.isValid(slug)
      ? { $or: [{ _id: slug }, { slug }], status: "published" }
      : { slug, status: "published" };

    const blog = await Blog.findOne(query).select("_id");
    if (!blog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    const userId = auth.session.user.id;
    const blogId = blog._id;

    const existingBookmark = await Bookmark.findOne({ userId, blogId });

    if (existingBookmark) {
      await Bookmark.deleteOne({ _id: existingBookmark._id });
      return NextResponse.json({
        success: true,
        data: { isBookmarked: false, message: "Removed from saved blogs" },
      });
    }

    await Bookmark.create({ userId, blogId });
    return NextResponse.json({
      success: true,
      data: { isBookmarked: true, message: "Added to saved blogs" },
    });
  } catch (error) {
    console.error("POST /api/blogs/[slug]/bookmark error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
