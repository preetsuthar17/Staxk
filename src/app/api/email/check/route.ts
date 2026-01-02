import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return NextResponse.json({ available: false });
  }

  try {
    const existingUser = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    return NextResponse.json({
      available: existingUser.length === 0,
    });
  } catch (error) {
    console.error("Error checking email availability:", error);
    return NextResponse.json(
      { error: "Failed to check email availability" },
      { status: 500 }
    );
  }
}