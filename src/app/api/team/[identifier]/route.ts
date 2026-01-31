import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { team } from "@/db/schema/team";
import { auth } from "@/lib/auth";
import { canManageTeam, getTeamByIdentifier } from "@/lib/team";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const IDENTIFIER_REGEX = /^[A-Z0-9]{2,6}$/;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  FORBIDDEN: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  NOT_FOUND: NextResponse.json({ error: "Team not found" }, { status: 404 }),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

interface RouteParams {
  params: Promise<{ identifier: string }>;
}

interface TeamPatchBody {
  name?: string;
  identifier?: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface TeamDataForPatch {
  id: string;
  workspaceId: string;
  name: string;
  identifier: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

async function validateTeamPatchBody(
  body: TeamPatchBody,
  teamData: TeamDataForPatch
): Promise<NextResponse | { updates: Record<string, string | null> }> {
  const updates: Record<string, string | null> = {};

  if (body.name !== undefined) {
    const trimmedName = body.name.trim();
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
    updates.name = trimmedName;
  }

  if (body.identifier !== undefined) {
    const normalizedIdentifier = body.identifier.trim().toUpperCase();
    if (!IDENTIFIER_REGEX.test(normalizedIdentifier)) {
      return NextResponse.json(
        {
          error:
            "Identifier must be 2-6 uppercase letters or numbers (e.g., ENG, DEV)",
        },
        { status: 400 }
      );
    }

    const existingTeam = await db
      .select({ id: team.id })
      .from(team)
      .where(
        and(
          eq(team.workspaceId, teamData.workspaceId),
          eq(team.identifier, normalizedIdentifier),
          ne(team.id, teamData.id)
        )
      )
      .limit(1);

    if (existingTeam.length > 0) {
      return NextResponse.json(
        { error: "Team identifier is already taken in this workspace" },
        { status: 400 }
      );
    }

    updates.identifier = normalizedIdentifier;
  }

  if (body.description !== undefined) {
    const trimmedDescription = body.description.trim() || null;
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
    updates.description = trimmedDescription;
  }

  if (body.icon !== undefined) {
    updates.icon = body.icon.trim() || null;
  }

  if (body.color !== undefined) {
    updates.color = body.color.trim() || null;
  }

  return { updates };
}

export async function GET(request: Request, { params }: RouteParams) {
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

    const teamData = await getTeamByIdentifier(
      workspaceSlug,
      identifier,
      userId
    );

    if (!teamData) {
      return ERRORS.NOT_FOUND;
    }

    return NextResponse.json({
      team: {
        id: teamData.id,
        name: teamData.name,
        identifier: teamData.identifier,
        description: teamData.description,
        icon: teamData.icon,
        color: teamData.color,
        memberCount: teamData.memberCount,
        userRole: teamData.userRole,
      },
    });
  } catch (error) {
    console.error("Error getting team:", error);
    return ERRORS.SERVER_ERROR;
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
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

    const teamData = await getTeamByIdentifier(
      workspaceSlug,
      identifier,
      userId
    );

    if (!teamData) {
      return ERRORS.NOT_FOUND;
    }

    const canManage = await canManageTeam(teamData.id, userId);
    if (!canManage) {
      return ERRORS.FORBIDDEN;
    }

    let body: {
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

    const validated = await validateTeamPatchBody(body, {
      id: teamData.id,
      workspaceId: teamData.workspaceId,
      name: teamData.name,
      identifier: teamData.identifier,
      description: teamData.description,
      icon: teamData.icon,
      color: teamData.color,
    });

    if (validated instanceof NextResponse) {
      return validated;
    }

    const { updates } = validated;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await db.update(team).set(updates).where(eq(team.id, teamData.id));

    return NextResponse.json({
      team: {
        id: teamData.id,
        name: updates.name ?? teamData.name,
        identifier: updates.identifier ?? teamData.identifier,
        description:
          updates.description !== undefined
            ? updates.description
            : teamData.description,
        icon: updates.icon !== undefined ? updates.icon : teamData.icon,
        color: updates.color !== undefined ? updates.color : teamData.color,
      },
    });
  } catch (error) {
    console.error("Error updating team:", error);
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

    const teamData = await getTeamByIdentifier(
      workspaceSlug,
      identifier,
      userId
    );

    if (!teamData) {
      return ERRORS.NOT_FOUND;
    }

    const canManage = await canManageTeam(teamData.id, userId);
    if (!canManage) {
      return ERRORS.FORBIDDEN;
    }

    await db.delete(team).where(eq(team.id, teamData.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return ERRORS.SERVER_ERROR;
  }
}
