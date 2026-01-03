import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace } from "@/db/schema/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const excludeWorkspaceId = searchParams.get("excludeWorkspaceId");

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const normalizedSlug = slug.trim().toLowerCase();

  if (
    !SLUG_REGEX.test(normalizedSlug) ||
    normalizedSlug.length < MIN_SLUG_LENGTH ||
    normalizedSlug.length > MAX_SLUG_LENGTH
  ) {
    return NextResponse.json({ available: false });
  }

  try {
    const conditions = [eq(workspace.slug, normalizedSlug)];
    if (excludeWorkspaceId) {
      conditions.push(ne(workspace.id, excludeWorkspaceId));
    }

    const existingWorkspace = await db
      .select({ slug: workspace.slug })
      .from(workspace)
      .where(and(...conditions))
      .limit(1);

    return NextResponse.json({
      available: existingWorkspace.length === 0,
    });
  } catch (error) {
    console.error("Error checking workspace slug availability:", error);
    return NextResponse.json(
      { error: "Failed to check workspace slug availability" },
      { status: 500 }
    );
  }
}
