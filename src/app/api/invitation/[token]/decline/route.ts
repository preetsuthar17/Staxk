import { NextResponse } from "next/server";
import { declineInvitation } from "@/lib/invitation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    const success = await declineInvitation(token);

    if (!success) {
      return NextResponse.json(
        { error: "Invitation not found or already processed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error declining invitation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
