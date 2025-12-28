import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { session } from "@/db/schema";
import { getSessionSafe } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const currentSession = await getSessionSafe();

    if (!currentSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token, revokeAll } = body;

    if (revokeAll === true) {
      // Revoke all sessions for the user
      await db
        .delete(session)
        .where(eq(session.userId, currentSession.user.id));

      return NextResponse.json(
        { success: true, message: "All sessions revoked successfully" },
        { status: 200 }
      );
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Session token is required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user
    const sessionToRevoke = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionToRevoke.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (sessionToRevoke[0].userId !== currentSession.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the session
    await db.delete(session).where(eq(session.token, token));

    return NextResponse.json(
      { success: true, message: "Session revoked successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error revoking session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
