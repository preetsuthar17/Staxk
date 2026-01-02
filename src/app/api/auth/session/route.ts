import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    return NextResponse.json({ user: session?.user || null }, { status: 200 });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { user: null, error: "Failed to check session" },
      { status: 500 }
    );
  }
}
