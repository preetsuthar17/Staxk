import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;

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

    if (ws.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only workspace owners can remove members" },
        { status: 403 }
      );
    }

    const memberToRemove = await db
      .select({
        id: workspaceMember.id,
        userId: workspaceMember.userId,
      })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.id, memberId),
          eq(workspaceMember.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (memberToRemove.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (memberToRemove[0].userId === ws.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove workspace owner" },
        { status: 400 }
      );
    }

    await db
      .delete(workspaceMember)
      .where(
        and(
          eq(workspaceMember.id, memberId),
          eq(workspaceMember.workspaceId, workspaceId)
        )
      );

    return NextResponse.json({
      message: "Member removed successfully",
    });
  } catch (error) {
    safeError("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
