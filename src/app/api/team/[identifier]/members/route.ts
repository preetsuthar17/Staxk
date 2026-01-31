import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { teamMember } from "@/db/schema/team";
import { workspaceMember } from "@/db/schema/workspace";
import { auth } from "@/lib/auth";
import {
  canManageTeam,
  getTeamByIdentifier,
  getTeamMembers,
  isTeamMember,
} from "@/lib/team";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const members = await getTeamMembers(teamData.id);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error getting team members:", error);
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
      userId?: string;
      role?: "lead" | "member";
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { userId: newMemberUserId, role = "member" } = body;

    if (!newMemberUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (role !== "lead" && role !== "member") {
      return NextResponse.json(
        { error: "role must be 'lead' or 'member'" },
        { status: 400 }
      );
    }

    const workspaceMemberResult = await db
      .select({ id: workspaceMember.id })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, teamData.workspaceId),
          eq(workspaceMember.userId, newMemberUserId)
        )
      )
      .limit(1);

    if (workspaceMemberResult.length === 0) {
      return NextResponse.json(
        { error: "User must be a workspace member to join a team" },
        { status: 400 }
      );
    }

    const alreadyMember = await isTeamMember(teamData.id, newMemberUserId);
    if (alreadyMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    const memberId = crypto.randomUUID();
    await db.insert(teamMember).values({
      id: memberId,
      teamId: teamData.id,
      userId: newMemberUserId,
      role,
    });

    return NextResponse.json(
      {
        member: {
          id: memberId,
          userId: newMemberUserId,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding team member:", error);
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
    const memberUserId = searchParams.get("userId");

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: "workspaceSlug query parameter is required" },
        { status: 400 }
      );
    }

    if (!memberUserId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
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

    const isSelf = memberUserId === userId;
    if (!isSelf) {
      const canManage = await canManageTeam(teamData.id, userId);
      if (!canManage) {
        return ERRORS.FORBIDDEN;
      }
    }

    const memberExists = await isTeamMember(teamData.id, memberUserId);
    if (!memberExists) {
      return NextResponse.json(
        { error: "User is not a team member" },
        { status: 400 }
      );
    }

    await db
      .delete(teamMember)
      .where(
        and(
          eq(teamMember.teamId, teamData.id),
          eq(teamMember.userId, memberUserId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return ERRORS.SERVER_ERROR;
  }
}
