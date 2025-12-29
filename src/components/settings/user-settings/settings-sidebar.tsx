"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronLeft,
  Lock,
  Settings as SettingsIcon,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  isActive: boolean;
}

function NavLink({ href, icon: Icon, children, isActive }: NavLinkProps) {
  return (
    <li className="flex w-full items-center">
      <Link
        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 font-[450] text-[13px] transition-colors ${
          isActive ? "bg-accent text-foreground" : "hover:bg-accent"
        }`}
        href={href}
      >
        <Icon className="size-4.5" /> {children}
      </Link>
    </li>
  );
}

interface NavMenuProps {
  items: Array<{
    href: string;
    icon: LucideIcon;
    label: string;
    isActive: boolean;
  }>;
}

function NavMenu({ items }: NavMenuProps) {
  return (
    <ul className="flex list-none flex-col gap-0.5">
      {items.map((item) => (
        <NavLink
          href={item.href}
          icon={item.icon}
          isActive={item.isActive}
          key={item.label}
        >
          {item.label}
        </NavLink>
      ))}
    </ul>
  );
}

export function SettingsSidebar() {
  const { isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);

  const basePath = "/settings";

  const isProfileActive =
    pathname === `${basePath}/profile` || pathname === basePath;

  const settingsNavItems = [
    {
      href: `${basePath}/profile`,
      icon: User,
      label: "Profile",
      isActive: isProfileActive,
    },
    {
      href: `${basePath}/preferences`,
      icon: SettingsIcon,
      label: "Preferences",
      isActive: pathname === `${basePath}/preferences`,
    },
    {
      href: `${basePath}/notification`,
      icon: Bell,
      label: "Notification",
      isActive: pathname === `${basePath}/notification`,
    },
    {
      href: `${basePath}/security`,
      icon: Lock,
      label: "Security",
      isActive: pathname === `${basePath}/security`,
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
    <aside
      className={`flex h-screen w-64 flex-col bg-card ${
        isPending ? "pointer-events-none cursor-not-allowed" : ""
      }`}
    >
      <div className="flex flex-col gap-4 p-4">
        <Button
          className="w-full cursor-pointer items-center justify-start gap-2 px-2"
          onClick={handleGoBack}
          size={"sm"}
          variant="ghost"
        >
          <ChevronLeft /> Go back
        </Button>
        <NavMenu items={settingsNavItems} />
      </div>
    </aside>
  );
}
