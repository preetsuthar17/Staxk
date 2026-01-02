"use client";

import {
  IconBell,
  IconBellFilled,
  IconSettings,
  IconSettingsFilled,
  IconShield,
  IconShieldFilled,
  IconUser,
  IconUserFilled,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export function SettingsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const menuItems = [
    {
      title: "General",
      url: "/settings",
      icon: IconSettings,
      iconFilled: IconSettingsFilled,
    },
    {
      title: "Profile",
      url: "/settings/profile",
      icon: IconUser,
      iconFilled: IconUserFilled,
    },
    {
      title: "Notifications",
      url: "/settings/notifications",
      icon: IconBell,
      iconFilled: IconBellFilled,
    },
    {
      title: "Security",
      url: "/settings/security",
      icon: IconShield,
      iconFilled: IconShieldFilled,
    },
  ];

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="-p-2">
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                const IconComponent = isActive ? item.iconFilled : item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => router.push(item.url)}
                      tooltip={item.title}
                    >
                      <IconComponent
                        className={
                          `${isActive
                            ? "fill-current text-muted-foreground contrast-200"
                            : ""}`
                        }
                      />
                      <span className="font-[490] text-sm">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex flex-col gap-1 px-2 py-1.5">
                <span className="font-medium text-sm">
                  {user.name || "User"}
                </span>
                {user.username && (
                  <span className="text-muted-foreground text-xs">
                    @{user.username}
                  </span>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
