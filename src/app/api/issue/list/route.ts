import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { project } from "@/db/schema/project";
import { team } from "@/db/schema/team";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";
import {
  getProjectIssues,
  getTeamIssues,
  getWorkspaceIssues,
} from "@/lib/issue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const workspaceSlug = searchParams.get("workspaceSlug");
    const projectIdentifier = searchParams.get("projectIdentifier");
    const teamIdentifier = searchParams.get("teamIdentifier");

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: "workspaceSlug is required" },
        { status: 400 }
      );
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

    if (projectIdentifier) {
      const projectResult = await db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.workspaceId, workspaceId),
            eq(project.identifier, projectIdentifier)
          )
        )
        .limit(1);

      if (projectResult.length === 0) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      const issues = await getProjectIssues(projectResult[0].id);
      return NextResponse.json({ issues });
    }

    if (teamIdentifier) {
      const teamResult = await db
        .select({ id: team.id })
        .from(team)
        .where(
          and(
            eq(team.workspaceId, workspaceId),
            eq(team.identifier, teamIdentifier)
          )
        )
        .limit(1);

      if (teamResult.length === 0) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      const issues = await getTeamIssues(teamResult[0].id);
      return NextResponse.json({ issues });
    }

    const issues = await getWorkspaceIssues(workspaceId);
    return NextResponse.json({ issues });
  } catch (error) {
    console.error("Error listing issues:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
