import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { acceptInvitation } from "@/lib/invitation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const userId = sessionData.user.id;

    const result = await acceptInvitation(token, userId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      workspaceSlug: result.workspaceSlug,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
