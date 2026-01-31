import { NextResponse } from "next/server";
import { getInvitationByToken } from "@/lib/invitation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "Invitation has expired", status: "expired" },
        { status: 410 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        {
          error: `Invitation has been ${invitation.status}`,
          status: invitation.status,
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        workspace: invitation.workspace,
        invitedBy: {
          name: invitation.invitedBy.name,
          image: invitation.invitedBy.image,
        },
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
