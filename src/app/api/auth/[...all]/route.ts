import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const authHandler = toNextJsHandler(auth);

async function handleAuthRequest(
  handler: (request: NextRequest) => Promise<Response>,
  request: NextRequest
) {
  try {
    return await handler(request);
  } catch (error) {
    console.error("Better Auth error:", error);

    if (
      error instanceof Error &&
      (error.message.includes("relation") ||
        error.message.includes("does not exist") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("connection"))
    ) {
      console.error(
        "Database connection error. Please ensure:\n" +
          "1. DATABASE_URL is set correctly\n" +
          "2. Database migrations have been run (pnpm drizzle:push)\n" +
          "3. The database is accessible"
      );

      return new Response(
        JSON.stringify({
          error: "Database connection failed",
          message:
            "Please ensure the database is set up and migrations have been run.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
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
