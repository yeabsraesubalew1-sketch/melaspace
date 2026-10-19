import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Category } from "@/models/Category";
import { Types } from "mongoose";
import type { ApiResponse } from "@/types/api";
import { syncEntityAssets, trashEntityAssets } from "@/lib/filevault-cleanup";

interface Params {
  id: string;
}

function getUserFacingError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      /mongo|mongoose|serverselection|topology|ssl|tls|econn|enotfound|connect/.test(
        message
      )
    ) {
      return "Database connection failed. Please verify your MongoDB configuration and try again.";
    }

    return error.message;
  }

  return "Internal server error";
}

//
// GET /api/admin/blogs/[id]
// Fetch single blog (draft or published)
//
export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Invalid blog id" },
        { status: 400 }
      );
    }

    await connectDB();

    const blog = await Blog.findById(id)
      .populate("categories", "_id name slug")
      .populate("author", "name email role")
      .populate("lastEditedBy", "name email role")
      .lean();

    if (!blog) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Blog not found" },
        { status: 404 }
      );
    }

    const userRole = session.user.role;
    const authorVal = blog.author as unknown;
    const authorId =
      authorVal && typeof authorVal === "object" && "_id" in authorVal
        ? String((authorVal as { _id: unknown })._id)
        : authorVal
          ? String(authorVal)
          : undefined;
    const isOwner = Boolean(authorId && authorId === session.user.id);
    const isTeamPost =
      blog.authorName === "Mela Team" ||
      (Boolean(blog.isAnonymous) && blog.authorName !== "Anonymous");

    // "Mela Team" posts are institutional shared posts editable by all admins;
    // individual posts require Root Admin or original owner
    const canAccess =
      userRole === "root_admin" ||
      isOwner ||
      (isTeamPost && ["super_admin", "manager"].includes(userRole)) ||
      (!blog.author && ["super_admin", "manager"].includes(userRole));

    if (!canAccess) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Forbidden: Only the Root Administrator can edit other people's personal posts." },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse<typeof blog>>({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("GET /api/admin/blogs/[id] error", error);

    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: getUserFacingError(error) },
      { status: 500 }
    );
  }
}

