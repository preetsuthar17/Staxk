import { and, desc, eq, gt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { session } from "@/db/schema/auth";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  INVALID_REQUEST: NextResponse.json(
    { error: "Invalid request" },
    { status: 400 }
  ),
  SESSION_NOT_FOUND: NextResponse.json(
    { error: "Session not found" },
    { status: 404 }
  ),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

export async function GET(request: Request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;
    const currentToken = sessionData.session?.token;

    const activeSessions = await db
      .select({
        id: session.id,
        token: session.token,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())))
      .orderBy(desc(session.updatedAt));

    const sessionsWithCurrent = activeSessions.map((s) => ({
      ...s,
      isCurrent: s.token === currentToken,
    }));

    return NextResponse.json({ sessions: sessionsWithCurrent }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return ERRORS.SERVER_ERROR;
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const userId = sessionData.user.id;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const revokeAll = searchParams.get("all") === "true";

    if (revokeAll) {
      try {
        const currentSession = sessionData.session;
        if (currentSession?.token) {
          await db
            .delete(session)
            .where(
              and(
                eq(session.userId, userId),
                sql`${session.token} != ${currentSession.token}`
              )
            );
        } else {
          await db.delete(session).where(eq(session.userId, userId));
        }

        return NextResponse.json(
          { success: true, message: "All other sessions revoked" },
          { status: 200 }
        );
      } catch (authError) {
        console.error("Error revoking all sessions:", authError);
        return ERRORS.SERVER_ERROR;
      }
    }

    if (!token) {
      return ERRORS.INVALID_REQUEST;
    }

    const [sessionToRevoke] = await db
      .select({ userId: session.userId })
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (!sessionToRevoke) {
      return ERRORS.SESSION_NOT_FOUND;
    }

    if (sessionToRevoke.userId !== userId) {
      return ERRORS.UNAUTHORIZED;
    }

    try {
      await db.delete(session).where(eq(session.token, token));

      return NextResponse.json(
        { success: true, message: "Session revoked" },
        { status: 200 }
      );
    } catch (authError) {
      console.error("Error revoking session:", authError);
      return ERRORS.SERVER_ERROR;
    }
  } catch (error) {
    console.error("Error in DELETE sessions:", error);
    return ERRORS.SERVER_ERROR;
  }
}

