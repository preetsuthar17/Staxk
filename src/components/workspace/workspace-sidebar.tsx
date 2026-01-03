"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavFooter } from "./sidebar/nav-footer";
import { NavMain } from "./sidebar/nav-main";
import { NavUser } from "./sidebar/nav-user";
import { WorkspaceSwitcher } from "./sidebar/workspace-switcher";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: "owner" | "admin" | "member";
}

interface WorkspaceSidebarProps {
  currentSlug: string;
}

export function WorkspaceSidebar({ currentSlug }: WorkspaceSidebarProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace/list");
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleWorkspaceCreated = useCallback(
    (_workspace: { id: string; name: string; slug: string }) => {
      // Refresh workspace list
      fetchWorkspaces();
    },
    [fetchWorkspaces]
  );

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
      </SidebarContent>
      <SidebarFooter>
        <NavFooter currentSlug={currentSlug} />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
