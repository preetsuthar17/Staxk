"use client";

import { IconDots, IconFolder, IconUsersGroup } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavWorkspaceProps {
  currentSlug: string;
}

export function NavWorkspace({ currentSlug }: NavWorkspaceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <SidebarGroup>
      <Collapsible onOpenChange={setWorkspaceOpen} open={workspaceOpen}>
        <SidebarGroupLabel
          render={
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-1">
              <span>Workspace</span>
              <span
                className={`mt-0.5 scale-70 transition-transform ${workspaceOpen ? "rotate-90" : ""}`}
              >
                ▶
              </span>
            </CollapsibleTrigger>
          }
        />
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="flex-col gap-0">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="pl-4"
                  isActive={isActive(`/${currentSlug}/projects`)}
                  onClick={() => router.push(`/${currentSlug}/projects`)}
                >
                  <IconFolder className="size-4" />
                  <span className="font-[490] text-[13px]">Projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <DropdownMenu>
                  <SidebarMenuButton
                    className="pl-4"
                    render={
                      <DropdownMenuTrigger>
                        <IconDots className="size-4" />
                        <span className="font-[490] text-[13px]">More</span>
                      </DropdownMenuTrigger>
                    }
                  />
                  <DropdownMenuContent
                    align="end"
                    className="w-fit"
                    side="bottom"
                    sideOffset={8}
                  >
                    <DropdownMenuItem
                      onClick={() => router.push(`/${currentSlug}/teams`)}
                    >
                      <IconUsersGroup className="size-4" />
                      <span>Teams</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
