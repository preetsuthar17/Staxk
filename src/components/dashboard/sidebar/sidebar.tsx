"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { SidebarContent as DashboardSidebarContent } from "./sidebar-content";
import { SidebarFooter as DashboardSidebarFooter } from "./sidebar-footer";
import { getDicebearUrl, getRandomSeed, getUsername } from "./types";
import { getWorkspaceSlug } from "./utils";
import { WorkspaceSelector } from "./workspace-selector";

interface Workspace {
  id: string;
  slug: string;
}

export function DashboardSidebar() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const [randomFallbackSeed, setRandomFallbackSeed] = useState<string | null>(
    null
  );
  const [randomPendingSeed, setRandomPendingSeed] = useState<string | null>(
    null
  );
  const [fallbackWorkspaceSlug, setFallbackWorkspaceSlug] = useState<
    string | null
  >(null);

  useEffect(() => {
    setRandomFallbackSeed(getRandomSeed());
    setRandomPendingSeed(getRandomSeed());
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace/list");
      const data = await response.json();
      return Array.isArray(data.workspaces) ? data.workspaces : [];
    } catch {
      return [];
    }
  }, []);

  const setWorkspaceFromList = useCallback(
    (workspaces: Workspace[], workspaceId?: string | null) => {
      if (workspaces.length === 0) {
        return;
      }

      const targetWorkspace = workspaceId
        ? workspaces.find((ws: Workspace) => ws.id === workspaceId)
        : null;

      const selectedWorkspace = targetWorkspace || workspaces[0];
      setFallbackWorkspaceSlug(selectedWorkspace.slug);
      localStorage.setItem("lastWorkspaceSlug", selectedWorkspace.slug);
    },
    []
  );

  useEffect(() => {
    const loadFallbackWorkspace = () => {
      const lastWorkspaceSlug = localStorage.getItem("lastWorkspaceSlug");
      if (lastWorkspaceSlug) {
        setFallbackWorkspaceSlug(lastWorkspaceSlug);
        return;
      }

      const workspaceId = localStorage.getItem("currentWorkspaceId");
      fetchWorkspaces().then((workspaces) => {
        setWorkspaceFromList(workspaces, workspaceId);
      });
    };

    loadFallbackWorkspace();
  }, [fetchWorkspaces, setWorkspaceFromList]);

  useEffect(() => {
    const workspaceSlugFromPath = getWorkspaceSlug(pathname);
    if (workspaceSlugFromPath) {
      localStorage.setItem("lastWorkspaceSlug", workspaceSlugFromPath);
      setFallbackWorkspaceSlug(workspaceSlugFromPath);
    }
  }, [pathname]);

  const user = session?.user;
  const username = getUsername(user?.email, user?.name);
  const dicebearUrl = getDicebearUrl(username);
  const randomFallbackUrl = randomFallbackSeed
    ? getDicebearUrl(randomFallbackSeed)
    : "";
  const randomPendingUrl = randomPendingSeed
    ? getDicebearUrl(randomPendingSeed)
    : "";
  const settingsHref = "/settings";
  const workspaceSlugFromPath = getWorkspaceSlug(pathname);
  const workspaceSlug = workspaceSlugFromPath || fallbackWorkspaceSlug;

  return (
    <Sidebar className="justify-between" disabled={isPending}>
      <div className="flex flex-col -space-y-4">
        <SidebarHeader>
          <WorkspaceSelector pathname={pathname} />
        </SidebarHeader>
        <DashboardSidebarContent
          pathname={pathname}
          workspaceSlug={workspaceSlug}
        />
      </div>
      <DashboardSidebarFooter
        dicebearUrl={dicebearUrl}
        fallbackUrl={randomFallbackUrl}
        isPending={isPending}
        pathname={pathname}
        pendingUrl={randomPendingUrl}
        settingsHref={settingsHref}
        user={user || null}
        username={username}
      />
    </Sidebar>
  );
}
