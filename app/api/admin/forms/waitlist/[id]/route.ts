// app/api/admin/forms/waitlist/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { waitlistStatusSchema } from "@/lib/validators/waitlist";
import { Waitlist } from "@/models/Waitlist";
import type { ApiResponse } from "@/types/api";

// -----------------------------
// PATCH /api/admin/forms/waitlist/:id
// -----------------------------
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // -------------------------
    // Auth check
    // -------------------------
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // -------------------------
    // Parse body
    // -------------------------
    const body = await req.json();

    const parsed = waitlistStatusSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessage =
        parsed.error.issues[0]?.message || "Invalid status";

      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    const { status } = parsed.data;
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "Invalid waitlist id",
        },
        { status: 400 }
      );
    }

    // -------------------------
    // DB
    // -------------------------
    await connectDB();

    const updated = await Waitlist.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "Waitlist entry not found",
        },
        { status: 404 }
      );
    }

    // -------------------------
    // Success
    // -------------------------
    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("ADMIN WAITLIST PATCH ERROR", err);

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
