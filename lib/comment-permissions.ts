import type { UserRole } from "@/models/User";
import type { CommentDocument } from "@/models/Comment";

export interface CommentActor {
  id: string;
  role: UserRole;
  email: string;
}

export interface TargetCommentMeta {
  _id: string | unknown;
  authorId: string;
  authorRoleAtCreation?: UserRole;
  displayAsMelaTeam?: boolean;
  isDeleted?: boolean;
}

/**
 * Validates whether an actor can delete or take down a comment based on role hierarchy:
 * 1. Authors can always delete their own comment.
 * 2. Root Admin can take down ANY comment (including other admins).
 * 3. Super Admins can take down regular users' comments, but CANNOT take down other Super Admins' comments.
 * 4. Root Admin comments can ONLY be taken down by a Root Admin.
 */
export function canActorDeleteComment(
  actor: CommentActor,
  target: TargetCommentMeta
): { allowed: boolean; reason?: string } {
  if (target.isDeleted) {
    return { allowed: false, reason: "This comment has already been removed." };
  }

  const isAuthor = actor.id === target.authorId.toString();

  // Root Admin rules:
  // Root Admin can take down any comment at all
  if (actor.role === "root_admin") {
    return { allowed: true };
  }

  // If target comment was written by a root_admin, only a root_admin can take it down
  if (target.authorRoleAtCreation === "root_admin") {
    return {
      allowed: false,
      reason: "Root Administrator comments can only be taken down by a Root Administrator.",
    };
  }

  // Super Admin rules:
  if (actor.role === "super_admin") {
    // Super admin deleting their own comment (whether regular or posted as Mela Team)
    if (isAuthor) {
      return { allowed: true };
    }

    // Super admin cannot take down another Super Admin's comment
    if (target.authorRoleAtCreation === "super_admin") {
      return {
        allowed: false,
        reason:
          "Super Admins cannot take down comments posted by other Super Admins. Only a Root Administrator can.",
      };
    }

    // Super admin can take down regular user / author / manager comments
    return { allowed: true };
  }

  // Regular user / author / manager rules:
  // Can only delete their own comments
  if (isAuthor) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "You do not have permission to moderate or take down other members' comments.",
  };
}

/**
 * Only Super Admins and Root Admins can pin comments on a blog
 */
export function canActorPinComment(actor: CommentActor): boolean {
  return actor.role === "root_admin" || actor.role === "super_admin";
}

/**
 * Only Super Admins and Root Admins are allowed to post anonymously as 'Mela Team'
 */
export function canActorCommentAsMelaTeam(actor: CommentActor): boolean {
  return actor.role === "root_admin" || actor.role === "super_admin";
}
