"use client";

import {
  IconBell,
  IconLock,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type NavItem,
  Sidebar,
  SidebarBackButton,
  SidebarContent,
  SidebarNavMenu,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

export function SettingsSidebar() {
  const { isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);

  const basePath = "/settings";

  const isProfileActive =
    pathname === `${basePath}/profile` || pathname === basePath;

  const settingsNavItems: NavItem[] = [
    {
      href: `${basePath}/profile`,
      icon: IconUser,
      label: "Profile",
      isActive: isProfileActive,
      isWorkspaceAware: false,
    },
    {
      href: `${basePath}/preferences`,
      icon: IconSettings,
      label: "Preferences",
      isActive: pathname === `${basePath}/preferences`,
      isWorkspaceAware: false,
    },
    {
      href: `${basePath}/notification`,
      icon: IconBell,
      label: "Notification",
      isActive: pathname === `${basePath}/notification`,
      isWorkspaceAware: false,
    },
    {
      href: `${basePath}/security`,
      icon: IconLock,
      label: "Security",
      isActive: pathname === `${basePath}/security`,
      isWorkspaceAware: false,
    },
  ];

  useEffect(() => {
    async function getWorkspaces() {
      try {
        const response = await fetch("/api/workspace/list");
        const data = await response.json();
        return Array.isArray(data.workspaces) ? data.workspaces : [];
      } catch {
        return [];
      }
    }

    async function loadWorkspace() {
      const workspaceId = localStorage.getItem("currentWorkspaceId");
      const workspaces = await getWorkspaces();

      if (workspaceId && workspaces.length > 0) {
        const found = workspaces.find(
          (ws: { id: string }) => ws.id === workspaceId
        );
        if (found) {
          setWorkspaceSlug(found.slug);
          return;
        }
      }

      if (workspaces.length > 0) {
        setWorkspaceSlug(workspaces[0].slug);
      }
    }

    loadWorkspace();
  }, []);

  const handleGoBack = () => {
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}`);
    } else {
      router.push("/home");
    }
  };

  return (
    <Sidebar disabled={isPending}>
      <SidebarContent>
        <SidebarBackButton onClick={handleGoBack} />
        <SidebarNavMenu items={settingsNavItems} />
      </SidebarContent>
    </Sidebar>
  );
}
