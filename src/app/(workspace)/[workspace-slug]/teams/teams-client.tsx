"use client";

import { IconPlus } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TeamList } from "@/components/team/team-list";
import { Button } from "@/components/ui/button";
import type { TeamData } from "@/lib/team";

const CreateTeamDialog = dynamic(
  () =>
    import("@/components/team/create-team-dialog").then((m) => ({
      default: m.CreateTeamDialog,
    })),
  { ssr: false }
);

const preloadCreateTeamDialog = () => {
  import("@/components/team/create-team-dialog").catch(() => undefined);
};

interface TeamsClientProps {
  initialTeams: TeamData[];
  workspaceSlug: string;
}

export function TeamsClient({ initialTeams, workspaceSlug }: TeamsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [teams] = useState(initialTeams);

  const handleCreateSuccess = (team: {
    id: string;
    name: string;
    identifier: string;
  }) => {
    startTransition(() => {
      router.refresh();
      router.push(`/${workspaceSlug}/teams/${team.identifier}`);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-2xl">Teams</h1>
        <Button
          loading={isPending}
          onClick={() => setCreateDialogOpen(true)}
          onFocus={preloadCreateTeamDialog}
          onMouseEnter={preloadCreateTeamDialog}
          size="sm"
        >
          <IconPlus aria-hidden="true" className="size-4" />
          Create Team
        </Button>
      </div>

      <TeamList
        onCreateTeam={() => setCreateDialogOpen(true)}
        teams={teams}
        workspaceSlug={workspaceSlug}
      />

      {createDialogOpen && (
        <CreateTeamDialog
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleCreateSuccess}
          open={createDialogOpen}
          workspaceSlug={workspaceSlug}
        />
      )}
    </div>
  );
}
