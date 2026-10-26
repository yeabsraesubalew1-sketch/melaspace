import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import Comment from "@/models/Comment";
import { canActorPinComment } from "@/lib/comment-permissions";
import { Types } from "mongoose";

interface Params {
  slug: string;
  id: string;
}

// PATCH /api/blogs/[slug]/comments/[id]/pin
// Pins or unpins a top-level comment (Admins only)
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const actor = {
      id: auth.session.user.id,
      role: auth.session.user.role,
      email: auth.session.user.email,
    };

    if (!canActorPinComment(actor)) {
      return NextResponse.json(
        { success: false, error: "Only Super Admins and Root Admins can pin comments." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid comment identifier" }, { status: 400 });
    }

    await connectDB();

    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    if (comment.parentId) {
      return NextResponse.json(
        { success: false, error: "Only top-level comments can be pinned." },
        { status: 400 }
      );
    }

    if (comment.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Deleted comments cannot be pinned." },
        { status: 400 }
      );
    }

    const willBePinned = !comment.isPinned;

    if (willBePinned) {
      // Unpin any previously pinned comments on this blog
      await Comment.updateMany(
        { blogId: comment.blogId, isPinned: true },
        { $set: { isPinned: false, pinnedAt: null, pinnedBy: null } }
      );

      comment.isPinned = true;
      comment.pinnedAt = new Date();
      comment.pinnedBy = new Types.ObjectId(actor.id);
    } else {
      comment.isPinned = false;
      comment.pinnedAt = undefined;
      comment.pinnedBy = undefined;
    }

    await comment.save();

    return NextResponse.json({
      success: true,
      data: {
        isPinned: comment.isPinned,
        message: comment.isPinned ? "Comment pinned to top" : "Comment unpinned",
      },
    });
  } catch (error) {
    console.error("PATCH /api/blogs/[slug]/comments/[id]/pin error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
