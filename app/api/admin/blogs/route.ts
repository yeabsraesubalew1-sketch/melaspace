import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import type { BlogDocument } from "@/models/Blog";
import { Category } from "@/models/Category";
import { Types } from "mongoose";
import type { ApiResponse, BlogPreview } from "@/types/api";
import { generateUniqueSlug } from "@/lib/slugify";
import { generateExcerpt } from "@/lib/generateExcerpt";
import { syncEntityAssets } from "@/lib/filevault-cleanup";

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
// GET /api/admin/blogs
//
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
    const skip = (page - 1) * limit;
    const statusParam = searchParams.get("status");
    const status =
      statusParam === "draft" || statusParam === "published"
        ? statusParam
        : null;
    const search = searchParams.get("q")?.trim();
    const categorySlug = searchParams.get("category")?.trim();

    interface BlogLean {
      _id: string | { toString(): string };
      title: string;
      slug: string;
      excerpt: string;
      categories: { _id: string; name: string; slug: string }[];
      status: "draft" | "published";
      publishedAt?: Date;
      isPinned?: boolean;
      views?: number;
      author?: { toString(): string };
      authorName?: string;
      isAnonymous?: boolean;
    }

    const mapPreview = (blog: BlogLean): BlogPreview => ({
      id: typeof blog._id === "string" ? blog._id : blog._id.toString(),
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      categories: (blog.categories || []).map((cat) => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
      })),
      status: blog.status,
      publishedAt: blog.publishedAt?.toISOString(),
      isPinned: Boolean(blog.isPinned),
      views: blog.views ?? 0,
      authorId: blog.author ? blog.author.toString() : undefined,
      authorName: blog.authorName || "Mela Team",
      isAnonymous: Boolean(blog.isAnonymous),
    });

    if (status) {
      const filter: Parameters<typeof Blog.find<BlogDocument>>[0] = { status };

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { excerpt: { $regex: search, $options: "i" } },
        ];
      }

      if (categorySlug) {
        const category = await Category.findOne({ slug: categorySlug }).select("_id");

        if (category) {
          filter.categories = category._id;
        } else {
          return NextResponse.json<ApiResponse<BlogPreview[]>>({
            success: true,
            data: [],
            meta: {
              total: 0,
              page,
              limit,
              totalPages: 1,
            },
          });
        }
      }

      const [total, blogs] = await Promise.all([
        Blog.countDocuments(filter),
        Blog.find(filter)
          .populate("categories", "name slug")
          .sort(status === "published" ? { isPinned: -1, publishedAt: -1 } : { updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean<BlogLean[]>(),
      ]);

      return NextResponse.json<ApiResponse<BlogPreview[]>>({
        success: true,
        data: blogs.map(mapPreview),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    }

    const [drafts, published] = await Promise.all([
      Blog.find({ status: "draft" })
        .populate("categories", "name slug")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<BlogLean[]>(),

      Blog.find({ status: "published" })
        .populate("categories", "name slug")
        .sort({ isPinned: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<BlogLean[]>(),
    ]);

    return NextResponse.json<
      ApiResponse<{ drafts: BlogPreview[]; published: BlogPreview[] }>
    >({
      success: true,
      data: {
        drafts: drafts.map(mapPreview),
        published: published.map(mapPreview),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/blogs error", error);

    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: getUserFacingError(error) },
      { status: 500 }
    );
  }
}

//
// POST /api/admin/blogs
//

export async function POST(req: Request) {
  try {
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

    await connectDB();

    const body = await req.json();

    const {
      title,
      content,
      categories = [],
      status = "draft",
      excerpt: customExcerpt,
      isPinned = false,
      isAnonymous = false,
    } = body;

    if (!title || !content) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle isPinned (only super_admin and root_admin can pin, max 3, MUST be published)
    let shouldPin = false;
    if (isPinned) {
      if (!["root_admin", "super_admin"].includes(userRole)) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, data: null, error: "Only Super Admins can pin posts." },
          { status: 403 }
        );
      }

      if (status !== "published") {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            data: null,
            error: "Pinned blogs must be published. Please publish the blog to pin it.",
          },
          { status: 400 }
        );
      }

      const pinnedCount = await Blog.countDocuments({ isPinned: true });
      if (pinnedCount >= 3) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            data: null,
            error: "Maximum of 3 blogs can be pinned. Please unpin an existing one first.",
          },
          { status: 400 }
        );
      }
      shouldPin = true;
    }

    // Generate slug automatically
    const slug = await generateUniqueSlug(title);

    // Use custom excerpt if provided, otherwise auto-generate
    const finalExcerpt =
      typeof customExcerpt === "string" && customExcerpt.trim().length > 0
        ? customExcerpt.trim().slice(0, 300)
        : generateExcerpt(content);

    //
    // Validate categories
    //
    let categoryIds: Types.ObjectId[] = [];

    if (Array.isArray(categories) && categories.length > 0) {
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

      categoryIds = existingCategories.map((cat) => cat._id);
    }

    const blog = await Blog.create({
      title,
      slug,
      excerpt: finalExcerpt,
      content,
      categories: categoryIds,
      status,
      isPinned: shouldPin,
      isAnonymous: Boolean(isAnonymous),
      author: session.user.id ? new Types.ObjectId(session.user.id) : undefined,
      authorName: isAnonymous ? "Mela Team" : (session.user.name || "Mela Team"),
      publishedAt: status === "published" ? new Date() : undefined,
    });

    const blocks =
      typeof content === "object" &&
      content !== null &&
      "blocks" in content &&
      Array.isArray((content as { blocks?: unknown[] }).blocks)
        ? (content as { blocks: unknown[] }).blocks
        : [];
    await syncEntityAssets("blog", blog._id, blocks, userRole);

    return NextResponse.json<ApiResponse<{ id: string }>>(
      {
        success: true,
        data: { id: blog._id.toString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/blogs error", error);

    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: getUserFacingError(error) },
      { status: 500 }
    );
  }
}