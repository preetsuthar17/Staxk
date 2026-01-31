import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { project } from "@/db/schema/project";
import { auth } from "@/lib/auth";
import { canManageProject, getProjectByIdentifier } from "@/lib/project";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const IDENTIFIER_REGEX = /^[A-Z0-9]{2,6}$/;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

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

interface ProjectPatchBody {
  name?: string;
  identifier?: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: "active" | "archived" | "completed";
}

interface ProjectDataForPatch {
  id: string;
  workspaceId: string;
  name: string;
  identifier: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: string;
}

async function validateProjectPatchBody(
  body: ProjectPatchBody,
  projectData: ProjectDataForPatch
): Promise<NextResponse | { updates: Record<string, string | null> }> {
  const updates: Record<string, string | null> = {};

  if (body.name !== undefined) {
    const nameError = validateProjectName(body.name);
    if (nameError) {
      return nameError;
    }
    updates.name = body.name.trim();
  }

  if (body.identifier !== undefined) {
    const normalizedIdentifier = body.identifier.trim().toUpperCase();
    if (!IDENTIFIER_REGEX.test(normalizedIdentifier)) {
      return NextResponse.json(
        {
          error:
            "Identifier must be 2-6 uppercase letters or numbers (e.g., PROJ, WEB)",
        },
        { status: 400 }
      );
    }

    const existingProject = await db
      .select({ id: project.id })
      .from(project)
      .where(
        and(
          eq(project.workspaceId, projectData.workspaceId),
          eq(project.identifier, normalizedIdentifier),
          ne(project.id, projectData.id)
        )
      )
      .limit(1);

    if (existingProject.length > 0) {
      return NextResponse.json(
        { error: "Project identifier is already taken in this workspace" },
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

  if (body.status !== undefined) {
    const statusError = validateProjectStatus(body.status);
    if (statusError) {
      return statusError;
    }
    updates.status = body.status;
  }

  return { updates };
}

function validateProjectName(name: string): NextResponse | null {
  const trimmed = name.trim();
  if (trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      {
        error: `Name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`,
      },
      { status: 400 }
    );
  }
  return null;
}

function validateProjectStatus(status: string): NextResponse | null {
  if (!["active", "archived", "completed"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be active, archived, or completed" },
      { status: 400 }
    );
  }
  return null;
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

    const projectData = await getProjectByIdentifier(
      workspaceSlug,
      identifier,
      userId
    );

    if (!projectData) {
      return ERRORS.NOT_FOUND;
    }

    return NextResponse.json({
      project: {
        id: projectData.id,
        name: projectData.name,
        identifier: projectData.identifier,
        description: projectData.description,
        icon: projectData.icon,
        color: projectData.color,
        status: projectData.status,
        teamCount: projectData.teamCount,
        teams: projectData.teams,
      },
    });
  } catch (error) {
    console.error("Error getting project:", error);
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

    let body: {
      name?: string;
      identifier?: string;
      description?: string;
      icon?: string;
      color?: string;
      status?: "active" | "archived" | "completed";
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validated = await validateProjectPatchBody(body, {
      id: projectData.id,
      workspaceId: projectData.workspaceId,
      name: projectData.name,
      identifier: projectData.identifier,
      description: projectData.description,
      icon: projectData.icon,
      color: projectData.color,
      status: projectData.status,
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

    await db.update(project).set(updates).where(eq(project.id, projectData.id));

    return NextResponse.json({
      project: {
        id: projectData.id,
        name: updates.name ?? projectData.name,
        identifier: updates.identifier ?? projectData.identifier,
        description:
          updates.description !== undefined
            ? updates.description
            : projectData.description,
        icon: updates.icon !== undefined ? updates.icon : projectData.icon,
        color: updates.color !== undefined ? updates.color : projectData.color,
        status: updates.status ?? projectData.status,
      },
    });
  } catch (error) {
    console.error("Error updating project:", error);
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

    await db.delete(project).where(eq(project.id, projectData.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return ERRORS.SERVER_ERROR;
  }
}
