import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user as userTable, workspace, workspaceMember } from "@/db/schema";
import { getSessionSafe } from "@/lib/auth-utils";

export default async function RootPage() {
  const session = await getSessionSafe();

  if (!session) {
    redirect("/home");
  }

  const [userData, userWorkspaces] = await Promise.all([
    db
      .select({ isOnboarded: userTable.isOnboarded })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1),
    db
      .select({
        id: workspace.id,
        slug: workspace.slug,
      })
      .from(workspace)
      .innerJoin(workspaceMember, eq(workspace.id, workspaceMember.workspaceId))
      .where(eq(workspaceMember.userId, session.user.id))
      .limit(1),
  ]);

  if (!userData[0]?.isOnboarded) {
    redirect("/onboarding");
  }

  if (userWorkspaces.length > 0) {
    redirect(`/${userWorkspaces[0].slug}`);
  }

  redirect("/onboarding");
}
