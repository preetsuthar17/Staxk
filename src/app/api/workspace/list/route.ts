import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [ownedWorkspaces, memberWorkspaces] = await Promise.all([
      db
        .select({
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          logo: workspace.logo,
          ownerId: workspace.ownerId,
        })
        .from(workspace)
        .where(eq(workspace.ownerId, session.user.id)),
      db
        .select({
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          logo: workspace.logo,
          role: workspaceMember.role,
          ownerId: workspace.ownerId,
        })
        .from(workspace)
        .innerJoin(
          workspaceMember,
          eq(workspaceMember.workspaceId, workspace.id)
        )
        .where(eq(workspaceMember.userId, session.user.id)),
    ]);

    const allWorkspaces = [
      ...ownedWorkspaces.map((ws) => ({ ...ws, role: "owner" as const })),
      ...memberWorkspaces,
    ];

    const workspaceMap = new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        logo: string | null;
        role: string;
      }
    >();

    for (const ws of allWorkspaces) {
      const existing = workspaceMap.get(ws.id);

      if (ws.ownerId === session.user.id) {
        workspaceMap.set(ws.id, {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          logo: ws.logo,
          role: "owner",
        });
      } else if (!existing && ws.role) {
        workspaceMap.set(ws.id, {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          logo: ws.logo,
          role: ws.role,
        });
      }
    }

    const workspaces = Array.from(workspaceMap.values());

    return NextResponse.json(
      { workspaces },
      {
        headers: {
          "Cache-Control": "private, max-age=60",
        },
      }
    );
  } catch (error) {
    safeError("Error listing workspaces:", error);
    return NextResponse.json(
      { error: "Failed to list workspaces" },
      { status: 500 }
    );
  }
}
