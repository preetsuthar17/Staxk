import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

export const getSessionSafe = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error fetching session:", error);

      if (
        error instanceof Error &&
        (error.message.includes("relation") ||
          error.message.includes("does not exist") ||
          error.message.includes("ECONNREFUSED"))
      ) {
        console.error(
          "Database error detected. Please run migrations: pnpm drizzle:push"
        );
      }
    } else {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching session:", errorMessage);
    }

    return null;
  }
});

export async function requireSession(redirectTo = "/login") {
  const session = await getSessionSafe();

  if (!session) {
    redirect(redirectTo);
  }

  return session;
}

export async function requireSessionForUser(
  userId: string,
  redirectTo = "/login"
) {
  const session = await requireSession(redirectTo);

  if (session.user.id !== userId) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  return session;
}
