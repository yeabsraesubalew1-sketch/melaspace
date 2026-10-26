import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import Comment from "@/models/Comment";
import User, { type UserRole } from "@/models/User";
import {
  canActorDeleteComment,
  canActorPinComment,
  canActorCommentAsMelaTeam,
} from "@/lib/comment-permissions";
import { Types } from "mongoose";

interface Params {
  slug: string;
}

// GET /api/blogs/[slug]/comments
// Fetch paginated comments for a blog (top-level or replies)
export async function GET(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing blog identifier" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const sort = searchParams.get("sort") === "top" ? "top" : "newest";
    const parentId = searchParams.get("parentId");

    await connectDB();

    const query = Types.ObjectId.isValid(slug)
      ? { $or: [{ _id: slug }, { slug }], status: "published" }
      : { slug, status: "published" };

    const blog = await Blog.findOne(query).select("_id author");
    if (!blog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const currentUserRole = session?.user?.role as UserRole | undefined;
    const currentUserEmail = session?.user?.email;

    const actor =
      currentUserId && currentUserRole && currentUserEmail
        ? { id: currentUserId, role: currentUserRole, email: currentUserEmail }
        : null;

    let filter: Record<string, unknown> = { blogId: blog._id };

    if (parentId && Types.ObjectId.isValid(parentId)) {
      filter.parentId = new Types.ObjectId(parentId);
    } else {
      filter.parentId = null;
      filter.$or = [
        { isDeleted: false },
        { isDeleted: true, replyCount: { $gt: 0 } },
      ];
    }

    // Determine sort
    let sortCriteria: Record<string, 1 | -1>;
    if (filter.parentId) {
      // Replies are always chronological
      sortCriteria = { createdAt: 1 };
    } else if (sort === "top") {
      sortCriteria = { isPinned: -1, likesCount: -1, createdAt: -1 };
    } else {
      sortCriteria = { isPinned: -1, createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [rawComments, total] = await Promise.all([
      Comment.find(filter)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar role")
        .lean(),
      Comment.countDocuments(filter),
    ]);

    const formattedComments = rawComments.map((c) => {
      const isMelaTeam = Boolean(c.displayAsMelaTeam);
      const isAuthorBlogOwner =
        blog.author && c.author?._id
          ? blog.author.toString() === c.author._id.toString()
          : false;

      let authorInfo: {
        id?: string;
        name: string;
        avatar?: string;
        role?: string;
        isMelaTeam?: boolean;
        isBlogAuthor?: boolean;
      };

      if (c.isDeleted) {
        authorInfo = {
          name: "[Removed]",
          avatar: undefined,
          isMelaTeam: false,
        };
      } else if (isMelaTeam) {
        authorInfo = {
          name: "Mela Team",
          avatar: undefined, // Will be represented by Mela Team brand icon
          role: "team",
          isMelaTeam: true,
        };
      } else {
        const authorObj = c.author as { _id?: Types.ObjectId; name?: string; avatar?: string; role?: string } | null;
        authorInfo = {
          id: authorObj?._id?.toString(),
          name: authorObj?.name || "Explorer",
          avatar: authorObj?.avatar,
          role: authorObj?.role || c.authorRoleAtCreation || "user",
          isBlogAuthor: isAuthorBlogOwner,
        };
      }

      let contentText = c.content;
      if (c.isDeleted) {
        contentText =
          c.deletedReason === "by_moderation"
            ? "This comment was removed by moderation."
            : "This comment was deleted by the author.";
      }

      const hasLiked =
        currentUserId && Array.isArray(c.likes)
          ? c.likes.some((uid: Types.ObjectId) => uid.toString() === currentUserId)
          : false;

      const canDelete =
        actor && !c.isDeleted
          ? canActorDeleteComment(actor, {
              _id: c._id.toString(),
              authorId: (c.author as { _id?: Types.ObjectId })?._id?.toString() || "",
              authorRoleAtCreation: c.authorRoleAtCreation,
              displayAsMelaTeam: c.displayAsMelaTeam,
              isDeleted: c.isDeleted,
            }).allowed
          : false;

      const canPin =
        actor && !c.isDeleted && !c.parentId ? canActorPinComment(actor) : false;

      return {
        id: c._id.toString(),
        blogId: blog._id.toString(),
        author: authorInfo,
        content: contentText,
        parentId: c.parentId ? c.parentId.toString() : null,
        replyTo: c.replyTo || null,
        likesCount: c.likesCount || 0,
        replyCount: c.replyCount || 0,
        hasLiked,
        canDelete,
        canPin,
        isPinned: Boolean(c.isPinned),
        isDeleted: Boolean(c.isDeleted),
        createdAt: c.createdAt,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/blogs/[slug]/comments error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/blogs/[slug]/comments
// Create a new top-level comment or reply
export async function POST(
  req: Request,
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

    const body = await req.json();
    const rawContent = (body.content || "").trim();
    const parentId = body.parentId?.trim();
    const replyToUserName = body.replyToUserName?.trim();
    const asMelaTeamRequested = Boolean(body.asMelaTeam);

    if (!rawContent || rawContent.length < 2) {
      return NextResponse.json(
        { success: false, error: "Comment must be at least 2 characters long." },
        { status: 400 }
      );
    }

    if (rawContent.length > 1500) {
      return NextResponse.json(
        { success: false, error: "Comment cannot exceed 1,500 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const query = Types.ObjectId.isValid(slug)
      ? { $or: [{ _id: slug }, { slug }], status: "published" }
      : { slug, status: "published" };

    const blog = await Blog.findOne(query).select("_id author");
    if (!blog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    const userId = auth.session.user.id;
    const userRole = auth.session.user.role;
    const userEmail = auth.session.user.email;

    const actor = { id: userId, role: userRole, email: userEmail };

    // Validate Mela Team permissions
    if (asMelaTeamRequested && !canActorCommentAsMelaTeam(actor)) {
      return NextResponse.json(
        { success: false, error: "Only Super Admins and Root Admins can comment as Mela Team." },
        { status: 403 }
      );
    }

    const isDisplayAsMelaTeam = asMelaTeamRequested && canActorCommentAsMelaTeam(actor);

    // Rate Limiting: 10-second cooldown for non-admins
    if (userRole === "user") {
      const tenSecondsAgo = new Date(Date.now() - 10_000);
      const recentComment = await Comment.findOne({
        author: userId,
        createdAt: { $gte: tenSecondsAgo },
      }).select("_id");

      if (recentComment) {
        return NextResponse.json(
          { success: false, error: "Please wait a moment before posting another comment." },
          { status: 429 }
        );
      }
    }

    // Duplicate Check: Disallow posting identical text within 5 minutes on the same post
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000);
    const duplicate = await Comment.findOne({
      blogId: blog._id,
      author: userId,
      content: rawContent,
      createdAt: { $gte: fiveMinutesAgo },
    }).select("_id");

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "You already posted this exact comment recently." },
        { status: 400 }
      );
    }

    let effectiveParentId: Types.ObjectId | null = null;
    let replyToData: { userId?: Types.ObjectId; name?: string } | undefined = undefined;

    // Handle replies & 1-level thread flattening
    if (parentId && Types.ObjectId.isValid(parentId)) {
      const targetParent = await Comment.findOne({
        _id: parentId,
        blogId: blog._id,
      });

      if (!targetParent || targetParent.isDeleted) {
        return NextResponse.json(
          { success: false, error: "The comment you are replying to no longer exists or was removed." },
          { status: 404 }
        );
      }

      // If the comment being replied to is already a reply, flatten to the root parent
      if (targetParent.parentId) {
        effectiveParentId = targetParent.parentId as Types.ObjectId;
      } else {
        effectiveParentId = targetParent._id as Types.ObjectId;
      }

      replyToData = {
        userId: targetParent.author as Types.ObjectId,
        name: targetParent.displayAsMelaTeam
          ? "Mela Team"
          : replyToUserName || "User",
      };

      // Increment replyCount on the top-level parent comment
      await Comment.updateOne(
        { _id: effectiveParentId },
        { $inc: { replyCount: 1 } }
      );
    }

    const created = await Comment.create({
      blogId: blog._id,
      author: userId,
      authorRoleAtCreation: userRole,
      displayAsMelaTeam: isDisplayAsMelaTeam,
      content: rawContent,
      parentId: effectiveParentId,
      replyTo: replyToData,
      likes: [],
      likesCount: 0,
      replyCount: 0,
      isDeleted: false,
    });

    // Increment overall blog comments count
    await Blog.updateOne({ _id: blog._id }, { $inc: { commentsCount: 1 } });

    // Populate user info for immediate response
    const populated = await Comment.findById(created._id)
      .populate("author", "name avatar role")
      .lean();

    if (!populated) {
      return NextResponse.json({ success: false, error: "Failed to load comment" }, { status: 500 });
    }

    const isAuthorBlogOwner =
      blog.author && populated.author?._id
        ? blog.author.toString() === populated.author._id.toString()
        : false;

    let authorInfo;
    if (isDisplayAsMelaTeam) {
      authorInfo = {
        name: "Mela Team",
        avatar: undefined,
        role: "team",
        isMelaTeam: true,
      };
    } else {
      const authorObj = populated.author as { _id?: Types.ObjectId; name?: string; avatar?: string; role?: string } | null;
      authorInfo = {
        id: authorObj?._id?.toString(),
        name: authorObj?.name || "Explorer",
        avatar: authorObj?.avatar,
        role: authorObj?.role || userRole,
        isBlogAuthor: isAuthorBlogOwner,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        comment: {
          id: populated._id.toString(),
          blogId: blog._id.toString(),
          author: authorInfo,
          content: populated.content,
          parentId: populated.parentId ? populated.parentId.toString() : null,
          replyTo: populated.replyTo || null,
          likesCount: 0,
          replyCount: 0,
          hasLiked: false,
          canDelete: true,
          canPin: !populated.parentId && canActorPinComment(actor),
          isPinned: false,
          isDeleted: false,
          createdAt: populated.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("POST /api/blogs/[slug]/comments error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
