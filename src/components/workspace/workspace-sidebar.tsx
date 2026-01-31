"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useWorkspaces } from "@/hooks/use-workspaces";
import type { TeamData } from "@/lib/team";
import type { WorkspaceData } from "@/lib/workspace";
import { NavFooter } from "./sidebar/nav-footer";
import { NavMain } from "./sidebar/nav-main";
import { NavTeams } from "./sidebar/nav-teams";
import { NavUser } from "./sidebar/nav-user";
import { NavWorkspace } from "./sidebar/nav-workspace";
import { WorkspaceSwitcher } from "./sidebar/workspace-switcher";

interface WorkspaceSidebarProps {
  currentSlug: string;
  initialWorkspaces?: WorkspaceData[];
  initialTeams?: TeamData[];
}

export function WorkspaceSidebar({
  currentSlug,
  initialWorkspaces,
  initialTeams,
}: WorkspaceSidebarProps) {
  const { workspaces, isLoading, mutate } = useWorkspaces({
    initialData: initialWorkspaces,
  });

  const handleWorkspaceCreated = (_workspace: {
    id: string;
    name: string;
    slug: string;
  }) => {
    mutate();
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <WorkspaceSwitcher
          currentSlug={currentSlug}
          isLoading={isLoading}
          onWorkspaceCreated={handleWorkspaceCreated}
          workspaces={workspaces}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain currentSlug={currentSlug} />
        <NavWorkspace currentSlug={currentSlug} />
        <NavTeams currentSlug={currentSlug} initialTeams={initialTeams} />
      </SidebarContent>
      <SidebarFooter>
        <NavFooter currentSlug={currentSlug} />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
