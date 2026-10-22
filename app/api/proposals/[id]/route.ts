import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import Proposal from "@/models/Proposal";
import { Blog } from "@/models/Blog";
import { Category } from "@/models/Category";
import User from "@/models/User";
import { generateUniqueSlug } from "@/lib/slugify";
import { generateExcerpt } from "@/lib/generateExcerpt";
import { Types } from "mongoose";
import type { EditorContent } from "@/types/editor";
import { syncEntityAssets, trashEntityAssets } from "@/lib/filevault-cleanup";

interface Params {
  id: string;
}

// GET /api/proposals/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid proposal ID" }, { status: 400 });
    }

    await connectDB();
    const proposal = await Proposal.findById(id)
      .populate("userId", "name email")
      .populate("reviewedBy", "name email role")
      .populate("targetBlogId", "title slug")
      .lean();

    if (!proposal) {
      return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
    }

    const isAdmin = ["root_admin", "super_admin", "manager"].includes(auth.session.user.role);
    const isOwner = proposal.userId && (
      (typeof proposal.userId === "object" && "_id" in proposal.userId && proposal.userId._id.toString() === auth.session.user.id) ||
      proposal.userId.toString() === auth.session.user.id
    );

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot view this proposal" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: proposal });
  } catch (error) {
    console.error("GET /api/proposals/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/proposals/[id]
// Allows user to edit their proposal while pending, or admin to review/update status
export async function PUT(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid proposal ID" }, { status: 400 });
    }

    await connectDB();
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
    }

    const isAdmin = ["root_admin", "super_admin", "manager"].includes(auth.session.user.role);
    const isOwner = proposal.userId.toString() === auth.session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot modify this proposal" }, { status: 403 });
    }

    const body = await req.json();

    // If caller is regular user (owner)
    if (!isAdmin) {
      if (proposal.status !== "pending") {
        return NextResponse.json(
          { success: false, error: "Only pending proposals can be edited directly." },
          { status: 400 }
        );
      }

      const { title, excerpt, content, suggestedCategories, isAnonymous, featuredImage } = body;

      if (title !== undefined) {
        if (typeof title !== "string" || title.trim().length === 0) {
          return NextResponse.json({ success: false, error: "Title cannot be empty" }, { status: 400 });
        }
        proposal.title = title.trim();
      }

      if (excerpt !== undefined) {
        proposal.excerpt = typeof excerpt === "string" ? excerpt.trim().slice(0, 300) : "";
      }

      if (typeof isAnonymous === "boolean") {
        proposal.isAnonymous = isAnonymous;
      }

      if (featuredImage !== undefined) {
        if (featuredImage && typeof featuredImage === "object" && featuredImage.url) {
          proposal.featuredImage = {
            url: String(featuredImage.url).trim(),
            alt: featuredImage.alt ? String(featuredImage.alt).trim() : undefined,
            caption: featuredImage.caption ? String(featuredImage.caption).trim() : undefined,
            fileVaultId: featuredImage.fileVaultId ? Number(featuredImage.fileVaultId) : undefined,
            storageKey: featuredImage.storageKey ? String(featuredImage.storageKey).trim() : undefined,
          };
        } else {
          proposal.featuredImage = undefined;
        }
      }

      if (content !== undefined) {
        const hasValid =
          Boolean(content) &&
          ((typeof content === "string" && content.trim().length > 0) ||
            (typeof content === "object" &&
              Array.isArray(content.blocks) &&
              content.blocks.length > 0));

        if (!hasValid) {
          return NextResponse.json({ success: false, error: "Content cannot be empty" }, { status: 400 });
        }

        const candidateBlocks: Array<{ type?: string; [key: string]: unknown }> =
          typeof content === "object" &&
          content !== null &&
          "blocks" in content &&
          Array.isArray((content as { blocks?: unknown[] }).blocks)
            ? ((content as { blocks: unknown[] }).blocks as Array<{ type?: string; [key: string]: unknown }>)
            : [];
        const imageCount = candidateBlocks.filter((b) => b?.type === "image").length;
        const fileCount = candidateBlocks.filter((b) => b?.type === "file" || b?.type === "attaches").length;
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

        proposal.content = typeof content === "string" ? content.trim() : content;
      }

      if (Array.isArray(suggestedCategories)) {
        proposal.suggestedCategories = suggestedCategories
          .map((c) => (typeof c === "string" ? c.trim() : ""))
          .filter((c) => c.length > 0)
          .slice(0, 5);
      }

      await proposal.save();

      const userBlocks =
        typeof proposal.content === "object" &&
        proposal.content !== null &&
        "blocks" in proposal.content &&
        Array.isArray((proposal.content as { blocks?: unknown[] }).blocks)
          ? (proposal.content as { blocks: unknown[] }).blocks
          : [];
      const userExtraAssetIds = proposal.featuredImage?.fileVaultId ? [proposal.featuredImage.fileVaultId] : [];
      await syncEntityAssets("proposal", proposal._id, userBlocks, auth.session.user.role, userExtraAssetIds);

      return NextResponse.json({
        success: true,
        data: proposal,
        message: "Your proposal has been updated.",
      });
    }

    // ----------------------------------------------------
    // Caller is admin: review, status change, approve / reject
    // ----------------------------------------------------
    const { status, adminFeedback, title, excerpt, content, suggestedCategories, isAnonymous, featuredImage } = body;

    if (title && typeof title === "string") proposal.title = title.trim();
    if (excerpt !== undefined) proposal.excerpt = typeof excerpt === "string" ? excerpt.trim().slice(0, 300) : "";
    if (content !== undefined) {
      proposal.content = typeof content === "string" ? content.trim() : content;
    }
    if (typeof isAnonymous === "boolean") {
      proposal.isAnonymous = isAnonymous;
    }
    if (featuredImage !== undefined) {
      if (featuredImage && typeof featuredImage === "object" && featuredImage.url) {
        proposal.featuredImage = {
          url: String(featuredImage.url).trim(),
          alt: featuredImage.alt ? String(featuredImage.alt).trim() : undefined,
          caption: featuredImage.caption ? String(featuredImage.caption).trim() : undefined,
          fileVaultId: featuredImage.fileVaultId ? Number(featuredImage.fileVaultId) : undefined,
          storageKey: featuredImage.storageKey ? String(featuredImage.storageKey).trim() : undefined,
        };
      } else {
        proposal.featuredImage = undefined;
      }
    }
    if (adminFeedback !== undefined) {
      proposal.adminFeedback = typeof adminFeedback === "string" ? adminFeedback.trim().slice(0, 500) : "";
    }
    if (Array.isArray(suggestedCategories)) {
      proposal.suggestedCategories = suggestedCategories
        .map((c) => (typeof c === "string" ? c.trim() : ""))
        .filter((c) => c.length > 0)
        .slice(0, 5);
    }

    // Status transition handling
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      proposal.status = status;
      proposal.reviewedBy = new Types.ObjectId(auth.session.user.id);
      proposal.reviewedAt = new Date();

      if (status === "approved") {
        // Find proposer info
        const proposer = await User.findById(proposal.userId).select("name email").lean();
        // For explorers, anonymous credit is strictly "Anonymous" (NOT "Mela Team")
        const authorName = proposal.isAnonymous ? "Anonymous" : (proposer?.name || "Explorer");

        // Resolve and auto-create categories from proposal
        let categoryIds: Types.ObjectId[] = [];
        const rawSuggested = Array.isArray(proposal.suggestedCategories)
          ? proposal.suggestedCategories
          : [];

        for (const rawCat of rawSuggested) {
          const trimmedName = typeof rawCat === "string" ? rawCat.trim() : "";
          if (!trimmedName) continue;

          const catSlug = trimmedName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

          if (!catSlug) continue;

          // Look for existing category by slug or case-insensitive name
          let catDoc = await Category.findOne({
            $or: [
              { slug: catSlug },
              {
                name: new RegExp(
                  `^${trimmedName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`,
                  "i"
                ),
              },
            ],
          });

          // Auto-create category if it does not exist yet
          if (!catDoc) {
            try {
              catDoc = await Category.create({
                name: trimmedName,
                slug: catSlug,
              });
            } catch {
              catDoc = await Category.findOne({ slug: catSlug });
            }
          }

          if (
            catDoc &&
            !categoryIds.some((id) => id.toString() === catDoc._id.toString())
          ) {
            categoryIds.push(catDoc._id);
          }
        }

        if (categoryIds.length === 0) {
          const fallbackCat =
            (await Category.findOne({ slug: "other" })) ||
            (await Category.findOne());
          if (fallbackCat) categoryIds = [fallbackCat._id];
        }

        const blogContent =
          typeof proposal.content === "object" && proposal.content !== null
            ? proposal.content
            : {
                time: Date.now(),
                blocks: [
                  {
                    type: "paragraph",
                    data: { text: String(proposal.content || "") },
                  },
                ],
                version: "2.31.3",
              };

        const calculatedExcerpt =
          proposal.excerpt?.trim() ||
          generateExcerpt(blogContent as unknown as EditorContent, 200) ||
          "Article excerpt";

        // CASE 1: Revision proposal for an existing live blog
        if (proposal.type === "revision" && proposal.targetBlogId) {
          const existingBlog = await Blog.findById(proposal.targetBlogId);
          if (existingBlog) {
            existingBlog.title = proposal.title;
            existingBlog.excerpt = calculatedExcerpt;
            existingBlog.content = blogContent as unknown as EditorContent;
            existingBlog.categories = categoryIds;
            existingBlog.isAnonymous = Boolean(proposal.isAnonymous);
            existingBlog.authorName = authorName;
            if (proposal.featuredImage) {
              existingBlog.featuredImage = proposal.featuredImage;
            }
            existingBlog.lastEditedBy = new Types.ObjectId(auth.session.user.id);
            await existingBlog.save();

            proposal.blogId = existingBlog._id;
            proposal.blogSlug = existingBlog.slug;
          }
        } else {
          // CASE 2: New proposal
          if (proposal.blogId) {
            // Re-approving an existing blog
            const existingBlog = await Blog.findById(proposal.blogId);
            if (existingBlog) {
              existingBlog.title = proposal.title;
              existingBlog.excerpt = calculatedExcerpt;
              existingBlog.content = blogContent as unknown as EditorContent;
              existingBlog.categories = categoryIds;
              existingBlog.isAnonymous = Boolean(proposal.isAnonymous);
              existingBlog.authorName = authorName;
              if (proposal.featuredImage) {
                existingBlog.featuredImage = proposal.featuredImage;
              }
              existingBlog.status = "published";
              existingBlog.publishedAt = existingBlog.publishedAt || new Date();
              existingBlog.lastEditedBy = new Types.ObjectId(auth.session.user.id);
              await existingBlog.save();
              proposal.blogSlug = existingBlog.slug;
            }
          } else {
            // Create brand new published blog credited to the proposer
            const generatedSlug = await generateUniqueSlug(proposal.title);
            const newBlog = await Blog.create({
              title: proposal.title,
              slug: generatedSlug,
              excerpt: calculatedExcerpt,
              content: blogContent as unknown as EditorContent,
              categories: categoryIds,
              featuredImage: proposal.featuredImage,
              author: proposal.userId,
              authorName,
              isAnonymous: Boolean(proposal.isAnonymous),
              status: "published",
              publishedAt: new Date(),
              lastEditedBy: new Types.ObjectId(auth.session.user.id),
            });

            const createdBlog = newBlog as unknown as { _id: Types.ObjectId; slug: string };
            proposal.blogId = createdBlog._id;
            proposal.blogSlug = createdBlog.slug;
          }
        }
      } else if (status === "rejected") {
        // If a previously approved new blog is now rejected, unpublish it (draft)
        if (proposal.type === "new" && proposal.blogId) {
          await Blog.findByIdAndUpdate(proposal.blogId, {
            status: "draft",
            lastEditedBy: new Types.ObjectId(auth.session.user.id),
          });
        }
      }
    }

    await proposal.save();

    const adminBlocks =
      typeof proposal.content === "object" &&
      proposal.content !== null &&
      "blocks" in proposal.content &&
      Array.isArray((proposal.content as { blocks?: unknown[] }).blocks)
        ? (proposal.content as { blocks: unknown[] }).blocks
        : [];
    const adminExtraAssetIds = proposal.featuredImage?.fileVaultId ? [proposal.featuredImage.fileVaultId] : [];
    await syncEntityAssets("proposal", proposal._id, adminBlocks, auth.session.user.role, adminExtraAssetIds);

    if (proposal.status === "approved" && proposal.blogId) {
      await syncEntityAssets("blog", proposal.blogId, adminBlocks, "root_admin", adminExtraAssetIds);
    }

    // Populate for clean client return
    const populated = await Proposal.findById(proposal._id)
      .populate("userId", "name email")
      .populate("reviewedBy", "name email role")
      .populate("targetBlogId", "title slug")
      .lean();

    return NextResponse.json({
      success: true,
      data: populated || proposal,
      message:
        proposal.status === "approved"
          ? proposal.type === "revision"
            ? "Revision approved! Live article updated."
            : "Proposal approved and published live!"
          : proposal.status === "rejected"
            ? "Proposal marked as rejected."
            : "Proposal status updated.",
    });
  } catch (error) {
    console.error("PUT /api/proposals/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/proposals/[id]
// Allows user to withdraw their pending proposal, or admin to delete any proposal
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid proposal ID" }, { status: 400 });
    }

    await connectDB();
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
    }

    const isAdmin = ["root_admin", "super_admin", "manager"].includes(auth.session.user.role);
    const isOwner = proposal.userId.toString() === auth.session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot delete this proposal" }, { status: 403 });
    }

    // Non-admins can only delete/withdraw if pending
    if (!isAdmin && proposal.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending proposals can be withdrawn." },
        { status: 400 }
      );
    }

    await Proposal.findByIdAndDelete(id);
    await trashEntityAssets("proposal", id, auth.session.user.role);

    return NextResponse.json({
      success: true,
      data: { id },
      message: "Proposal deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/proposals/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
