import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import Comment from "@/models/Comment";
import { Types } from "mongoose";

interface Params {
  slug: string;
  id: string;
}

// POST /api/blogs/[slug]/comments/[id]/like
// Toggles like status for the signed-in user atomically without locking
export async function POST(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid comment identifier" }, { status: 400 });
    }

    await connectDB();

    const userId = new Types.ObjectId(auth.session.user.id);

    // 1. Try to unlike atomically (matches only if user has already liked)
    const unliked = await Comment.findOneAndUpdate(
      { _id: id, likes: userId },
      {
        $pull: { likes: userId },
        $inc: { likesCount: -1 },
      },
      { new: true }
    );

    if (unliked) {
      return NextResponse.json({
        success: true,
        data: {
          hasLiked: false,
          likesCount: Math.max(0, unliked.likesCount),
        },
      });
    }

    // 2. Otherwise, add like atomically (matches only if user has NOT liked)
    const liked = await Comment.findOneAndUpdate(
      { _id: id, likes: { $ne: userId } },
      {
        $addToSet: { likes: userId },
        $inc: { likesCount: 1 },
      },
      { new: true }
    );

    if (!liked) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasLiked: true,
        likesCount: liked.likesCount,
      },
    });
  } catch (error) {
    console.error("POST /api/blogs/[slug]/comments/[id]/like error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
