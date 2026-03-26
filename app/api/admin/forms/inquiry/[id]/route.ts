// app/api/admin/forms/inquiry/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Inquiry } from "@/models/Inquiry";
import type { ApiResponse } from "@/types/api";

// -----------------------------
// Zod schema (status only)
// -----------------------------
const statusSchema = z.object({
  status: z.enum(["new", "interested", "dismissed"]),
});

// -----------------------------
// PATCH /api/admin/forms/inquiry/:id
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

    const parsed = statusSchema.safeParse(body);

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
          error: "Invalid inquiry id",
        },
        { status: 400 }
      );
    }

    // -------------------------
    // DB
    // -------------------------
    await connectDB();

    const updated = await Inquiry.findByIdAndUpdate(
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
          error: "Inquiry not found",
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
    console.error("ADMIN INQUIRY PATCH ERROR", err);

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