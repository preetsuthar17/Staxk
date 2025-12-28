import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSessionSafe() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
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

    return null;
  }
}

export async function requireSession(redirectTo = "/home") {
  const session = await getSessionSafe();

  if (!session) {
    redirect(redirectTo);
  }

  return session;
}

export async function requireSessionForUser(
  userId: string,
  redirectTo = "/home"
) {
  const session = await requireSession(redirectTo);

  if (session.user.id !== userId) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  return session;
}
