import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import Bookmark from "@/models/Bookmark";
import { Blog } from "@/models/Blog";
import "@/models/Category";

// GET /api/user/bookmarks
// Returns all blogs saved by the current user
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    await connectDB();

    const bookmarks = await Bookmark.find({ userId: auth.session.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "blogId",
        model: Blog,
        select: "title slug excerpt publishedAt categories status authorName",
        populate: {
          path: "categories",
          select: "name slug",
        },
      })
      .lean();

    // Filter out any blogs that may have been deleted or unpublished
    interface PopulatedBookmark {
      _id: { toString(): string };
      blogId: {
        _id: { toString(): string };
        title: string;
        slug: string;
        excerpt: string;
        publishedAt?: Date;
        categories: { _id: string; name: string; slug: string }[];
        status: string;
        authorName?: string;
      } | null;
      createdAt: Date;
    }

    const validBookmarks = (bookmarks as unknown as PopulatedBookmark[])
      .filter((b) => b.blogId && b.blogId.status === "published")
      .map((b) => ({
        bookmarkId: b._id.toString(),
        savedAt: b.createdAt.toISOString(),
        blog: {
          id: b.blogId!._id.toString(),
          title: b.blogId!.title,
          slug: b.blogId!.slug,
          excerpt: b.blogId!.excerpt,
          publishedAt: b.blogId!.publishedAt?.toISOString(),
          categories: b.blogId!.categories ?? [],
          authorName: b.blogId!.authorName || "Mela Team",
        },
      }));

    return NextResponse.json({
      success: true,
      data: {
        total: validBookmarks.length,
        bookmarks: validBookmarks,
      },
    });
  } catch (error) {
    console.error("GET /api/user/bookmarks error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
