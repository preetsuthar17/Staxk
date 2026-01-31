import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  INVALID_BODY: NextResponse.json(
    { error: "Invalid request body" },
    { status: 400 }
  ),
  SERVER_ERROR: NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  ),
};

export async function PATCH(request: Request) {
  try {
    const [body, session] = await Promise.all([
      request.json().catch(() => null),
      auth.api.getSession({ headers: request.headers }),
    ]);

    if (!session?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    if (!body || typeof body.usePointerCursors !== "boolean") {
      return ERRORS.INVALID_BODY;
    }

    const [currentUser] = await db
      .select({ preferences: user.preferences })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser) {
      return ERRORS.SERVER_ERROR;
    }

    const updatedPreferences = {
      ...(currentUser.preferences || {}),
      usePointerCursors: body.usePointerCursors,
    };

    const [updatedUser] = await db
      .update(user)
      .set({ preferences: updatedPreferences })
      .where(eq(user.id, session.user.id))
      .returning({ preferences: user.preferences });

    if (!updatedUser) {
      return ERRORS.SERVER_ERROR;
    }

    return NextResponse.json(
      {
        usePointerCursors: updatedUser.preferences?.usePointerCursors ?? false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating preferences:", error);
    return ERRORS.SERVER_ERROR;
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const [userData] = await db
      .select({ preferences: user.preferences })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userData) {
      return ERRORS.SERVER_ERROR;
    }

    return NextResponse.json(
      {
        usePointerCursors: userData.preferences?.usePointerCursors ?? false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return ERRORS.SERVER_ERROR;
  }
}
