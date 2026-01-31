"use client";

import {
  IconAlertTriangle,
  IconHelp,
  IconSettings,
  IconSettingsFilled,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavFooterProps {
  currentSlug: string;
}

export function NavFooter({ currentSlug }: NavFooterProps) {
  const pathname = usePathname();
  const router = useRouter();

  const settingsUrl = `/${currentSlug}/settings`;
  const isSettingsActive =
    pathname === settingsUrl || pathname.startsWith(`${settingsUrl}/`);

  const footerItems = [
    {
      title: "Settings",
      icon: isSettingsActive ? IconSettingsFilled : IconSettings,
      onClick: () => {
        router.push(settingsUrl);
      },
    },
    {
      title: "Get Help",
      icon: IconHelp,
      onClick: () => {},
    },
    {
      title: "Report",
      icon: IconAlertTriangle,
      onClick: () => {},
    },
  ];

  return (
    <SidebarMenu>
      {footerItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={item.title === "Settings" ? isSettingsActive : false}
              onClick={item.onClick}
              tooltip={item.title}
            >
              <IconComponent
                className={
                  item.title === "Settings" && isSettingsActive
                    ? "fill-current text-muted-foreground contrast-200"
                    : ""
                }
              />
              <span className="font-[490] text-[13px]">{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
