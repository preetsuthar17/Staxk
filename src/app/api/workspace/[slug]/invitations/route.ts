import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";
import {
  createInvitation,
  getWorkspaceInvitations,
  revokeInvitation,
} from "@/lib/invitation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  FORBIDDEN: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  NOT_FOUND: NextResponse.json(
    { error: "Workspace not found" },
    { status: 404 }
  ),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const { slug } = await params;
    const userId = sessionData.user.id;

    const workspaceResult = await db
      .select({ id: workspace.id, role: workspaceMember.role })
      .from(workspace)
      .innerJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, workspace.id),
          eq(workspaceMember.userId, userId)
        )
      )
      .where(eq(workspace.slug, slug))
      .limit(1);

    if (workspaceResult.length === 0) {
      return ERRORS.NOT_FOUND;
    }

    const { id: workspaceId, role } = workspaceResult[0];

    if (role !== "owner" && role !== "admin") {
      return ERRORS.FORBIDDEN;
    }

    const invitations = await getWorkspaceInvitations(workspaceId);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return ERRORS.SERVER_ERROR;
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const { slug } = await params;
    const userId = sessionData.user.id;

    let body: { email?: string; role?: "admin" | "member" };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { email, role = "member" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (role !== "admin" && role !== "member") {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    const workspaceResult = await db
      .select({ id: workspace.id, role: workspaceMember.role })
      .from(workspace)
      .innerJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, workspace.id),
          eq(workspaceMember.userId, userId)
        )
      )
      .where(eq(workspace.slug, slug))
      .limit(1);

    if (workspaceResult.length === 0) {
      return ERRORS.NOT_FOUND;
    }

    const { id: workspaceId, role: userRole } = workspaceResult[0];

    if (userRole !== "owner" && userRole !== "admin") {
      return ERRORS.FORBIDDEN;
    }

    const result = await createInvitation({
      workspaceId,
      email,
      role,
      invitedById: userId,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { invitation: { id: result.id, token: result.token } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invitation:", error);
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

    const { slug } = await params;
    const userId = sessionData.user.id;
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("id");

    if (!invitationId) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const workspaceResult = await db
      .select({ id: workspace.id, role: workspaceMember.role })
      .from(workspace)
      .innerJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, workspace.id),
          eq(workspaceMember.userId, userId)
        )
      )
      .where(eq(workspace.slug, slug))
      .limit(1);

    if (workspaceResult.length === 0) {
      return ERRORS.NOT_FOUND;
    }

    const { id: workspaceId, role } = workspaceResult[0];

    if (role !== "owner" && role !== "admin") {
      return ERRORS.FORBIDDEN;
    }

    const success = await revokeInvitation(invitationId, workspaceId);
    if (!success) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invitation:", error);
    return ERRORS.SERVER_ERROR;
  }
}
