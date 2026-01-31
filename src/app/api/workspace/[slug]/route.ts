import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  NOT_FOUND: NextResponse.json(
    { error: "Workspace not found" },
    { status: 404 }
  ),
  FORBIDDEN: NextResponse.json(
    { error: "You don't have permission to update this workspace" },
    { status: 403 }
  ),
  INVALID_BODY: NextResponse.json(
    { error: "Invalid request body" },
    { status: 400 }
  ),
  INVALID_NAME: NextResponse.json(
    {
      error: `Name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`,
    },
    { status: 400 }
  ),
  INVALID_SLUG: NextResponse.json(
    {
      error: `Slug must be between ${MIN_SLUG_LENGTH} and ${MAX_SLUG_LENGTH} characters and contain only letters, numbers, hyphens, and underscores`,
    },
    { status: 400 }
  ),
  SLUG_TAKEN: NextResponse.json(
    { error: "Workspace slug is already taken" },
    { status: 400 }
  ),
  INVALID_DESCRIPTION: NextResponse.json(
    {
      error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`,
    },
    { status: 400 }
  ),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

interface WorkspacePatchBody {
  name?: string;
  slug?: string;
  description?: string;
}

interface WorkspaceDataForPatch {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

async function validateWorkspacePatchBody(
  body: WorkspacePatchBody,
  workspaceData: WorkspaceDataForPatch
): Promise<
  | NextResponse
  | { updateData: Record<string, string | null>; hasChanges: boolean }
> {
  const updateData: Record<string, string | null> = {};
  let hasChanges = false;

  if (body.name !== undefined) {
    const nameResult = validateWorkspaceName(body.name, workspaceData.name);
    if (nameResult instanceof NextResponse) {
      return nameResult;
    }
    if (nameResult !== null) {
      updateData.name = nameResult;
      hasChanges = true;
    }
  }

  if (body.slug !== undefined) {
    const slugResult = await validateWorkspaceSlug(
      body.slug,
      workspaceData.slug,
      workspaceData.id
    );
    if (slugResult instanceof NextResponse) {
      return slugResult;
    }
    if (slugResult !== null) {
      updateData.slug = slugResult;
      hasChanges = true;
    }
  }

  if (body.description !== undefined) {
    const trimmedDescription = body.description.trim() || null;
    if (
      trimmedDescription &&
      trimmedDescription.length > MAX_DESCRIPTION_LENGTH
    ) {
      return ERRORS.INVALID_DESCRIPTION as NextResponse;
    }
    if (trimmedDescription !== workspaceData.description) {
      updateData.description = trimmedDescription;
      hasChanges = true;
    }
  }

  return { updateData, hasChanges };
}

async function validateWorkspaceSlug(
  rawSlug: string,
  currentSlug: string,
  workspaceId: string
): Promise<NextResponse | string | null> {
  const normalizedSlug = rawSlug.trim().toLowerCase();
  if (
    !SLUG_REGEX.test(normalizedSlug) ||
    normalizedSlug.length < MIN_SLUG_LENGTH ||
    normalizedSlug.length > MAX_SLUG_LENGTH
  ) {
    return ERRORS.INVALID_SLUG as NextResponse;
  }
  if (normalizedSlug === currentSlug) {
    return null;
  }
  const existingWorkspace = await db
    .select({ slug: workspace.slug })
    .from(workspace)
    .where(
      and(eq(workspace.slug, normalizedSlug), ne(workspace.id, workspaceId))
    )
    .limit(1);
  if (existingWorkspace.length > 0) {
    return ERRORS.SLUG_TAKEN as NextResponse;
  }
  return normalizedSlug;
}

function validateWorkspaceName(
  rawName: string,
  currentName: string
): NextResponse | string | null {
  const trimmedName = rawName.trim();
  if (
    trimmedName.length < MIN_NAME_LENGTH ||
    trimmedName.length > MAX_NAME_LENGTH
  ) {
    return ERRORS.INVALID_NAME as NextResponse;
  }
  return trimmedName !== currentName ? trimmedName : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const { slug } = await params;
    const userId = sessionData.user.id;

    const workspace = await getWorkspaceBySlug(slug, userId);

    if (!workspace) {
      return ERRORS.NOT_FOUND;
    }

    return NextResponse.json({ workspace }, { status: 200 });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return ERRORS.SERVER_ERROR;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const [body, session] = await Promise.all([
      request.json().catch(() => null),
      auth.api.getSession({ headers: request.headers }),
    ]);

    if (!session?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    if (!body) {
      return ERRORS.INVALID_BODY;
    }

    const { slug } = await params;
    const userId = session.user.id;

    const [workspaceData] = await db
      .select({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        role: workspaceMember.role,
      })
      .from(workspace)
      .innerJoin(workspaceMember, eq(workspace.id, workspaceMember.workspaceId))
      .where(and(eq(workspace.slug, slug), eq(workspaceMember.userId, userId)))
      .limit(1);

    if (!workspaceData) {
      return ERRORS.NOT_FOUND;
    }

    if (workspaceData.role !== "owner" && workspaceData.role !== "admin") {
      return ERRORS.FORBIDDEN;
    }

    const validated = await validateWorkspacePatchBody(body, {
      id: workspaceData.id,
      name: workspaceData.name,
      slug: workspaceData.slug,
      description: workspaceData.description,
    });

    if (validated instanceof NextResponse) {
      return validated;
    }

    const { updateData, hasChanges } = validated;

    if (!hasChanges || Object.keys(updateData).length === 0) {
      const currentWorkspace = await getWorkspaceBySlug(slug, userId);
      return NextResponse.json(
        { workspace: currentWorkspace },
        { status: 200 }
      );
    }

    const [updatedWorkspace] = await db
      .update(workspace)
      .set(updateData)
      .where(eq(workspace.id, workspaceData.id))
      .returning({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        logo: workspace.logo,
      });

    if (!updatedWorkspace) {
      return ERRORS.SERVER_ERROR;
    }

    return NextResponse.json(
      {
        workspace: {
          ...updatedWorkspace,
          role: workspaceData.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating workspace:", error);
    return ERRORS.SERVER_ERROR;
  }
}
