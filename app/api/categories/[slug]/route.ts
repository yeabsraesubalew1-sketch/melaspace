import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { Blog } from "@/models/Blog";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectDB();

    const category = await Category.findOne({ slug });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    const blogCount = await Blog.countDocuments({
      categories: category._id,
      status: "published", // assuming you have this
    });

    return NextResponse.json({
      success: true,
      data: {
        category,
        blogCount,
      },
    });
  } catch (error) {
    console.error("GET /api/categories/[slug] error", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
