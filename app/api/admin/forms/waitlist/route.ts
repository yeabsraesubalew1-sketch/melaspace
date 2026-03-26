// app/api/admin/forms/waitlist/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Waitlist } from "@/models/Waitlist";
import type { ApiResponse } from "@/types/api";

// -----------------------------
// GET /api/admin/forms/waitlist
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
    const total = await Waitlist.countDocuments(filter);

    const waitlists = await Waitlist.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // -------------------------
    // Response
    // -------------------------
    return NextResponse.json<ApiResponse<typeof waitlists>>({
      success: true,
      data: waitlists,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("ADMIN WAITLIST GET ERROR", err);

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
