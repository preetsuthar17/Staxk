"use client";

import type { LucideIcon } from "lucide-react";
import { NavLink } from "./nav-link";
import { buildWorkspaceUrl, isWorkspaceRouteActive } from "./utils";

interface NavMenuItem {
  href: string;
  icon: LucideIcon;
  label: string;
  isWorkspaceAware?: boolean;
  notificationCount?: number;
}

interface NavMenuProps {
  items: NavMenuItem[];
  pathname: string;
  workspaceSlug: string | null;
}

export function NavMenu({ items, pathname, workspaceSlug }: NavMenuProps) {
  return (
    <ul className="flex list-none flex-col gap-0.5">
      {items.map((item) => {
        const workspaceHref =
          item.isWorkspaceAware === false
            ? item.href
            : buildWorkspaceUrl(workspaceSlug, item.href);
        const isActive =
          item.isWorkspaceAware === false
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : isWorkspaceRouteActive(pathname, workspaceSlug, item.href);

        return (
          <NavLink
            href={workspaceHref}
            icon={item.icon}
            isActive={isActive}
            key={item.label}
            notificationCount={item.notificationCount}
          >
            {item.label}
          </NavLink>
        );
      })}
    </ul>
  );
}
