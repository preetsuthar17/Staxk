import { TeamMembersCard } from "@/components/team/team-members-card";

interface TeamMembersPageProps {
  params: Promise<{ "workspace-slug": string; "team-identifier": string }>;
}

export default async function TeamMembersPage({
  params,
}: TeamMembersPageProps) {
  const { "workspace-slug": workspaceSlug, "team-identifier": teamIdentifier } =
    await params;

  return (
    <TeamMembersCard
      teamIdentifier={teamIdentifier}
      workspaceSlug={workspaceSlug}
    />
  );
}
