import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TeamGeneralCard } from "@/components/team/team-general-card";
import { auth } from "@/lib/auth";
import { getTeamByIdentifier } from "@/lib/team";

interface TeamSettingsPageProps {
  params: Promise<{ "workspace-slug": string; "team-identifier": string }>;
}

export default async function TeamSettingsPage({
  params,
}: TeamSettingsPageProps) {
  const { "workspace-slug": workspaceSlug, "team-identifier": teamIdentifier } =
    await params;

  const headersList = await headers();
  const sessionData = await auth.api.getSession({
    headers: headersList,
  });

  if (!sessionData?.user) {
    redirect("/login");
  }

  const userId = sessionData.user.id;
  const team = await getTeamByIdentifier(workspaceSlug, teamIdentifier, userId);

  if (!team) {
    redirect(`/${workspaceSlug}/teams`);
  }

  return (
    <TeamGeneralCard
      team={{
        id: team.id,
        name: team.name,
        identifier: team.identifier,
        description: team.description,
        icon: team.icon,
        color: team.color,
      }}
      workspaceSlug={workspaceSlug}
    />
  );
}
