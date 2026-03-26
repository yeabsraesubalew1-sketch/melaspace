// app/api/admin/forms/inquiry/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Inquiry } from "@/models/Inquiry";
import type { ApiResponse } from "@/types/api";

// -----------------------------
// GET /api/admin/forms/inquiry
// -----------------------------
export async function GET(req: Request) {
  try {
    // -------------------------
    // Auth check (admin only)
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
    // Query params
    // -------------------------
    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    const status = searchParams.get("status");

    // -------------------------
    // DB
    // -------------------------
    await connectDB();

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    // -------------------------
    // Fetch
    // -------------------------
    const total = await Inquiry.countDocuments(filter);

    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // -------------------------
    // Response
    // -------------------------
    return NextResponse.json<ApiResponse<typeof inquiries>>({
      success: true,
      data: inquiries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("ADMIN INQUIRY GET ERROR", err);

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