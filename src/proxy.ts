import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

const CONFIG = {
  CACHE_TTL: 5 * 60 * 1000,
  MAX_CACHE_SIZE: 1000,
  REDIRECT_LIMIT: 3,
} as const;

const PUBLIC_ROUTES = [
  "/home",
  "/api/auth",
  "/forgot-password",
  "/reset-password",
] as const;

const AUTH_ROUTES = ["/login", "/signup"] as const;

const ALWAYS_ACCESSIBLE = ["/logout", "/onboarding"] as const;

const BYPASS_PATTERNS = [
  /^\/api\/(?!auth).+/,
  /^\/_next\/.+/,
  /^\/static\/.+/,
  /\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|woff|woff2|ttf|eot|txt|xml)$/i,
] as const;

class Cache<T> {
  private readonly data: Map<
    string,
    { value: T; timestamp: number; hits: number }
  >;
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize: number, ttl: number) {
    this.data = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const entry = this.data.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.data.delete(key);
      return null;
    }

    entry.hits++;
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.data.size >= this.maxSize) {
      this.evict();
    }

    this.data.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  delete(key: string): void {
    this.data.delete(key);
  }

  private evict(): void {
    const now = Date.now();
    let evicted = false;

    for (const [key, entry] of this.data.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.data.delete(key);
        evicted = true;
      }
    }

    if (!evicted && this.data.size >= this.maxSize) {
      let lruKey: string | null = null;
      let lruScore = Number.POSITIVE_INFINITY;

      for (const [key, entry] of this.data.entries()) {
        const age = (now - entry.timestamp) / 1000;
        const score = entry.hits / Math.max(age, 1);

        if (score < lruScore) {
          lruScore = score;
          lruKey = key;
        }
      }

      if (lruKey) {
        this.data.delete(lruKey);
      }
    }
  }
}

const onboardingCache = new Cache<boolean>(
  CONFIG.MAX_CACHE_SIZE,
  CONFIG.CACHE_TTL
);

function shouldBypass(pathname: string): boolean {
  return BYPASS_PATTERNS.some((pattern) => {
    if (typeof pattern === "string") {
      return pathname.startsWith(pattern);
    }
    return pattern.test(pathname);
  });
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAlwaysAccessible(pathname: string): boolean {
  return ALWAYS_ACCESSIBLE.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function getRedirectCount(request: NextRequest): number {
  const cookie = request.cookies.get("redirect_count");
  return cookie ? Number.parseInt(cookie.value, 10) : 0;
}

function createRedirectResponse(
  url: string,
  request: NextRequest,
  incrementCount = true
): NextResponse {
  const response = NextResponse.redirect(new URL(url, request.url));

  if (incrementCount) {
    const count = getRedirectCount(request) + 1;
    response.cookies.set("redirect_count", count.toString(), {
      httpOnly: true,
      maxAge: 60,
    });
  }

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );

  return response;
}

async function checkOnboardingStatus(userId: string): Promise<boolean | null> {
  try {
    const result = await db
      .select({ isOnboarded: user.isOnboarded })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return result[0]?.isOnboarded ?? null;
  } catch (error) {
    console.error("Database error in middleware:", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  if (isAlwaysAccessible(pathname)) {
    const response = NextResponse.next();
    response.cookies.delete("redirect_count");
    return response;
  }

  const redirectCount = getRedirectCount(request);
  if (redirectCount >= CONFIG.REDIRECT_LIMIT) {
    console.error(`Redirect loop detected for path: ${pathname}`);
    const response = NextResponse.redirect(new URL("/home", request.url));
    response.cookies.delete("redirect_count");
    return response;
  }

  try {
    let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
    try {
      session = await auth.api.getSession({
        headers: request.headers,
      });
    } catch (error) {
      console.error("Session fetch error:", error);
      session = null;
    }

    if (session?.user?.id && isAuthRoute(pathname)) {
      return createRedirectResponse("/", request);
    }

    if (isPublicRoute(pathname)) {
      const response = NextResponse.next();
      response.cookies.delete("redirect_count");
      return response;
    }

    if (isAuthRoute(pathname)) {
      const response = NextResponse.next();
      response.cookies.delete("redirect_count");
      return response;
    }

    if (!session?.user?.id) {
      return createRedirectResponse("/home", request);
    }

    let isOnboarded = onboardingCache.get(session.user.id);

    if (isOnboarded === null) {
      isOnboarded = await checkOnboardingStatus(session.user.id);

      if (isOnboarded !== null) {
        onboardingCache.set(session.user.id, isOnboarded);
      }
    }

    if (isOnboarded === false) {
      return createRedirectResponse("/onboarding", request);
    }

    const response = NextResponse.next();
    response.cookies.delete("redirect_count");
    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    return createRedirectResponse("/home", request, false);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
