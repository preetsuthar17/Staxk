import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserPendingInvitations } from "@/lib/invitation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await getUserPendingInvitations(sessionData.user.email);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
