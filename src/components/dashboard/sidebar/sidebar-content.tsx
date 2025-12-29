"use client";

import { Home, Inbox } from "lucide-react";
import { useInvitationsCount } from "@/hooks/use-invitations-count";
import { NavMenu } from "./nav-menu";

interface SidebarContentProps {
  pathname: string;
  workspaceSlug: string | null;
}

export function SidebarContent({
  pathname,
  workspaceSlug,
}: SidebarContentProps) {
  const { count: invitationCount } = useInvitationsCount();

  const mainNavItems = [
    { href: "/", icon: Home, label: "Home" },
    {
      href: "/inbox",
      icon: Inbox,
      label: "Inbox",
      isWorkspaceAware: false,
      notificationCount: invitationCount,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <NavMenu
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
    </div>
  );
}
