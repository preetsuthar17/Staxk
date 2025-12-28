import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSessionSafe } from "@/lib/auth-utils";
import { validateUsernameFormat } from "@/lib/username";
import { usernameCache } from "@/lib/username-cache";

export async function POST(request: Request) {
  try {
    const session = await getSessionSafe();

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
        { error: formatValidation.error, available: false },
        { status: 400 }
      );
    }

    const normalizedUsername = username.toLowerCase();
    const cachedResult = usernameCache.get(normalizedUsername);

    if (cachedResult !== null) {
      return NextResponse.json(
        { available: cachedResult, username },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, max-age=300",
            "X-Cache": "HIT",
          },
        }
      );
    }

    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(
        and(eq(user.username, normalizedUsername), ne(user.id, session.user.id))
      )
      .limit(1);

    const available = existingUser.length === 0;
    usernameCache.set(normalizedUsername, available);

    return NextResponse.json(
      { available, username },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=300",
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
