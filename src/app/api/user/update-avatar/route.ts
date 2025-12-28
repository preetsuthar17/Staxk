import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

const MAX_BASE64_SIZE = 700_000;

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body;

    if (image === null) {
      await db
        .update(user)
        .set({ image: null })
        .where(eq(user.id, session.user.id));
      return NextResponse.json(
        { success: true, message: "Profile picture removed successfully" },
        { status: 200 }
      );
    }

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format. Must be a valid image file." },
        { status: 400 }
      );
    }

    if (image.length > MAX_BASE64_SIZE) {
      return NextResponse.json(
        { error: "Image is too large. Please use a smaller image." },
        { status: 400 }
      );
    }

    await db.update(user).set({ image }).where(eq(user.id, session.user.id));

    return NextResponse.json(
      { success: true, message: "Profile picture updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
