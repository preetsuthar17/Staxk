import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";

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
  INVALID_REQUEST: NextResponse.json(
    { error: "Invalid request" },
    { status: 400 }
  ),
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
      name?: string;
      slug?: string;
      description?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, slug, description } = body;

    if (!(name && slug)) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase();
    const trimmedDescription = description?.trim() || null;

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

    if (
      !SLUG_REGEX.test(normalizedSlug) ||
      normalizedSlug.length < MIN_SLUG_LENGTH ||
      normalizedSlug.length > MAX_SLUG_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Slug must be between ${MIN_SLUG_LENGTH} and ${MAX_SLUG_LENGTH} characters and contain only letters, numbers, hyphens, and underscores`,
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

    const existingWorkspace = await db
      .select({ slug: workspace.slug })
      .from(workspace)
      .where(eq(workspace.slug, normalizedSlug))
      .limit(1);

    if (existingWorkspace.length > 0) {
      return NextResponse.json(
        { error: "Workspace slug is already taken" },
        { status: 400 }
      );
    }

    const workspaceId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(workspace).values({
        id: workspaceId,
        name: trimmedName,
        slug: normalizedSlug,
        description: trimmedDescription,
        ownerId: userId,
      });

      await tx.insert(workspaceMember).values({
        id: memberId,
        workspaceId,
        userId,
        role: "owner",
      });

      await tx
        .update(user)
        .set({ isOnboarded: true })
        .where(eq(user.id, userId));
    });

    return NextResponse.json(
      {
        workspace: {
          id: workspaceId,
          name: trimmedName,
          slug: normalizedSlug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating workspace:", error);
    return ERRORS.SERVER_ERROR;
  }
}
