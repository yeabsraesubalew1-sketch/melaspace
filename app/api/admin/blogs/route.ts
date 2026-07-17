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
    }

    const mapPreview = (blog: BlogLean): BlogPreview => ({
      id: typeof blog._id === "string" ? blog._id : blog._id.toString(),
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      categories: blog.categories.map((cat) => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
      })),
      status: blog.status,
      publishedAt: blog.publishedAt?.toISOString(),
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
          .sort(status === "published" ? { publishedAt: -1 } : { updatedAt: -1 })
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
        .sort({ publishedAt: -1 })
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

    if (!session) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();

    const { title, content, categories = [], status = "draft" } = body;

    if (!title || !content) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate slug automatically
    const slug = await generateUniqueSlug(title);

    // Generate excerpt automatically
    const excerpt = generateExcerpt(content);

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
      excerpt,
      content,
      categories: categoryIds,
      status,
      publishedAt: status === "published" ? new Date() : undefined,
    });

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