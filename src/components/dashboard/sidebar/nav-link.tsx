"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

interface NavLinkProps {
  children: React.ReactNode;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive?: boolean;
  notificationCount?: number;
}

export function NavLink({
  children,
  href,
  icon: Icon,
  isActive = false,
  notificationCount = 0,
}: NavLinkProps) {
  const hasNotifications = notificationCount > 0;

  return (
    <li className="list-none">
      <Link
        aria-label={`${children} ${notificationCount > 0 ? `(${notificationCount})` : ""}`}
        className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 font-[480] text-[13.5px] transition-colors ${
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent"
        }`}
        href={href}
      >
        <div className="relative">
          <Icon className="size-4 shrink-0" />
          {hasNotifications && (
            <span
              className="absolute -top-1 -right-1 size-1.5 rounded-full bg-primary"
              title={`${notificationCount} notification${notificationCount > 1 ? "s" : ""}`}
            />
          )}
        </div>
        <span>{children}</span>
      </Link>
    </li>
  );
}
