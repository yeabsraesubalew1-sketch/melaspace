import { NextResponse } from "next/server";
import { requireRole, canActorManageTarget, revokeUserSession, unbanUser } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import User, { type UserRole } from "@/models/User";
import { Types, type PipelineStage } from "mongoose";

// GET /api/admin/users
// Lists users with role filter and search (Super Admin and Root Admin only)
export async function GET(req: Request) {
  try {
    const auth = await requireRole(["root_admin", "super_admin"]);
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.trim();
    const role = searchParams.get("role")?.trim();
    const status = searchParams.get("status")?.trim();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && ["root_admin", "super_admin", "manager", "author", "user"].includes(role)) {
      filter.role = role;
    }

    if (status && ["active", "kicked"].includes(status)) {
      filter.status = status;
    }

    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $addFields: {
          roleRank: {
            $switch: {
              branches: [
                { case: { $eq: ["$role", "root_admin"] }, then: 1 },
                { case: { $eq: ["$role", "super_admin"] }, then: 2 },
                { case: { $eq: ["$role", "manager"] }, then: 3 },
                { case: { $eq: ["$role", "author"] }, then: 4 },
                { case: { $eq: ["$role", "user"] }, then: 5 },
              ],
              default: 6,
            },
          },
        },
      },
      { $sort: { roleRank: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { __v: 0, roleRank: 0 } },
    ];

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.aggregate(pipeline),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/users
// Promotes or demotes user role
export async function PUT(req: Request) {
  try {
    const auth = await requireRole(["root_admin", "super_admin"]);
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { userId, newRole, action } = body;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    await connectDB();
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Target user not found" }, { status: 404 });
    }

    const actor = auth.session.user;

    // Hierarchy authorization check
    const permission = canActorManageTarget(
      actor.role,
      actor.email,
      targetUser.role,
      targetUser.email
    );

    if (!permission.allowed) {
      return NextResponse.json({ success: false, error: permission.reason }, { status: 403 });
    }

    // Handle Unban action
    if (action === "unban") {
      await unbanUser(targetUser.email);
      return NextResponse.json({
        success: true,
        message: `Account ${targetUser.email} has been reinstated.`,
      });
    }

    // Handle Role Change
    const validRoles: UserRole[] = ["super_admin", "manager", "author", "user"];
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json({ success: false, error: "Invalid role specified" }, { status: 400 });
    }

    // Only Root Admin can promote anyone to Super Admin
    if (newRole === "super_admin" && actor.role !== "root_admin") {
      return NextResponse.json(
        { success: false, error: "Only the Root Administrator can appoint Super Admins." },
        { status: 403 }
      );
    }

    // If downgrading an admin, increment tokenVersion to force token refresh
    targetUser.role = newRole;
    targetUser.tokenVersion = (targetUser.tokenVersion || 1) + 1;
    await targetUser.save();

    return NextResponse.json({
      success: true,
      data: {
        id: targetUser._id.toString(),
        email: targetUser.email,
        role: targetUser.role,
      },
      message: `User role updated to ${newRole}.`,
    });
  } catch (error) {
    console.error("PUT /api/admin/users error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/users
// Kicks out / bans a user and revokes their session token immediately
export async function DELETE(req: Request) {
  try {
    const auth = await requireRole(["root_admin", "super_admin"]);
    if (auth.error || !auth.session) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    await connectDB();
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Target user not found" }, { status: 404 });
    }

    const actor = auth.session.user;

    // Check permissions
    const permission = canActorManageTarget(
      actor.role,
      actor.email,
      targetUser.role,
      targetUser.email
    );

    if (!permission.allowed) {
      return NextResponse.json({ success: false, error: permission.reason }, { status: 403 });
    }

    // Revoke session immediately across Redis and DB
    await revokeUserSession(targetUser.email);

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been kicked out and their active session revoked.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
