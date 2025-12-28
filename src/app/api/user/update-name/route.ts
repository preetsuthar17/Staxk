import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required and cannot be empty" },
        { status: 400 }
      );
    }

    await db
      .update(user)
      .set({ name: name.trim() })
      .where(eq(user.id, session.user.id));

    return NextResponse.json(
      { success: true, message: "Name updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user name:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
