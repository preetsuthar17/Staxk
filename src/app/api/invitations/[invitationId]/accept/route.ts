import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, workspaceInvitation, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationId } = await params;

    const invitation = await db
      .select({
        id: workspaceInvitation.id,
        workspaceId: workspaceInvitation.workspaceId,
        email: workspaceInvitation.email,
        status: workspaceInvitation.status,
        expiresAt: workspaceInvitation.expiresAt,
      })
      .from(workspaceInvitation)
      .where(eq(workspaceInvitation.id, invitationId))
      .limit(1);

    if (invitation.length === 0) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    const inv = invitation[0];

    const [userData, existingMember] = await Promise.all([
      db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1),
      db
        .select({ id: workspaceMember.id })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, inv.workspaceId),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1),
    ]);

    if (userData.length === 0 || userData[0].email !== inv.email) {
      return NextResponse.json(
        { error: "This invitation is not for you" },
        { status: 403 }
      );
    }

    if (inv.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation has already been processed" },
        { status: 400 }
      );
    }

    if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    if (existingMember.length > 0) {
      await db
        .update(workspaceInvitation)
        .set({ status: "accepted" })
        .where(eq(workspaceInvitation.id, invitationId));

      return NextResponse.json({
        message: "You are already a member of this workspace",
        workspaceId: inv.workspaceId,
      });
    }

    const memberId = crypto.randomUUID();
    await db.insert(workspaceMember).values({
      id: memberId,
      workspaceId: inv.workspaceId,
      userId: session.user.id,
      role: "member",
    });

    await db
      .update(workspaceInvitation)
      .set({ status: "accepted" })
      .where(eq(workspaceInvitation.id, invitationId));

    return NextResponse.json({
      message: "Invitation accepted successfully",
      workspaceId: inv.workspaceId,
    });
  } catch (error) {
    safeError("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
