import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { auth } from "./auth";

export interface WorkspaceAccess {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    ownerId: string;
  };
  role: "owner" | "member";
}

export async function getWorkspaceBySlug(slug: string): Promise<{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  ownerId: string;
} | null> {
  "use cache";
  const result = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      logo: workspace.logo,
      ownerId: workspace.ownerId,
    })
    .from(workspace)
    .where(eq(workspace.slug, slug))
    .limit(1);

  return result[0] || null;
}

export async function validateWorkspaceAccess(
  workspaceSlug: string,
  userId: string
): Promise<
  | { success: true; access: WorkspaceAccess }
  | { success: false; error: string; status: number }
> {
  "use cache";
  const workspaceData = await getWorkspaceBySlug(workspaceSlug);

  if (!workspaceData) {
    return { success: false, error: "Workspace not found", status: 404 };
  }

  if (workspaceData.ownerId === userId) {
    return {
      success: true,
      access: {
        workspace: workspaceData,
        role: "owner",
      },
    };
  }

  const member = await db
    .select({
      role: workspaceMember.role,
    })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceData.id),
        eq(workspaceMember.userId, userId)
      )
    )
    .limit(1);

  if (member.length === 0) {
    return {
      success: false,
      error: "You don't have access to this workspace",
      status: 403,
    };
  }

  return {
    success: true,
    access: {
      workspace: workspaceData,
      role: member[0].role as "owner" | "member",
    },
  };
}

export async function requireWorkspaceAccess(
  workspaceSlug: string
): Promise<WorkspaceAccess> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const validation = await validateWorkspaceAccess(
    workspaceSlug,
    session.user.id
  );

  if (!validation.success) {
    throw new Error(validation.error);
  }

  return validation.access;
}

export async function getWorkspaceAccess(
  workspaceSlug: string | null
): Promise<WorkspaceAccess | null> {
  if (!workspaceSlug) {
    return null;
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return null;
    }

    const validation = await validateWorkspaceAccess(
      workspaceSlug,
      session.user.id
    );

    if (!validation.success) {
      return null;
    }

    return validation.access;
  } catch {
    return null;
  }
}
