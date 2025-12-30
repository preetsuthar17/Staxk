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

      {/* <CollapsibleGroup defaultOpen label="Workspace">
        <NavLink
          href={buildWorkspaceUrl(workspaceSlug, "/projects")}
          icon={Folder}
          isActive={isWorkspaceRouteActive(
            pathname,
            workspaceSlug,
            "/projects"
          )}
        >
          Projects
        </NavLink>
        <NavLink
          href={buildWorkspaceUrl(workspaceSlug, "/members")}
          icon={Users}
          isActive={isWorkspaceRouteActive(pathname, workspaceSlug, "/members")}
        >
          Members
        </NavLink>
        <NavLink
          href={buildWorkspaceUrl(workspaceSlug, "/more")}
          icon={MoreHorizontal}
          isActive={isWorkspaceRouteActive(pathname, workspaceSlug, "/more")}
        >
          More
        </NavLink>
      </CollapsibleGroup>

      <CollapsibleGroup defaultOpen label="Your Projects">
        <ProjectItem defaultOpen iconColor="#10b981" name="HexaUI">
          <NavLink
            href={buildWorkspaceUrl(workspaceSlug, "/hexaui/issues")}
            icon={Folder}
            isActive={isWorkspaceRouteActive(
              pathname,
              workspaceSlug,
              "/hexaui/issues"
            )}
          >
            Issues
          </NavLink>
          <NavLink
            href={buildWorkspaceUrl(workspaceSlug, "/hexaui/projects")}
            icon={Folder}
            isActive={isWorkspaceRouteActive(
              pathname,
              workspaceSlug,
              "/hexaui/projects"
            )}
          >
            Projects
          </NavLink>
        </ProjectItem>
        <ProjectItem iconColor="#ef4444" name="Ikiform">
          <NavLink
            href={buildWorkspaceUrl(workspaceSlug, "/ikiform/issues")}
            icon={Folder}
            isActive={isWorkspaceRouteActive(
              pathname,
              workspaceSlug,
              "/ikiform/issues"
            )}
          >
            Issues
          </NavLink>
          <NavLink
            href={buildWorkspaceUrl(workspaceSlug, "/ikiform/projects")}
            icon={Folder}
            isActive={isWorkspaceRouteActive(
              pathname,
              workspaceSlug,
              "/ikiform/projects"
            )}
          >
            Projects
          </NavLink>
        </ProjectItem>
      </CollapsibleGroup> */}
    </SidebarContentContainer>
  );
}
