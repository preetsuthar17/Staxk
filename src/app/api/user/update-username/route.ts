import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { validateUsernameFormat } from "@/lib/username";
import { usernameCache } from "@/lib/username-cache";

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const formatValidation = validateUsernameFormat(username);
    if (!formatValidation.valid) {
      return NextResponse.json(
        { error: formatValidation.error },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(user)
      .where(and(eq(user.username, username), ne(user.id, session.user.id)))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();

    await db
      .update(user)
      .set({ username: normalizedUsername })
      .where(eq(user.id, session.user.id));

    // @ts-expect-error - username might not be in session type yet
    const oldUsername = session.user.username;
    if (oldUsername) {
      usernameCache.invalidate(oldUsername);
    }
    usernameCache.set(normalizedUsername, false);

    return NextResponse.json(
      {
        success: true,
        message: "Username updated successfully",
        username: normalizedUsername,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating username:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
