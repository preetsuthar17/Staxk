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

interface CachedUserData {
  email?: string | null;
  image?: string | null;
  name?: string | null;
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
  const [cachedUser, setCachedUser] = useState<CachedUserData | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem("userProfile");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CachedUserData;
        setCachedUser(parsed);
      } catch {
        // Invalid cache, ignore
      }
    }
    setRandomFallbackSeed(getRandomSeed());
    setRandomPendingSeed(getRandomSeed());
  }, []);

  useEffect(() => {
    if (session?.user) {
      const userData: CachedUserData = {
        email: session.user.email,
        image: session.user.image,
        name: session.user.name,
      };
      setCachedUser(userData);
      sessionStorage.setItem("userProfile", JSON.stringify(userData));
    } else if (session === null) {
      setCachedUser(null);
      sessionStorage.removeItem("userProfile");
    }
  }, [session]);

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

  const user = session?.user || cachedUser;
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

  const shouldShowLoading = isPending && !cachedUser;

  return (
    <Sidebar className="justify-between" disabled={shouldShowLoading}>
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
        isPending={shouldShowLoading}
        pathname={pathname}
        pendingUrl={randomPendingUrl}
        settingsHref={settingsHref}
        user={user || null}
        username={username}
      />
    </Sidebar>
  );
}
