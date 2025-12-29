import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";

export async function GET(
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

    if (ws.ownerId !== session.user.id) {
      const member = await db
        .select({ id: workspaceMember.id })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, workspaceId),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (member.length === 0) {
        return NextResponse.json(
          { error: "You don't have access to this workspace" },
          { status: 403 }
        );
      }
    }

    const owner = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, ws.ownerId))
      .limit(1);

    const members = await db
      .select({
        id: workspaceMember.id,
        userId: workspaceMember.userId,
        role: workspaceMember.role,
        createdAt: workspaceMember.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(workspaceMember)
      .innerJoin(user, eq(workspaceMember.userId, user.id))
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          ne(workspaceMember.userId, ws.ownerId)
        )
      )
      .orderBy(workspaceMember.createdAt);

    const memberMap = new Map<
      string,
      {
        id: string;
        userId: string;
        role: string;
        createdAt: string | null;
        user: {
          id: string;
          name: string;
          email: string;
          image: string | null;
        };
      }
    >();

    memberMap.set(ws.ownerId, {
      id: "owner",
      userId: ws.ownerId,
      role: "owner",
      createdAt: null,
      user: owner[0],
    });

    for (const m of members) {
      if (!memberMap.has(m.userId)) {
        memberMap.set(m.userId, {
          id: m.id,
          userId: m.userId,
          role: m.role,
          createdAt: m.createdAt ? m.createdAt.toISOString() : null,
          user: m.user,
        });
      }
    }

    const allMembers = Array.from(memberMap.values());

    return NextResponse.json({ members: allMembers });
  } catch (error) {
    safeError("Error fetching workspace members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
