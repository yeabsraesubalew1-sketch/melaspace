import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          status: "unauthorized",
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    await mongoose.connection.db?.admin().ping();

    return NextResponse.json(
      {
        success: true,
        status: "ok",
        service: "mongodb",
        checkedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/health/db error", error);

    return NextResponse.json(
      {
        success: false,
        status: "down",
        service: "mongodb",
        checkedAt: new Date().toISOString(),
        error: "Database unreachable",
      },
      { status: 503 }
    );
  }
}