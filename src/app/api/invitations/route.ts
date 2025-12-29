import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, workspace, workspaceInvitation } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = userData[0].email;

    const invitations = await db
      .select({
        id: workspaceInvitation.id,
        workspaceId: workspaceInvitation.workspaceId,
        email: workspaceInvitation.email,
        status: workspaceInvitation.status,
        createdAt: workspaceInvitation.createdAt,
        expiresAt: workspaceInvitation.expiresAt,
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        },
        inviter: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(workspaceInvitation)
      .innerJoin(workspace, eq(workspaceInvitation.workspaceId, workspace.id))
      .innerJoin(user, eq(workspaceInvitation.invitedBy, user.id))
      .where(
        and(
          eq(workspaceInvitation.email, userEmail),
          eq(workspaceInvitation.status, "pending")
        )
      )
      .orderBy(workspaceInvitation.createdAt);

    const now = new Date();
    const validInvitations = invitations.filter((inv) => {
      if (!inv.expiresAt) {
        return true;
      }
      return new Date(inv.expiresAt) > now;
    });

    return NextResponse.json({ invitations: validInvitations });
  } catch (error) {
    safeError("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
