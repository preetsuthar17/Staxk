import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema/workspace";

export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  role: "owner" | "admin" | "member";
}

/**
 * Get all workspaces for a user.
 * Uses indexed userId query with join to workspace table.
 * Only selects required fields for optimal performance.
 */
export async function getUserWorkspaces(
  userId: string
): Promise<WorkspaceData[]> {
  const results = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      logo: workspace.logo,
      role: workspaceMember.role,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
    .where(eq(workspaceMember.userId, userId))
    .orderBy(asc(workspace.createdAt));

  return results;
}

/**
 * Get workspace by slug with membership verification.
 * Uses indexed slug and userId for optimal performance.
 * Returns null if workspace doesn't exist or user isn't a member.
 */
export async function getWorkspaceBySlug(
  slug: string,
  userId: string
): Promise<WorkspaceData | null> {
  const results = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      logo: workspace.logo,
      role: workspaceMember.role,
    })
    .from(workspace)
    .innerJoin(workspaceMember, eq(workspace.id, workspaceMember.workspaceId))
    .where(and(eq(workspace.slug, slug), eq(workspaceMember.userId, userId)))
    .limit(1);

  return results[0] || null;
}

/**
 * Get user's default (first) workspace.
 * Returns the earliest created workspace for the user.
 * Uses indexed userId query with limit 1 for optimal performance.
 */
export async function getUserDefaultWorkspace(
  userId: string
): Promise<WorkspaceData | null> {
  const results = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      logo: workspace.logo,
      role: workspaceMember.role,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
    .where(eq(workspaceMember.userId, userId))
    .orderBy(asc(workspace.createdAt))
    .limit(1);

  return results[0] || null;
}
