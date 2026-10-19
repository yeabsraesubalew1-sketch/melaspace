import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { Blog } from "@/models/Blog";

// GET /api/categories
// Only returns categories that are actively assigned to at least one published blog
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const returnAll = searchParams.get("all") === "true";

    let filter: Record<string, unknown> = {};
    if (!returnAll) {
      // Find all category IDs used by published blogs
      const usedCategoryIds = await Blog.distinct("categories", {
        status: "published",
      });
      filter = { _id: { $in: usedCategoryIds } };
    }

    const categories = await Category.find(filter)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("GET /api/categories error", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
