import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import Comment from "@/models/Comment";
import { Blog } from "@/models/Blog";
import { canActorDeleteComment } from "@/lib/comment-permissions";
import { Types } from "mongoose";

interface Params {
  slug: string;
  id: string;
}

// DELETE /api/blogs/[slug]/comments/[id]
// Deletes or moderates/takes down a comment according to role hierarchy
export async function DELETE(
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

    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    const actor = {
      id: auth.session.user.id,
      role: auth.session.user.role,
      email: auth.session.user.email,
    };

    const targetMeta = {
      _id: comment._id.toString(),
      authorId: comment.author.toString(),
      authorRoleAtCreation: comment.authorRoleAtCreation,
      displayAsMelaTeam: comment.displayAsMelaTeam,
      isDeleted: comment.isDeleted,
    };

    const permission = canActorDeleteComment(actor, targetMeta);
    if (!permission.allowed) {
      return NextResponse.json(
        { success: false, error: permission.reason || "Forbidden" },
        { status: 403 }
      );
    }

    const isAuthor = actor.id === comment.author.toString();
    const isTopLevel = !comment.parentId;
    const hasReplies = (comment.replyCount || 0) > 0;

    if (isTopLevel && hasReplies) {
      // Tombstone: Soft delete to preserve conversation tree
      comment.isDeleted = true;
      comment.deletedBy = new Types.ObjectId(actor.id);
      comment.deletedByRole = actor.role;
      comment.deletedReason = isAuthor ? "by_author" : "by_moderation";
      comment.content = "[removed]";
      comment.isPinned = false;
      await comment.save();

      // Decrement visible comments count on the blog
      await Blog.updateOne({ _id: comment.blogId }, { $inc: { commentsCount: -1 } });

      return NextResponse.json({
        success: true,
        data: {
          isSoftDeleted: true,
          message: isAuthor ? "Comment deleted" : "Comment taken down by moderator",
        },
      });
    }

    // No replies or is a child reply: Remove cleanly
    await Comment.deleteOne({ _id: comment._id });

    if (comment.parentId) {
      // Decrement replyCount on parent comment
      await Comment.updateOne(
        { _id: comment.parentId },
        { $inc: { replyCount: -1 } }
      );
    }

    // Decrement total count on blog
    await Blog.updateOne({ _id: comment.blogId }, { $inc: { commentsCount: -1 } });

    return NextResponse.json({
      success: true,
      data: {
        isSoftDeleted: false,
        message: isAuthor ? "Comment deleted" : "Comment taken down by moderator",
      },
    });
  } catch (error) {
    console.error("DELETE /api/blogs/[slug]/comments/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
