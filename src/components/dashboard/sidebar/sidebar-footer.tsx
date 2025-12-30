"use client";

import { IconBug, IconHelpCircle, IconSettings } from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  type NavItem,
  SidebarFooter as SidebarFooterContainer,
  SidebarNavMenu,
} from "@/components/ui/sidebar";
import { LoadingUserProfile, UserProfile } from "./user-profile";
import { getWorkspaceSlug } from "./utils";

interface SidebarFooterProps {
  dicebearUrl: string;
  fallbackUrl: string;
  isPending: boolean;
  pathname: string;
  pendingUrl: string;
  settingsHref: string;
  user: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  } | null;
  username: string;
}

export function SidebarFooter({
  dicebearUrl,
  fallbackUrl,
  isPending,
  pathname,
  pendingUrl,
  settingsHref,
  user,
  username,
}: SidebarFooterProps) {
  const workspaceSlug = getWorkspaceSlug(pathname);
  const workspaceSettingsHref = workspaceSlug
    ? `/${workspaceSlug}/settings/general`
    : "/settings";

  const bottomNavItems: NavItem[] = [
    {
      href: workspaceSettingsHref,
      icon: IconSettings,
      label: "Settings",
      isWorkspaceAware: false,
    },
    {
      href: "/help",
      icon: IconHelpCircle,
      label: "Get Help",
      isWorkspaceAware: true,
    },
    {
      href: "/bug",
      icon: IconBug,
      label: "Report Bug",
      isWorkspaceAware: true,
    },
  ];

  const renderUserProfile = () => {
    if (isPending) {
      if (pendingUrl) {
        return <LoadingUserProfile fallbackUrl={pendingUrl} />;
      }
      return (
        <div className="flex w-full items-center gap-2.5 p-2">
          <Avatar>
            <AvatarFallback className="animate-pulse">...</AvatarFallback>
          </Avatar>
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      );
    }

    if (fallbackUrl) {
      return (
        <UserProfile
          dicebearUrl={dicebearUrl}
          fallbackUrl={fallbackUrl}
          settingsHref={settingsHref}
          user={user || null}
          username={username}
        />
      );
    }

    return (
      <div className="flex w-full items-center gap-2.5 p-2">
        <Avatar>
          <AvatarFallback className="animate-pulse">...</AvatarFallback>
        </Avatar>
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
    );
  };

  return (
    <SidebarFooterContainer>
      <SidebarNavMenu
        items={bottomNavItems}
        pathname={pathname}
        workspaceSlug={workspaceSlug}
      />
      <div className="flex w-full items-center">
        <div className="flex w-full items-center justify-between rounded-lg bg-secondary">
          {renderUserProfile()}
        </div>
      </div>
    </SidebarFooterContainer>
  );
}
