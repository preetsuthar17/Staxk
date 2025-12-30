import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const maxDuration = 30;

const authHandler = toNextJsHandler(auth);

async function handleAuthRequest(
  handler: (request: NextRequest) => Promise<Response>,
  request: NextRequest
) {
  try {
    return await handler(request);
  } catch (error) {
    const isDatabaseError =
      error instanceof Error &&
      (error.message.includes("relation") ||
        error.message.includes("does not exist") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("connection"));

    if (isDatabaseError) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "Database connection error. Please ensure:\n" +
            "1. DATABASE_URL is set correctly\n" +
            "2. Database migrations have been run (pnpm drizzle:push)\n" +
            "3. The database is accessible"
        );
      } else {
        console.error("Database connection error");
      }

      return new Response(
        JSON.stringify({
          error: "Service temporarily unavailable",
          message: "Please try again later.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (process.env.NODE_ENV === "production") {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Better Auth error:", errorMessage);
    } else {
      console.error("Better Auth error:", error);
    }

    throw error;
  }
}

export async function GET(request: NextRequest) {
  return await handleAuthRequest(authHandler.GET, request);
}

export async function POST(request: NextRequest) {
  return await handleAuthRequest(authHandler.POST, request);
}
