import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { Types } from "mongoose";

// PUT /api/admin/categories/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid category id" },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    category.name = name;
    await category.save(); // slug auto-regenerates via pre-save hook

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { success: false, error: "Category already exists" },
        { status: 409 }
      );
    }

    console.error("PUT /api/admin/categories/[id] error", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid category id" },
        { status: 400 }
      );
    }

    await connectDB();

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Ensure "other" category exists
    let otherCategory = await Category.findOne({ slug: "other" });

    if (!otherCategory) {
      otherCategory = await Category.create({ name: "Other" });
    }

    // IMPORTANT:
    // This assumes your Blog model stores category as ObjectId reference.
    // If you're storing it as string instead, tell me.
    const { Blog } = await import("@/models/Blog");

    await Blog.updateMany(
      { categories: category._id },
      { $pull: { categories: category._id } }
    );

    await Blog.updateMany(
      { categories: { $size: 0 } },
      { $addToSet: { categories: otherCategory._id } }
    );


    await Category.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Category deleted and blogs reassigned to 'other'",
    });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] error", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
