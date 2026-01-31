import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import { getUserWorkspaces } from "@/lib/workspace";

export default async function HomePage() {
  const headersList = await headers();
  const sessionData = await auth.api.getSession({
    headers: headersList,
  });

  if (!sessionData?.user) {
    redirect("/");
  }

  const userId = sessionData.user.id;

  const [userData] = await db
    .select({ isOnboarded: user.isOnboarded })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userData?.isOnboarded) {
    redirect("/onboarding");
  }

  const workspaces = await getUserWorkspaces(userId);

  if (workspaces.length === 0) {
    redirect("/onboarding");
  }

  if (workspaces.length === 1) {
    redirect(`/${workspaces[0].slug}`);
  }

  redirect("/workspaces");
}
