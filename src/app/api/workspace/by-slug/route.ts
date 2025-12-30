import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Workspace slug is required" },
        { status: 400 }
      );
    }

    const workspaceData = await db
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

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const ws = workspaceData[0];

    let role: "owner" | "member" = "member";

    if (ws.ownerId === session.user.id) {
      role = "owner";
    } else {
      const member = await db
        .select({ role: workspaceMember.role })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, ws.id),
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

      role = member[0].role as "owner" | "member";
    }

    return NextResponse.json({
      workspace: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        description: ws.description,
        logo: ws.logo,
        role,
      },
    });
  } catch (error) {
    safeError("Error fetching workspace:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}
