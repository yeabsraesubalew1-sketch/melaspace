import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// GET /api/user/profile
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    await connectDB();
    const user = await User.findById(auth.session.user.id)
      .select("name email role status bio avatar createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/user/profile
// Allows any authenticated user (explorer or admin) to update their display name and bio
export async function PUT(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const body = await req.json();
    const { name, bio } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    if (name.trim().length > 60) {
      return NextResponse.json({ success: false, error: "Name must be 60 characters or less" }, { status: 400 });
    }

    if (bio && typeof bio === "string" && bio.trim().length > 300) {
      return NextResponse.json({ success: false, error: "Bio must be 300 characters or less" }, { status: 400 });
    }

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      auth.session.user.id,
      {
        $set: {
          name: name.trim(),
          bio: typeof bio === "string" ? bio.trim() : undefined,
        },
      },
      { new: true }
    ).select("name email role status bio avatar");

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/user/profile error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
