import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TeamDangerZoneCard } from "@/components/team/team-danger-zone-card";
import { TeamGeneralCard } from "@/components/team/team-general-card";
import { TeamMembersCard } from "@/components/team/team-members-card";
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
    redirect(`/${workspaceSlug}/settings`);
  }

  const canManage =
    team.userRole === "lead" ||
    team.workspaceRole === "owner" ||
    team.workspaceRole === "admin";

  if (!canManage) {
    redirect(`/${workspaceSlug}/settings`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">{team.name}</h1>
        <p className="text-muted-foreground text-sm">
          Manage settings for {team.name} team
        </p>
      </div>

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

      <TeamMembersCard
        teamIdentifier={team.identifier}
        workspaceSlug={workspaceSlug}
      />

      <TeamDangerZoneCard
        teamIdentifier={team.identifier}
        teamName={team.name}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
