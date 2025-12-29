import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

const PUBLIC_ROUTES = [
  "/home",
  "/login",
  "/signup",
  "/logout",
  "/onboarding",
  "/api/auth",
  "/forgot-password",
  "/reset-password",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    // Check if user is onboarded
    const userData = await db
      .select({ isOnboarded: user.isOnboarded })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (userData.length > 0 && !userData[0].isOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
