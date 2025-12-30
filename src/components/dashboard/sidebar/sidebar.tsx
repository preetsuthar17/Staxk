"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { SidebarContent as DashboardSidebarContent } from "./sidebar-content";
import { SidebarFooter as DashboardSidebarFooter } from "./sidebar-footer";
import { getDicebearUrl, getRandomSeed, getUsername } from "./types";
import { getWorkspaceSlug } from "./utils";
import { WorkspaceSelector } from "./workspace-selector";

export function DashboardSidebar() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const [randomFallbackSeed, setRandomFallbackSeed] = useState<string | null>(
    null
  );
  const [randomPendingSeed, setRandomPendingSeed] = useState<string | null>(
    null
  );

  useEffect(() => {
    setRandomFallbackSeed(getRandomSeed());
    setRandomPendingSeed(getRandomSeed());
  }, []);

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
  const workspaceSlug = getWorkspaceSlug(pathname);

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
