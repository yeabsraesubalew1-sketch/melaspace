import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import Proposal from "@/models/Proposal";
import { Blog } from "@/models/Blog";
import { Types } from "mongoose";
import { syncEntityAssets } from "@/lib/filevault-cleanup";

const MAX_PENDING_PROPOSALS = 3;

// GET /api/proposals
// Returns caller's proposals, or all proposals if admin
export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const isAdmin = ["root_admin", "super_admin", "manager"].includes(auth.session.user.role);
    const viewAll = searchParams.get("all") === "true" && isAdmin;

    const userObjectId = Types.ObjectId.isValid(auth.session.user.id)
      ? new Types.ObjectId(auth.session.user.id)
      : auth.session.user.id;

    const filter: Record<string, unknown> = viewAll ? {} : { userId: userObjectId };

    const proposals = await Proposal.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .populate("reviewedBy", "name email role")
      .populate("targetBlogId", "title slug")
      .lean();

    return NextResponse.json({
      success: true,
      data: proposals,
    });
  } catch (error) {
    console.error("GET /api/proposals error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/proposals
// Submits a new post proposal or revision proposal with pending quota limit check
export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    if (!Types.ObjectId.isValid(auth.session.user.id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user account session. Please re-login." },
        { status: 401 }
      );
    }

    await connectDB();

    const userObjectId = new Types.ObjectId(auth.session.user.id);
    const isAdmin = ["root_admin", "super_admin", "manager"].includes(auth.session.user.role);

    // Check quota: only non-admins are subject to the pending limit
    if (!isAdmin) {
      const pendingCount = await Proposal.countDocuments({
        userId: userObjectId,
        status: "pending",
      });

      if (pendingCount >= MAX_PENDING_PROPOSALS) {
        return NextResponse.json(
          {
            success: false,
            error: `You have reached the limit of ${MAX_PENDING_PROPOSALS} pending proposals. Please wait until your existing proposals are reviewed, or withdraw an existing proposal in My Proposals.`,
          },
          { status: 400 }
        );
      }
    }

    const body = await req.json();
    const {
      title,
      excerpt,
      content,
      suggestedCategories = [],
      isAnonymous = false,
      type = "new",
      targetBlogId,
      featuredImage,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const hasValidContent =
      Boolean(content) &&
      ((typeof content === "string" && content.trim().length > 0) ||
        (typeof content === "object" &&
          Array.isArray(content.blocks) &&
          content.blocks.length > 0));

    if (!hasValidContent) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    const blocks: Array<{ type?: string; [key: string]: unknown }> =
      typeof content === "object" &&
      content !== null &&
      "blocks" in content &&
      Array.isArray((content as { blocks?: unknown[] }).blocks)
        ? ((content as { blocks: unknown[] }).blocks as Array<{ type?: string; [key: string]: unknown }>)
        : [];

    if (!isAdmin) {
      const imageCount = blocks.filter((b) => b?.type === "image").length;
      const fileCount = blocks.filter((b) => b?.type === "file" || b?.type === "attaches").length;
      if (imageCount > 3 || fileCount > 3) {
        return NextResponse.json(
          {
            success: false,
            error: "Explorers can upload a maximum of 3 images and 3 files per proposal.",
            code: "EXPLORER_CAP_EXCEEDED",
          },
          { status: 400 }
        );
      }
    }

    const cleanedCategories = Array.isArray(suggestedCategories)
      ? suggestedCategories
          .map((c) => (typeof c === "string" ? c.trim() : ""))
          .filter((c) => c.length > 0)
          .slice(0, 5)
      : [];

    let resolvedTargetBlogId: Types.ObjectId | undefined;
    let resolvedBlogSlug: string | undefined;

    if (type === "revision" && targetBlogId && Types.ObjectId.isValid(targetBlogId)) {
      const targetBlog = await Blog.findById(targetBlogId).select("_id slug author");
      if (targetBlog) {
        const isAuthor = targetBlog.author && targetBlog.author.toString() === auth.session.user.id;
        if (!isAdmin && !isAuthor) {
          return NextResponse.json(
            { success: false, error: "You can only propose changes to your own published posts." },
            { status: 403 }
          );
        }
        resolvedTargetBlogId = targetBlog._id;
        resolvedBlogSlug = targetBlog.slug;
      }
    }

    const proposal = await Proposal.create({
      userId: userObjectId,
      title: title.trim(),
      excerpt: typeof excerpt === "string" ? excerpt.trim() : undefined,
      content: typeof content === "string" ? content.trim() : content,
      suggestedCategories: cleanedCategories,
      status: "pending",
      type: type === "revision" && resolvedTargetBlogId ? "revision" : "new",
      featuredImage:
        featuredImage && typeof featuredImage === "object" && featuredImage.url
          ? {
              url: String(featuredImage.url).trim(),
              alt: featuredImage.alt ? String(featuredImage.alt).trim() : undefined,
              caption: featuredImage.caption ? String(featuredImage.caption).trim() : undefined,
              fileVaultId: featuredImage.fileVaultId ? Number(featuredImage.fileVaultId) : undefined,
              storageKey: featuredImage.storageKey ? String(featuredImage.storageKey).trim() : undefined,
            }
          : undefined,
      targetBlogId: resolvedTargetBlogId,
      blogId: resolvedTargetBlogId,
      blogSlug: resolvedBlogSlug,
      isAnonymous: Boolean(isAnonymous),
    });

    const extraAssetIds = proposal.featuredImage?.fileVaultId ? [proposal.featuredImage.fileVaultId] : [];
    await syncEntityAssets("proposal", proposal._id, blocks, auth.session.user.role, extraAssetIds);

    return NextResponse.json(
      {
        success: true,
        data: proposal,
        message:
          type === "revision"
            ? "Your proposed changes have been submitted for editor review!"
            : "Your post proposal has been submitted for admin review!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/proposals error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
