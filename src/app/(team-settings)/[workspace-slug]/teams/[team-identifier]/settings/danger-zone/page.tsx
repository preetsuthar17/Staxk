import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TeamDangerZoneCard } from "@/components/team/team-danger-zone-card";
import { auth } from "@/lib/auth";
import { getTeamByIdentifier } from "@/lib/team";

interface TeamDangerZonePageProps {
  params: Promise<{ "workspace-slug": string; "team-identifier": string }>;
}

export default async function TeamDangerZonePage({
  params,
}: TeamDangerZonePageProps) {
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
    <TeamDangerZoneCard
      teamIdentifier={team.identifier}
      teamName={team.name}
      workspaceSlug={workspaceSlug}
    />
  );
}
