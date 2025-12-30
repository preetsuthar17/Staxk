"use client";

import { IconBell, IconHome, IconInbox } from "@tabler/icons-react";
import {
  type NavItem,
  SidebarContent as SidebarContentContainer,
  SidebarNavMenu,
} from "@/components/ui/sidebar";
import { useInvitationsCount } from "@/hooks/use-invitations-count";

interface SidebarContentProps {
  pathname: string;
  workspaceSlug: string | null;
}

export function SidebarContent({
  pathname,
  workspaceSlug,
}: SidebarContentProps) {
  const { count: invitationCount } = useInvitationsCount();

  const mainNavItems: NavItem[] = [
    { href: "/", icon: IconHome, label: "Home" },
    {
      href: "/activity",
      icon: IconInbox,
      label: "Activity",
    },
    {
      href: "/notifications",
      icon: IconBell,
      label: "Notifications",
      isWorkspaceAware: false,
      notificationCount: invitationCount,
    },
  ];

  return (
    <SidebarContentContainer>
      <SidebarNavMenu
        items={mainNavItems}
        pathname={pathname}
        workspaceSlug={workspaceSlug}
      />
    </SidebarContentContainer>
  );
}