//
// PUT /api/admin/blogs/[id]
// Update blog
//
//
// PUT /api/admin/blogs/[id]
// Update blog
//
export async function PUT(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    if (!["root_admin", "super_admin", "manager", "author"].includes(userRole)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Invalid blog id" },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { title, excerpt, content, categories, status, isPinned, isAnonymous } = body;

    const blog = await Blog.findById(id);

    if (!blog) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Blog not found" },
        { status: 404 }
      );
    }

    // Only Root Admin can edit other admins' personal posts.
    // "Mela Team" posts are institutional shared posts and can be edited by all admins.
    const isOwner = blog.author && blog.author.toString() === session.user.id;
    const isTeamPost =
      blog.authorName === "Mela Team" ||
      (Boolean(blog.isAnonymous) && blog.authorName !== "Anonymous");

    const canAccess =
      userRole === "root_admin" ||
      isOwner ||
      (isTeamPost && ["super_admin", "manager"].includes(userRole)) ||
      (!blog.author && ["super_admin", "manager"].includes(userRole));

    if (!canAccess) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Forbidden: Only the Root Administrator can edit other people's personal posts." },
        { status: 403 }
      );
    }

    // Handle isPinned (only super_admin and root_admin, must be published)
    if (typeof isPinned === "boolean") {
      if (isPinned) {
        if (!["root_admin", "super_admin"].includes(userRole)) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, data: null, error: "Only Super Admins can pin posts." },
            { status: 403 }
          );
        }

        const effectiveStatus = status || blog.status;
        if (effectiveStatus !== "published") {
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              data: null,
              error: "Pinned blogs must be published. Please publish the blog to pin it.",
            },
            { status: 400 }
          );
        }

        if (!blog.isPinned) {
          const pinnedCount = await Blog.countDocuments({ isPinned: true, _id: { $ne: blog._id } });
          if (pinnedCount >= 3) {
            return NextResponse.json<ApiResponse<null>>(
              {
                success: false,
                data: null,
                error: "Maximum of 3 blogs can be pinned. Please unpin another blog first.",
              },
              { status: 400 }
            );
          }
        }

        blog.isPinned = true;
      } else {
        blog.isPinned = false;
      }
    }

    // Handle isAnonymous & forced "Mela Team" conversion
    if (typeof isAnonymous === "boolean") {
      const canChangeAttribution = userRole === "root_admin" || isOwner;
      if (canChangeAttribution) {
        blog.isAnonymous = isAnonymous;
        if (isAnonymous) {
          blog.authorName = "Mela Team";
        } else {
          // Restore original author credit, never claim as editor's personal name
          const User = (await import("@/models/User")).default;
          const authorUser = blog.author ? await User.findById(blog.author).select("name") : null;
          blog.authorName =
            authorUser?.name ||
            (blog.authorName !== "Mela Team" && blog.authorName ? blog.authorName : "Mela Team");
        }
      }
    }

    if (title !== undefined) blog.title = title;
    if (excerpt !== undefined) {
      blog.excerpt = typeof excerpt === "string" ? excerpt.trim().slice(0, 300) : excerpt;
    }
    if (content !== undefined) blog.content = content;

    // Record last edited by
    if (session.user.id) {
      blog.lastEditedBy = new Types.ObjectId(session.user.id);
    }

    //
    // Validate & update categories (ObjectId[])
    //
    if (Array.isArray(categories)) {
      if (categories.length > 0) {
        const normalizedIds = categories.map((category: unknown) => {
          if (typeof category === "string") return category;

          if (
            typeof category === "object" &&
            category !== null &&
            "_id" in category &&
            typeof (category as { _id: unknown })._id === "string"
          ) {
            return (category as { _id: string })._id;
          }

          return null;
        });

        if (normalizedIds.some((id) => id === null)) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, data: null, error: "Invalid category id provided" },
            { status: 400 }
          );
        }

        const validIds = normalizedIds.filter(
          (id): id is string => id !== null && Types.ObjectId.isValid(id)
        );

        if (validIds.length !== normalizedIds.length) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, data: null, error: "Invalid category id provided" },
            { status: 400 }
          );
        }

        const existingCategories = await Category.find({
          _id: { $in: validIds },
        }).select("_id");

        if (existingCategories.length !== validIds.length) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, data: null, error: "One or more categories not found" },
            { status: 400 }
          );
        }

        blog.categories = existingCategories.map((cat) => cat._id);
      } else {
        // Empty array → let schema fallback assign "other"
        blog.categories = [];
      }
    }

    //
    // Anonymous posting toggle
    //
    if (typeof isAnonymous === "boolean") {
      blog.isAnonymous = isAnonymous;
    }

    //
    // Status logic
    //
    if (status && status !== blog.status) {
      blog.status = status;

      if (status === "published" && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }

      if (status === "draft") {
        blog.publishedAt = undefined;
      }
    }

    await blog.save(); // schema ensures fallback category

    const blocks =
      typeof blog.content === "object" &&
      blog.content !== null &&
      "blocks" in blog.content &&
      Array.isArray((blog.content as { blocks?: unknown[] }).blocks)
        ? (blog.content as { blocks: unknown[] }).blocks
        : [];
    await syncEntityAssets("blog", blog._id, blocks, userRole);

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id: blog._id.toString() },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Slug already exists" },
        { status: 409 }
      );
    }

    console.error("PUT /api/admin/blogs/[id] error", error);

    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: getUserFacingError(error) },
      { status: 500 }
    );
  }
}

//
// DELETE /api/admin/blogs/[id]
// Delete blog
//
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    if (!["root_admin", "super_admin", "manager", "author"].includes(userRole)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Invalid blog id" },
        { status: 400 }
      );
    }

    await connectDB();

    const blog = await Blog.findById(id);

    if (!blog) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Blog not found" },
        { status: 404 }
      );
    }

    // Only Root Admin or the author can delete personal posts.
    // "Mela Team" posts can be deleted by Super Admins and Root Admin.
    const isOwner = blog.author && blog.author.toString() === session.user.id;
    const isTeamPost =
      blog.authorName === "Mela Team" ||
      (Boolean(blog.isAnonymous) && blog.authorName !== "Anonymous");

    const canDelete =
      userRole === "root_admin" ||
      isOwner ||
      (isTeamPost && ["root_admin", "super_admin"].includes(userRole)) ||
      (!blog.author && userRole === "super_admin");

    if (!canDelete) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Forbidden: Only the Root Administrator can delete other people's personal posts." },
        { status: 403 }
      );
    }

    await Blog.findByIdAndDelete(id);
    await trashEntityAssets("blog", id, userRole);

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("DELETE /api/admin/blogs/[id] error", error);

    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: getUserFacingError(error) },
      { status: 500 }
    );
  }
}
