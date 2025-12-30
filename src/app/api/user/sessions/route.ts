import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { session } from "@/db/schema";
import { getSessionSafe } from "@/lib/auth-utils";
import { safeError } from "@/lib/logger";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").substring(0, 16);
}

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

    const currentSessionToken = currentSession.session?.token;
    const currentSessionTokenHash = currentSessionToken
      ? hashToken(currentSessionToken)
      : null;

    const sessionsWithCurrent: Array<{
      id: string;
      tokenPrefix: string;
      createdAt: Date | null;
      updatedAt: Date;
      expiresAt: Date | null;
      ipAddress: string | null;
      userAgent: string | null;
      isCurrent: boolean;
    }> = [];

    for (const s of sessions) {
      if (!s.expiresAt || new Date(s.expiresAt) <= now) {
        continue;
      }

      const tokenHash = hashToken(s.token);

      sessionsWithCurrent.push({
        id: s.id,
        tokenPrefix: `sess_${tokenHash}`,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        expiresAt: s.expiresAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        isCurrent: tokenHash === currentSessionTokenHash,
      });
    }

    return NextResponse.json(
      { sessions: sessionsWithCurrent },
      { status: 200 }
    );
  } catch (error) {
    safeError("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
