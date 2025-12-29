import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";
import { validateWorkspaceAccess } from "@/lib/workspace-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    const workspaceData = await db
      .select({
        id: workspace.id,
        slug: workspace.slug,
        ownerId: workspace.ownerId,
      })
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const ws = workspaceData[0];

    if (ws.ownerId === session.user.id) {
      return NextResponse.json(
        { error: "Workspace owners cannot leave their own workspace" },
        { status: 400 }
      );
    }

    const accessCheck = await validateWorkspaceAccess(ws.slug, session.user.id);
    if (!accessCheck.success) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    if (accessCheck.access.role === "owner") {
      return NextResponse.json(
        { error: "Workspace owners cannot leave their own workspace" },
        { status: 400 }
      );
    }

    await db
      .delete(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      );

    return NextResponse.json({
      message: "Successfully left the workspace",
    });
  } catch (error) {
    safeError("Error leaving workspace:", error);
    return NextResponse.json(
      { error: "Failed to leave workspace" },
      { status: 500 }
    );
  }
}
