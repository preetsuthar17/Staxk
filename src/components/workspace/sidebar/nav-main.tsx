"use client";

import {
  IconBug,
  IconHome,
  IconHomeFilled,
  IconInbox,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavMainProps {
  currentSlug: string;
}

export function NavMain({ currentSlug }: NavMainProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      title: "Home",
      url: `/${currentSlug}`,
      icon: IconHome,
      iconFilled: IconHomeFilled,
    },
    {
      title: "Inbox",
      url: `/${currentSlug}/inbox`,
      icon: IconInbox,
      iconFilled: IconInbox,
    },
    {
      title: "My Issues",
      url: `/${currentSlug}/issues`,
      icon: IconBug,
      iconFilled: IconBug,
    },
  ];

  const isActive = (url: string) => {
    return pathname === url;
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const active = isActive(item.url);
            const IconComponent = active ? item.iconFilled : item.icon;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={active}
                  onClick={() => router.push(item.url)}
                  tooltip={item.title}
                >
                  <IconComponent
                    className={
                      active
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
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
