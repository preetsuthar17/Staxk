import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";
import { getWorkspaceTeams } from "@/lib/team";

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

export async function GET(request: Request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;
    const { searchParams } = new URL(request.url);
    const workspaceSlug = searchParams.get("workspaceSlug");

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: "workspaceSlug query parameter is required" },
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

    const teams = await getWorkspaceTeams(workspaceId, userId);

    return NextResponse.json(
      { teams },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error listing teams:", error);
    return ERRORS.SERVER_ERROR;
  }
}
