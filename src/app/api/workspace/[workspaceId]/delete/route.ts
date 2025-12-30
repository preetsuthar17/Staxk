import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";
import { checkRateLimit, createRateLimitKey } from "@/lib/rate-limit";

async function getWorkspaceAndVerifyOwnership(
  workspaceId: string,
  userId: string
): Promise<
  | {
      success: true;
      workspace: { id: string; name: string; slug: string; ownerId: string };
    }
  | { success: false; error: string; status: number }
> {
  const workspaceData = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId,
    })
    .from(workspace)
    .where(eq(workspace.id, workspaceId))
    .limit(1);

  if (workspaceData.length === 0) {
    return { success: false, error: "Workspace not found", status: 404 };
  }

  const ws = workspaceData[0];

  if (ws.ownerId !== userId) {
    return {
      success: false,
      error: "Only workspace owners can delete workspaces",
      status: 403,
    };
  }

  return { success: true, workspace: ws };
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitKey = createRateLimitKey(
      session.user.id,
      "workspace-delete"
    );
    const rateLimitResult = await checkRateLimit(rateLimitKey, {
      window: 300,
      max: 3,
    });

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    const { workspaceId } = await params;

    const workspaceCheck = await getWorkspaceAndVerifyOwnership(
      workspaceId,
      session.user.id
    );

    if (!workspaceCheck.success) {
      return NextResponse.json(
        { error: workspaceCheck.error },
        { status: workspaceCheck.status }
      );
    }

    await db.delete(workspace).where(eq(workspace.id, workspaceId));

    return NextResponse.json({
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    safeError("Error deleting workspace:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}
