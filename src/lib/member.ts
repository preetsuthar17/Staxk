import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { workspaceMember } from "@/db/schema/workspace";

export interface WorkspaceMemberData {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMemberData[]> {
  const results = await db
    .select({
      id: workspaceMember.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: workspaceMember.role,
      joinedAt: workspaceMember.createdAt,
    })
    .from(workspaceMember)
    .innerJoin(user, eq(workspaceMember.userId, user.id))
    .where(eq(workspaceMember.workspaceId, workspaceId))
    .orderBy(asc(workspaceMember.createdAt));

  return results;
}

export async function getWorkspaceMemberRole(
  workspaceId: string,
  userId: string
): Promise<"owner" | "admin" | "member" | null> {
  const results = await db
    .select({ role: workspaceMember.role })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .limit(1);

  return results[0]?.role ?? null;
}

export async function canManageMembers(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const role = await getWorkspaceMemberRole(workspaceId, userId);
  return role === "owner" || role === "admin";
}

export async function isWorkspaceOwner(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const role = await getWorkspaceMemberRole(workspaceId, userId);
  return role === "owner";
}

export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  newRole: "admin" | "member"
): Promise<boolean> {
  const result = await db
    .update(workspaceMember)
    .set({ role: newRole })
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, targetUserId)
      )
    )
    .returning({ id: workspaceMember.id });

  return result.length > 0;
}

export async function removeMember(
  workspaceId: string,
  targetUserId: string
): Promise<boolean> {
  const result = await db
    .delete(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, targetUserId)
      )
    )
    .returning({ id: workspaceMember.id });

  return result.length > 0;
}
