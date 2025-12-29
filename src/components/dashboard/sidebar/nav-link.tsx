"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface NavLinkProps {
  children: React.ReactNode;
  href: string;
  icon: LucideIcon;
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
        className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 font-[450] text-[13px] transition-colors ${
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent"
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
