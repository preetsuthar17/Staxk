import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { session } from "@/db/schema";
import { getSessionSafe } from "@/lib/auth-utils";

export async function GET() {
  try {
    const currentSession = await getSessionSafe();

    if (!currentSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db
      .select({
        id: session.id,
        token: session.token,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(eq(session.userId, currentSession.user.id))
      .orderBy(desc(session.createdAt));

    const now = new Date();
    const activeSessions = sessions.filter(
      (s) => s.expiresAt && new Date(s.expiresAt) > now
    );

    const currentSessionToken = currentSession.session?.token;
    const sessionsWithCurrent = activeSessions.map((s) => ({
      id: s.id,
      tokenPrefix: s.token.substring(0, 8) + "...",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      expiresAt: s.expiresAt,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      isCurrent: s.token === currentSessionToken,
    }));

    return NextResponse.json(
      { sessions: sessionsWithCurrent },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
