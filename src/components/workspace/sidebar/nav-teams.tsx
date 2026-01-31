"use client";

import { IconFolder, IconPlus, IconStack2 } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TeamAvatar } from "@/components/team/team-avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeams } from "@/hooks/use-teams";
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

interface NavTeamsProps {
  currentSlug: string;
  initialTeams?: TeamData[];
}

export function NavTeams({ currentSlug, initialTeams }: NavTeamsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { teams, isLoading, mutate } = useTeams(currentSlug, {
    initialData: initialTeams,
  });
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const teamMatch = pathname.match(
      new RegExp(`^/${currentSlug}/teams/([^/]+)`)
    );
    if (teamMatch) {
      const teamIdentifier = teamMatch[1];
      setExpandedTeams((prev) => new Set(prev).add(teamIdentifier));
    }
  }, [pathname, currentSlug]);

  const toggleTeam = (teamIdentifier: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamIdentifier)) {
        next.delete(teamIdentifier);
      } else {
        next.add(teamIdentifier);
      }
      return next;
    });
  };

  const isTeamPageActive = (teamIdentifier: string, subPage?: string) => {
    const basePath = `/${currentSlug}/teams/${teamIdentifier}`;
    if (subPage) {
      return pathname === `${basePath}/${subPage}`;
    }
    return pathname === basePath || pathname.startsWith(`${basePath}/`);
  };

  const handleTeamCreated = (team: {
    id: string;
    name: string;
    identifier: string;
  }) => {
    mutate();
    router.push(`/${currentSlug}/teams/${team.identifier}`);
  };

  return (
    <>
      <SidebarGroup>
        <Collapsible onOpenChange={setTeamsOpen} open={teamsOpen}>
          <SidebarGroupLabel
            render={
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-1">
                <span>Your teams</span>
                <span
                  className={`mt-0.5 scale-70 transition-transform ${teamsOpen ? "rotate-90" : ""}`}
                >
                  ▶
                </span>
              </CollapsibleTrigger>
            }
          />
          <SidebarGroupAction
            aria-label="Create team"
            onClick={() => setCreateDialogOpen(true)}
            onFocus={preloadCreateTeamDialog}
            onMouseEnter={preloadCreateTeamDialog}
            title="Create team"
          >
            <IconPlus aria-hidden="true" className="size-4" />
          </SidebarGroupAction>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {(() => {
                  if (isLoading) {
                    return [1, 2].map((i) => (
                      <SidebarMenuItem key={i}>
                        <div className="flex h-8 items-center gap-2 px-2">
                          <Skeleton className="size-3.5 rounded" />
                          <Skeleton className="size-5 rounded" />
                          <Skeleton className="h-4 w-24 rounded" />
                        </div>
                      </SidebarMenuItem>
                    ));
                  }
                  if (teams.length === 0) {
                    return (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          className="text-muted-foreground"
                          onClick={() => setCreateDialogOpen(true)}
                          onFocus={preloadCreateTeamDialog}
                          onMouseEnter={preloadCreateTeamDialog}
                        >
                          <IconPlus aria-hidden="true" className="size-4" />
                          <span>Create a team</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                  return teams.map((team) => {
                    const isExpanded = expandedTeams.has(team.identifier);
                    const isActive = isTeamPageActive(team.identifier);
                    return (
                      <Collapsible
                        key={team.id}
                        onOpenChange={() => toggleTeam(team.identifier)}
                        open={isExpanded}
                      >
                        <SidebarMenuItem>
                          <div className="flex w-full flex-col gap-1">
                            <SidebarMenuButton
                              isActive={isActive}
                              render={
                                <CollapsibleTrigger>
                                  <TeamAvatar
                                    icon={team.icon}
                                    identifier={team.identifier}
                                    name={team.name}
                                    size="xs"
                                  />
                                  <span className="truncate font-[490] text-[13px]">
                                    {team.name}
                                  </span>
                                  <span
                                    className={`mt-0.5 scale-70 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                  >
                                    ▶
                                  </span>
                                </CollapsibleTrigger>
                              }
                            />
                            <CollapsibleContent>
                              <SidebarMenu className="flex-col gap-0">
                                <SidebarMenuItem>
                                  <SidebarMenuButton
                                    className="pl-4"
                                    isActive={isTeamPageActive(
                                      team.identifier,
                                      "issues"
                                    )}
                                    onClick={() =>
                                      router.push(
                                        `/${currentSlug}/teams/${team.identifier}/issues`
                                      )
                                    }
                                  >
                                    <IconStack2
                                      aria-hidden="true"
                                      className="size-4"
                                    />
                                    <span className="font-[490] text-[13px]">
                                      Issues
                                    </span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                  <SidebarMenuButton
                                    className="pl-4"
                                    isActive={isTeamPageActive(
                                      team.identifier,
                                      "projects"
                                    )}
                                    onClick={() =>
                                      router.push(
                                        `/${currentSlug}/teams/${team.identifier}/projects`
                                      )
                                    }
                                  >
                                    <IconFolder
                                      aria-hidden="true"
                                      className="size-4"
                                    />
                                    <span className="font-[490] text-[13px]">
                                      Projects
                                    </span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              </SidebarMenu>
                            </CollapsibleContent>
                          </div>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  });
                })()}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>

      {createDialogOpen && (
        <CreateTeamDialog
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleTeamCreated}
          open={createDialogOpen}
          workspaceSlug={currentSlug}
        />
      )}
    </>
  );
}
