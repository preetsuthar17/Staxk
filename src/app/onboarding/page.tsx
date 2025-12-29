import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { db } from "@/db";
import { user, workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { OnboardingClient } from "./onboarding-client";

async function OnboardingContent() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const userData = await db
    .select({ isOnboarded: user.isOnboarded, name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (userData.length === 0) {
    redirect("/login");
  }

  if (userData[0].isOnboarded) {
    const ownedWorkspaces = await db
      .select({ slug: workspace.slug })
      .from(workspace)
      .where(eq(workspace.ownerId, session.user.id))
      .limit(1);

    if (ownedWorkspaces.length > 0) {
      redirect(`/${ownedWorkspaces[0].slug}`);
    }

    const memberWorkspaces = await db
      .select({ slug: workspace.slug })
      .from(workspaceMember)
      .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
      .where(eq(workspaceMember.userId, session.user.id))
      .limit(1);

    if (memberWorkspaces.length > 0) {
      redirect(`/${memberWorkspaces[0].slug}`);
    }

    redirect("/");
  }

  const userName = userData[0].name?.split(" ")[0] || "there";

  return <OnboardingClient userName={userName} />;
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}
