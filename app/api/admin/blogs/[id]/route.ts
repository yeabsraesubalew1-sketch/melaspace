import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Category } from "@/models/Category";
import { Types } from "mongoose";
import type { ApiResponse } from "@/types/api";

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
      .lean();

    if (!blog) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Blog not found" },
        { status: 404 }
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
export async function PUT(
  req: Request,
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

    const body = await req.json();
    const { title, excerpt, content, categories, status } = body;

    const blog = await Blog.findById(id);

    if (!blog) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Blog not found" },
        { status: 404 }
      );
    }

    // ---- Immutable: slug is NOT editable ----

    if (title !== undefined) blog.title = title;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (content !== undefined) blog.content = content;

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

    const deleted = await Blog.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Blog not found" },
        { status: 404 }
      );
    }

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
