import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projectTeam } from "@/db/schema/project";
import { team } from "@/db/schema/team";
import { auth } from "@/lib/auth";
import { canManageProject, getProjectByIdentifier } from "@/lib/project";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  FORBIDDEN: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  NOT_FOUND: NextResponse.json({ error: "Project not found" }, { status: 404 }),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

interface RouteParams {
  params: Promise<{ identifier: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;
    const { identifier } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceSlug = searchParams.get("workspaceSlug");

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: "workspaceSlug query parameter is required" },
        { status: 400 }
      );
    }

    const projectData = await getProjectByIdentifier(
      workspaceSlug,
      identifier,
      userId
    );

    if (!projectData) {
      return ERRORS.NOT_FOUND;
    }

    const canManage = await canManageProject(projectData.id, userId);
    if (!canManage) {
      return ERRORS.FORBIDDEN;
    }

    let body: { teamIds?: string[] };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { teamIds } = body;

    if (!(teamIds && Array.isArray(teamIds)) || teamIds.length === 0) {
      return NextResponse.json(
        { error: "teamIds array is required" },
        { status: 400 }
      );
    }

    const validTeams = await db
      .select({ id: team.id })
      .from(team)
      .where(
        and(
          eq(team.workspaceId, projectData.workspaceId),
          inArray(team.id, teamIds)
        )
      );

    if (validTeams.length !== teamIds.length) {
      return NextResponse.json(
        { error: "One or more teams not found in this workspace" },
        { status: 400 }
      );
    }

    const existingAssignments = await db
      .select({ teamId: projectTeam.teamId })
      .from(projectTeam)
      .where(eq(projectTeam.projectId, projectData.id));

    const existingTeamIds = new Set(existingAssignments.map((a) => a.teamId));
    const newTeamIds = teamIds.filter((id) => !existingTeamIds.has(id));

    if (newTeamIds.length > 0) {
      await db.insert(projectTeam).values(
        newTeamIds.map((teamId) => ({
          id: crypto.randomUUID(),
          projectId: projectData.id,
          teamId,
        }))
      );
    }

    return NextResponse.json({
      added: newTeamIds.length,
      skipped: teamIds.length - newTeamIds.length,
    });
  } catch (error) {
    console.error("Error adding teams to project:", error);
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

    const userId = sessionData.user.id;
    const { identifier } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceSlug = searchParams.get("workspaceSlug");

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: "workspaceSlug query parameter is required" },
        { status: 400 }
      );
    }

    const projectData = await getProjectByIdentifier(
      workspaceSlug,
      identifier,
      userId
    );

    if (!projectData) {
      return ERRORS.NOT_FOUND;
    }

    const canManage = await canManageProject(projectData.id, userId);
    if (!canManage) {
      return ERRORS.FORBIDDEN;
    }

    let body: { teamIds?: string[] };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { teamIds } = body;

    if (!(teamIds && Array.isArray(teamIds)) || teamIds.length === 0) {
      return NextResponse.json(
        { error: "teamIds array is required" },
        { status: 400 }
      );
    }

    await db
      .delete(projectTeam)
      .where(
        and(
          eq(projectTeam.projectId, projectData.id),
          inArray(projectTeam.teamId, teamIds)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing teams from project:", error);
    return ERRORS.SERVER_ERROR;
  }
}
