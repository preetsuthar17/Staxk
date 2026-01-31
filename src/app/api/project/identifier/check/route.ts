import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { project } from "@/db/schema/project";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const IDENTIFIER_REGEX = /^[A-Z0-9]{2,6}$/;

export async function GET(request: Request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionData.user.id;
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");
    const workspaceSlug = searchParams.get("workspaceSlug");
    const excludeProjectId = searchParams.get("excludeProjectId");

    if (!(identifier && workspaceSlug)) {
      return NextResponse.json(
        { error: "identifier and workspaceSlug are required" },
        { status: 400 }
      );
    }

    const normalizedIdentifier = identifier.trim().toUpperCase();

    if (!IDENTIFIER_REGEX.test(normalizedIdentifier)) {
      return NextResponse.json({
        available: false,
        reason: "Invalid format. Use 2-6 uppercase letters or numbers.",
      });
    }

    const workspaceResult = await db
      .select({
        id: workspace.id,
      })
      .from(workspace)
      .innerJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, workspace.id),
          eq(workspaceMember.userId, userId)
        )
      )
      .where(eq(workspace.slug, workspaceSlug))
      .limit(1);

    if (workspaceResult.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    const { id: workspaceId } = workspaceResult[0];

    const conditions = [
      eq(project.workspaceId, workspaceId),
      eq(project.identifier, normalizedIdentifier),
    ];

    if (excludeProjectId) {
      conditions.push(ne(project.id, excludeProjectId));
    }

    const existingProject = await db
      .select({ id: project.id })
      .from(project)
      .where(and(...conditions))
      .limit(1);

    return NextResponse.json({
      available: existingProject.length === 0,
    });
  } catch (error) {
    console.error("Error checking project identifier:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
