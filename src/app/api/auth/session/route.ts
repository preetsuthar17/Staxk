import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const [userData] = await db
      .select({ isOnboarded: user.isOnboarded })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    return NextResponse.json(
      {
        user: {
          ...session.user,
          isOnboarded: userData?.isOnboarded ?? false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { user: null, error: "Failed to check session" },
      { status: 500 }
    );
  }
}
