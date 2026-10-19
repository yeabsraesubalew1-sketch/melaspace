import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { redis } from "@/lib/db";
import { Types } from "mongoose";
import User, { type UserRole, type UserStatus } from "@/models/User";

/**
 * Check whether a user's session is revoked / kicked out.
 * Resilient to free-tier Upstash Redis limits and network dropouts.
 */
export async function isUserKicked(email: string, tokenVersion?: number): Promise<boolean> {
  if (!email) return true;

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Try Redis lookup first (sub-5ms)
  try {
    const isKickedInRedis = await redis.get<string | number>(`kicked:${normalizedEmail}`);
    if (isKickedInRedis) {
      return true;
    }
  } catch (error) {
    // If Redis free tier hits rate limits or network issues, failover gracefully to DB
    console.warn("[AUTH] Redis check failed/rate-limited, falling back to database check:", error);
  }

  // 2. Database check as source of truth
  try {
    await connectDB();
    const user = await User.findOne({ email: normalizedEmail }).select("status tokenVersion").lean();
    if (!user) return true;
    if (user.status === "kicked") return true;
    if (tokenVersion !== undefined && user.tokenVersion > tokenVersion) return true;
    return false;
  } catch (dbError) {
    console.error("[AUTH] Database revocation check error:", dbError);
    return false; // Fail open to avoid locking out during temporary DB hiccups
  }
}

/**
 * Revoke a user's session immediately across Redis and MongoDB.
 */
export async function revokeUserSession(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  await connectDB();
  await User.updateOne(
    { email: normalizedEmail },
    {
      $set: { status: "kicked" as UserStatus },
      $inc: { tokenVersion: 1 },
    }
  );

  // Set 30-day revocation key in Redis
  try {
    await redis.set(`kicked:${normalizedEmail}`, "1", { ex: 60 * 60 * 24 * 30 });
  } catch (error) {
    console.warn("[AUTH] Failed to write kick key to Redis (DB updated):", error);
  }
}

/**
 * Unban or reinstate a user.
 */
export async function unbanUser(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  await connectDB();
  await User.updateOne(
    { email: normalizedEmail },
    {
      $set: { status: "active" as UserStatus },
      $inc: { tokenVersion: 1 },
    }
  );

  try {
    await redis.del(`kicked:${normalizedEmail}`);
  } catch (error) {
    console.warn("[AUTH] Failed to delete kick key from Redis (DB updated):", error);
  }
}

export type AuthResult =
  | { error: string; status: 401 | 403; session: null }
  | { error: null; status: 200; session: Session };

/**
 * Require valid authenticated session with active status.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return { error: "Unauthorized", status: 401, session: null };
  }

  // Ensure session.user.id is always a valid ObjectId, auto-healing legacy sessions
  if (!session.user.id || !Types.ObjectId.isValid(session.user.id)) {
    try {
      await connectDB();
      const dbUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
      if (dbUser) {
        session.user.id = dbUser._id.toString();
        session.user.role = dbUser.role;
        session.user.status = dbUser.status;
      } else {
        return { error: "User account not found.", status: 401, session: null };
      }
    } catch (dbErr) {
      console.error("[AUTH] Error resolving user in requireAuth:", dbErr);
    }
  }

  if (session.user.status === "kicked") {
    return { error: "Your account has been deactivated or removed.", status: 403, session: null };
  }

  return { error: null, status: 200, session };
}

/**
 * Check if the caller has one of the allowed roles.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthResult> {
  const auth = await requireAuth();
  if (auth.error || !auth.session) {
    return {
      error: auth.error || "Unauthorized",
      status: auth.status,
      session: null,
    };
  }

  const userRole = auth.session.user.role;

  if (!allowedRoles.includes(userRole)) {
    return {
      error: "Forbidden: You lack permission to perform this action.",
      status: 403,
      session: null,
    };
  }

  return { error: null, status: 200, session: auth.session };
}

/**
 * Verify whether an actor can modify or kick out a target user based on role hierarchy.
 */
export function canActorManageTarget(
  actorRole: UserRole,
  actorEmail: string,
  targetRole: UserRole,
  targetEmail: string
): { allowed: boolean; reason?: string } {
  const normalizedActor = actorEmail.toLowerCase().trim();
  const normalizedTarget = targetEmail.toLowerCase().trim();
  const rootEmail = (process.env.ROOT_ADMIN_EMAIL || "").toLowerCase().trim();

  if (normalizedTarget === rootEmail || targetRole === "root_admin") {
    return { allowed: false, reason: "The Root Administrator account cannot be modified, demoted, or removed." };
  }

  if (normalizedActor === normalizedTarget) {
    return { allowed: false, reason: "You cannot change your own administrative role or kick out your own account." };
  }

  if (actorRole === "root_admin") {
    return { allowed: true };
  }

  if (actorRole === "super_admin") {
    if (targetRole === "super_admin") {
      return { allowed: false, reason: "Super Admins cannot modify or kick out other Super Admins. Only Root Admin can." };
    }
    // Super admin can manage manager, author, user
    return { allowed: true };
  }

  return { allowed: false, reason: "You do not have administrative privilege to manage users." };
}
