import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";
import {
  canManageMembers,
  getWorkspaceMemberRole,
  getWorkspaceMembers,
  isWorkspaceOwner,
  removeMember,
  updateMemberRole,
} from "@/lib/member";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  FORBIDDEN: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  NOT_FOUND: NextResponse.json(
    { error: "Workspace not found" },
    { status: 404 }
  ),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const { slug } = await params;
    const userId = sessionData.user.id;

    const workspaceResult = await db
      .select({ id: workspace.id })
      .from(workspace)
      .innerJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, workspace.id),
          eq(workspaceMember.userId, userId)
        )
      )
      .where(eq(workspace.slug, slug))
      .limit(1);

    if (workspaceResult.length === 0) {
      return ERRORS.NOT_FOUND;
    }

    const members = await getWorkspaceMembers(workspaceResult[0].id);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    return ERRORS.SERVER_ERROR;
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const { slug } = await params;
    const userId = sessionData.user.id;

    let body: { userId?: string; role?: "admin" | "member" };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { userId: targetUserId, role } = body;

    if (!(targetUserId && role)) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    if (role !== "admin" && role !== "member") {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    const workspaceResult = await db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.slug, slug))
      .limit(1);

    if (workspaceResult.length === 0) {
      return ERRORS.NOT_FOUND;
    }

    const workspaceId = workspaceResult[0].id;

    const targetRole = await getWorkspaceMemberRole(workspaceId, targetUserId);
    if (targetRole === "owner") {
      return NextResponse.json(
        { error: "Cannot change the owner's role" },
        { status: 400 }
      );
    }

    if (role === "admin") {
      const ownerCheck = await isWorkspaceOwner(workspaceId, userId);
      if (!ownerCheck) {
        return NextResponse.json(
          { error: "Only the owner can assign admin role" },
          { status: 403 }
        );
      }
    } else {
      const canManage = await canManageMembers(workspaceId, userId);
      if (!canManage) {
        return ERRORS.FORBIDDEN;
      }
    }

    const success = await updateMemberRole(workspaceId, targetUserId, role);
    if (!success) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating member role:", error);
    return ERRORS.SERVER_ERROR;
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const { slug } = await params;
    const userId = sessionData.user.id;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const workspaceResult = await db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.slug, slug))
      .limit(1);

    if (workspaceResult.length === 0) {
      return ERRORS.NOT_FOUND;
    }

    const workspaceId = workspaceResult[0].id;

    const targetRole = await getWorkspaceMemberRole(workspaceId, targetUserId);
    if (targetRole === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the workspace owner" },
        { status: 400 }
      );
    }

    const isSelf = targetUserId === userId;
    if (!isSelf) {
      const canManage = await canManageMembers(workspaceId, userId);
      if (!canManage) {
        return ERRORS.FORBIDDEN;
      }
    }

    const success = await removeMember(workspaceId, targetUserId);
    if (!success) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return ERRORS.SERVER_ERROR;
  }
}
