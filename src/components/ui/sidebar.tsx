"use client";

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Sidebar({
  children,
  className,
  disabled = false,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col bg-sidebar",
        disabled && "pointer-events-none cursor-not-allowed",
        className
      )}
    >
      {children}
    </aside>
  );
}

interface SidebarHeaderProps {
  children: ReactNode;
  className?: string;
}

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}

interface SidebarContentProps {
  children: ReactNode;
  className?: string;
}

export function SidebarContent({ children, className }: SidebarContentProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>{children}</div>
  );
}

interface SidebarFooterProps {
  children: ReactNode;
  className?: string;
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>{children}</div>
  );
}

export interface NavItem {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  isActive?: boolean;
  notificationCount?: number;
  isWorkspaceAware?: boolean;
}

interface SidebarNavLinkProps {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
  isActive?: boolean;
  notificationCount?: number;
  className?: string;
}

export function SidebarNavLink({
  href,
  icon: Icon,
  children,
  isActive = false,
  notificationCount = 0,
  className,
}: SidebarNavLinkProps) {
  const hasNotifications = notificationCount > 0;

  return (
    <li className="list-none">
      <Link
        aria-label={`${children} ${notificationCount > 0 ? `(${notificationCount})` : ""}`}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2 py-1.5 font-[480] text-[13.5px] transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent",
          className
        )}
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

interface SidebarNavMenuProps {
  items: NavItem[];
  pathname?: string;
  workspaceSlug?: string | null;
  className?: string;
}

function getWorkspaceSlug(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length > 0 &&
    segments[0] !== "settings" &&
    segments[0] !== "onboarding" &&
    segments[0] !== "home" &&
    segments[0] !== "login" &&
    segments[0] !== "signup" &&
    segments[0] !== "inbox" &&
    segments[0] !== "notifications" &&
    segments[0] !== "activity"
  ) {
    return segments[0];
  }
  return null;
}

function buildWorkspaceUrl(workspaceSlug: string | null, path: string): string {
  if (!workspaceSlug) {
    return path;
  }

  if (path === "/" || path === "") {
    return `/${workspaceSlug}`;
  }

  return `/${workspaceSlug}${path.startsWith("/") ? path : `/${path}`}`;
}

function isWorkspaceRouteActive(
  pathname: string,
  workspaceSlug: string | null,
  href: string
): boolean {
  if (!workspaceSlug) {
    return false;
  }

  if (href === "/" || href === "") {
    return (
      pathname === `/${workspaceSlug}` || pathname === `/${workspaceSlug}/`
    );
  }

  const workspaceHref = buildWorkspaceUrl(workspaceSlug, href);
  return pathname === workspaceHref || pathname.startsWith(`${workspaceHref}/`);
}

export function SidebarNavMenu({
  items,
  pathname,
  workspaceSlug,
  className,
}: SidebarNavMenuProps) {
  const pathnameFromHook = usePathname();
  const currentPathname = pathname || pathnameFromHook;
  const currentWorkspaceSlug =
    workspaceSlug ?? getWorkspaceSlug(currentPathname);

  return (
    <ul className={cn("flex list-none flex-col gap-0.5", className)}>
      {items.map((item) => {
        const workspaceHref =
          item.isWorkspaceAware === false
            ? item.href
            : buildWorkspaceUrl(currentWorkspaceSlug, item.href);

        let isActive: boolean;
        if (item.isActive !== undefined) {
          isActive = item.isActive;
        } else if (item.isWorkspaceAware === false) {
          isActive =
            currentPathname === item.href ||
            currentPathname.startsWith(`${item.href}/`);
        } else {
          isActive = isWorkspaceRouteActive(
            currentPathname,
            currentWorkspaceSlug,
            item.href
          );
        }

        return (
          <SidebarNavLink
            href={workspaceHref}
            icon={item.icon}
            isActive={isActive}
            key={item.label}
            notificationCount={item.notificationCount}
          >
            {item.label}
          </SidebarNavLink>
        );
      })}
    </ul>
  );
}

interface CollapsibleContentProps {
  children: ReactNode;
  isOpen: boolean;
}

function CollapsibleContent({ children, isOpen }: CollapsibleContentProps) {
  if (!isOpen) {
    return null;
  }

  return <div className="mt-1 ml-3 flex flex-col gap-0.5 pl-3">{children}</div>;
}

interface SidebarCollapsibleGroupProps {
  children: ReactNode;
  defaultOpen?: boolean;
  label: string;
  className?: string;
}

export function SidebarCollapsibleGroup({
  children,
  defaultOpen = false,
  label,
  className,
}: SidebarCollapsibleGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("flex flex-col", className)}>
      <button
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{label}</span>
        {isOpen ? (
          <IconChevronDown className="size-3 shrink-0" />
        ) : (
          <IconChevronRight className="size-3 shrink-0" />
        )}
      </button>
      <CollapsibleContent isOpen={isOpen}>{children}</CollapsibleContent>
    </div>
  );
}

interface SidebarBackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function SidebarBackButton({
  onClick,
  label = "Go back",
  className,
}: SidebarBackButtonProps) {
  return (
    <Button
      className={cn(
        "w-full cursor-pointer items-center justify-start gap-2 px-2",
        className
      )}
      onClick={onClick}
      size="sm"
      variant="ghost"
    >
      <IconChevronLeft /> {label}
    </Button>
  );
}
