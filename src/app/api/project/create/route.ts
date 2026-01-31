import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { project, projectTeam } from "@/db/schema/project";
import { team } from "@/db/schema/team";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const IDENTIFIER_REGEX = /^[A-Z0-9]{2,6}$/;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  FORBIDDEN: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

export async function POST(request: Request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;

    let body: {
      workspaceSlug?: string;
      name?: string;
      identifier?: string;
      description?: string;
      icon?: string;
      color?: string;
      status?: "active" | "archived" | "completed";
      teamIds?: string[];
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      workspaceSlug,
      name,
      identifier,
      description,
      icon,
      color,
      status = "active",
      teamIds = [],
    } = body;

    if (!(workspaceSlug && name && identifier)) {
      return NextResponse.json(
        { error: "Workspace slug, name, and identifier are required" },
        { status: 400 }
      );
    }

    const workspaceResult = await db
      .select({
        id: workspace.id,
        role: workspaceMember.role,
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
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const { id: workspaceId, role: workspaceRole } = workspaceResult[0];

    if (workspaceRole !== "owner" && workspaceRole !== "admin") {
      return NextResponse.json(
        { error: "Only workspace admins can create projects" },
        { status: 403 }
      );
    }

    const trimmedName = name.trim();
    const normalizedIdentifier = identifier.trim().toUpperCase();
    const trimmedDescription = description?.trim() || null;
    const trimmedIcon = icon?.trim() || null;
    const trimmedColor = color?.trim() || null;

    if (
      trimmedName.length < MIN_NAME_LENGTH ||
      trimmedName.length > MAX_NAME_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    if (!IDENTIFIER_REGEX.test(normalizedIdentifier)) {
      return NextResponse.json(
        {
          error:
            "Identifier must be 2-6 uppercase letters or numbers (e.g., PROJ, WEB)",
        },
        { status: 400 }
      );
    }

    if (
      trimmedDescription &&
      trimmedDescription.length > MAX_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    if (!["active", "archived", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be active, archived, or completed" },
        { status: 400 }
      );
    }

    const existingProject = await db
      .select({ identifier: project.identifier })
      .from(project)
      .where(
        and(
          eq(project.workspaceId, workspaceId),
          eq(project.identifier, normalizedIdentifier)
        )
      )
      .limit(1);

    if (existingProject.length > 0) {
      return NextResponse.json(
        { error: "Project identifier is already taken in this workspace" },
        { status: 400 }
      );
    }

    if (teamIds.length > 0) {
      const validTeams = await db
        .select({ id: team.id })
        .from(team)
        .where(
          and(eq(team.workspaceId, workspaceId), inArray(team.id, teamIds))
        );

      if (validTeams.length !== teamIds.length) {
        return NextResponse.json(
          { error: "One or more teams not found in this workspace" },
          { status: 400 }
        );
      }
    }

    const projectId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(project).values({
        id: projectId,
        name: trimmedName,
        identifier: normalizedIdentifier,
        description: trimmedDescription,
        icon: trimmedIcon,
        color: trimmedColor,
        status,
        workspaceId,
        createdById: userId,
      });

      if (teamIds.length > 0) {
        await tx.insert(projectTeam).values(
          teamIds.map((teamId) => ({
            id: crypto.randomUUID(),
            projectId,
            teamId,
          }))
        );
      }
    });

    return NextResponse.json(
      {
        project: {
          id: projectId,
          name: trimmedName,
          identifier: normalizedIdentifier,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return ERRORS.SERVER_ERROR;
  }
}
