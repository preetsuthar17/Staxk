"use client";

import {
  IconAlertTriangle,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import {
  type NavItem,
  Sidebar,
  SidebarBackButton,
  SidebarContent,
  SidebarNavMenu,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

interface WorkspaceSettingsSidebarProps {
  workspaceSlug: string;
}

export function WorkspaceSettingsSidebar({
  workspaceSlug,
}: WorkspaceSettingsSidebarProps) {
  const { isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const basePath = `/${workspaceSlug}/settings`;

  const isGeneralActive =
    pathname === `${basePath}/general` || pathname === basePath;
  const isMembersActive = pathname === `${basePath}/members`;
  const isDangerZoneActive = pathname === `${basePath}/danger-zone`;

  const settingsNavItems: NavItem[] = [
    {
      href: `${basePath}/general`,
      icon: IconSettings,
      label: "General",
      isActive: isGeneralActive,
      isWorkspaceAware: false,
    },
    {
      href: `${basePath}/members`,
      icon: IconUsers,
      label: "Members",
      isActive: isMembersActive,
      isWorkspaceAware: false,
    },
    {
      href: `${basePath}/danger-zone`,
      icon: IconAlertTriangle,
      label: "Danger Zone",
      isActive: isDangerZoneActive,
      isWorkspaceAware: false,
    },
  ];

  return (
    <Sidebar disabled={isPending}>
      <SidebarContent>
        <SidebarBackButton onClick={() => router.push(`/${workspaceSlug}`)} />
        <SidebarNavMenu items={settingsNavItems} />
      </SidebarContent>
    </Sidebar>
  );
}
