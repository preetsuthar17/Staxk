import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { team, teamMember } from "@/db/schema/team";
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
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { workspaceSlug, name, identifier, description, icon, color } = body;

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
        { error: "Only workspace admins can create teams" },
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
            "Identifier must be 2-6 uppercase letters or numbers (e.g., ENG, DEV)",
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

    const existingTeam = await db
      .select({ identifier: team.identifier })
      .from(team)
      .where(
        and(
          eq(team.workspaceId, workspaceId),
          eq(team.identifier, normalizedIdentifier)
        )
      )
      .limit(1);

    if (existingTeam.length > 0) {
      return NextResponse.json(
        { error: "Team identifier is already taken in this workspace" },
        { status: 400 }
      );
    }

    const teamId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(team).values({
        id: teamId,
        name: trimmedName,
        identifier: normalizedIdentifier,
        description: trimmedDescription,
        icon: trimmedIcon,
        color: trimmedColor,
        workspaceId,
        createdById: userId,
      });

      await tx.insert(teamMember).values({
        id: memberId,
        teamId,
        userId,
        role: "lead",
      });
    });

    return NextResponse.json(
      {
        team: {
          id: teamId,
          name: trimmedName,
          identifier: normalizedIdentifier,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating team:", error);
    return ERRORS.SERVER_ERROR;
  }
}
