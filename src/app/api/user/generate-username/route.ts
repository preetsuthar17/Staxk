import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSessionSafe } from "@/lib/auth-utils";
import { generateUsername } from "@/lib/username";

export async function POST() {
  try {
    const session = await getSessionSafe();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = existingUser[0];

    if (currentUser.username) {
      return NextResponse.json(
        { username: currentUser.username, message: "Username already exists" },
        { status: 200 }
      );
    }

    if (!currentUser.name) {
      return NextResponse.json(
        { error: "User name is required to generate username" },
        { status: 400 }
      );
    }

    let generatedUsername = generateUsername(currentUser.name);
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existingUsername = await db
        .select()
        .from(user)
        .where(eq(user.username, generatedUsername))
        .limit(1);

      if (existingUsername.length === 0) {
        break;
      }

      generatedUsername = generateUsername(currentUser.name);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique username. Please try again." },
        { status: 500 }
      );
    }

    await db
      .update(user)
      .set({ username: generatedUsername })
      .where(eq(user.id, session.user.id));

    return NextResponse.json(
      {
        username: generatedUsername,
        message: "Username generated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating username:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
