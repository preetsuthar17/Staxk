import { and, eq } from "drizzle-orm";
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

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  FORBIDDEN: NextResponse.json(
    { error: "You don't have permission to update this workspace" },
    { status: 403 }
  ),
  NOT_FOUND: NextResponse.json(
    { error: "Workspace not found" },
    { status: 404 }
  ),
  BAD_REQUEST: NextResponse.json(
    { error: "Invalid request" },
    { status: 400 }
  ),
  CONFLICT: NextResponse.json(
    { error: "Slug is already taken" },
    { status: 409 }
  ),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

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
    const [sessionData, { slug }] = await Promise.all([
      auth.api.getSession({ headers: request.headers }),
      params,
    ]);

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;
    const body = await request.json();
    const { name, slug: newSlug } = body;

    // Check if user is owner or admin of the workspace
    const [workspaceData] = await db
      .select({
        id: workspace.id,
        role: workspaceMember.role,
        currentSlug: workspace.slug,
      })
      .from(workspace)
      .innerJoin(workspaceMember, eq(workspace.id, workspaceMember.workspaceId))
      .where(
        and(eq(workspace.slug, slug), eq(workspaceMember.userId, userId))
      )
      .limit(1);

    if (!workspaceData) {
      return ERRORS.NOT_FOUND;
    }

    if (workspaceData.role !== "owner" && workspaceData.role !== "admin") {
      return ERRORS.FORBIDDEN;
    }

    const updateData: { name?: string; slug?: string } = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;
    }

    if (newSlug !== undefined) {
      const trimmedSlug = newSlug.trim().toLowerCase();
      const validationError = validateSlug(trimmedSlug);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      // Check if slug is different from current
      if (trimmedSlug !== workspaceData.currentSlug) {
        // Check if slug is available
        const existingWorkspace = await db
          .select({ slug: workspace.slug })
          .from(workspace)
          .where(eq(workspace.slug, trimmedSlug))
          .limit(1);

        if (existingWorkspace.length > 0) {
          return ERRORS.CONFLICT;
        }

        updateData.slug = trimmedSlug;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return ERRORS.BAD_REQUEST;
    }

    const [updatedWorkspace] = await db
      .update(workspace)
      .set(updateData)
      .where(eq(workspace.id, workspaceData.id))
      .returning({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo,
        description: workspace.description,
      });

    if (!updatedWorkspace) {
      return ERRORS.NOT_FOUND;
    }

    return NextResponse.json({ workspace: updatedWorkspace }, { status: 200 });
  } catch (error) {
    console.error("Error updating workspace:", error);
    return ERRORS.SERVER_ERROR;
  }
}

function validateSlug(slug: string): string | null {
  if (!slug) {
    return "Slug cannot be empty";
  }
  if (!SLUG_REGEX.test(slug)) {
    return "Slug can only contain letters, numbers, underscores, and hyphens";
  }
  if (slug.length < MIN_SLUG_LENGTH || slug.length > MAX_SLUG_LENGTH) {
    return `Slug must be between ${MIN_SLUG_LENGTH} and ${MAX_SLUG_LENGTH} characters`;
  }
  return null;
}
