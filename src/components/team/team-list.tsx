"use client";

import { IconUsersGroup } from "@tabler/icons-react";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { TeamData } from "@/lib/team";
import { TeamCard } from "./team-card";

interface TeamListProps {
  teams: TeamData[];
  workspaceSlug: string;
  onCreateTeam?: () => void;
}

export function TeamList({
  teams,
  workspaceSlug,
  onCreateTeam,
}: TeamListProps) {
  if (teams.length === 0) {
    return (
      <Empty>
        <IconUsersGroup className="size-10 text-muted-foreground" />
        <EmptyTitle>No teams yet</EmptyTitle>
        <EmptyDescription>
          Create your first team to organize your workspace members.
        </EmptyDescription>
        {onCreateTeam && (
          <button
            className="mt-2 text-primary text-sm hover:underline"
            onClick={onCreateTeam}
            type="button"
          >
            Create a team
          </button>
        )}
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <TeamCard
          color={team.color}
          description={team.description}
          icon={team.icon}
          id={team.id}
          identifier={team.identifier}
          key={team.id}
          memberCount={team.memberCount}
          name={team.name}
          userRole={team.userRole}
          workspaceSlug={workspaceSlug}
        />
      ))}
    </div>
  );
}
