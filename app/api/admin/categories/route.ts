import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";

// POST /api/admin/categories
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
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

    const category = new Category({ name });
    await category.save(); // slug auto-generates here

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Handle duplicate slug error (unique index)
    interface MongoError {
      code?: number;
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as MongoError).code === 11000
    ) {
      return NextResponse.json(
        { success: false, error: "Category already exists" },
        { status: 409 }
      );
    }

    console.error("POST /api/admin/categories error", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
