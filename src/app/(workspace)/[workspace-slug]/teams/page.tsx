import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWorkspaceTeams } from "@/lib/team";
import { getWorkspaceBySlug } from "@/lib/workspace";
import { TeamsClient } from "./teams-client";

interface TeamsPageProps {
  params: Promise<{ "workspace-slug": string }>;
}

export default async function TeamsPage({ params }: TeamsPageProps) {
  const { "workspace-slug": workspaceSlug } = await params;
  const headersList = await headers();

  const sessionData = await auth.api.getSession({ headers: headersList });
  if (!sessionData?.user) {
    redirect("/login");
  }

  const workspace = await getWorkspaceBySlug(
    workspaceSlug,
    sessionData.user.id
  );
  if (!workspace) {
    redirect("/");
  }

  const teams = await getWorkspaceTeams(workspace.id, sessionData.user.id);

  return <TeamsClient initialTeams={teams} workspaceSlug={workspaceSlug} />;
}
