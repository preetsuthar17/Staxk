"use client";

import { IconBuilding, IconChevronsDown, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
   logo: string | null;
  role: "owner" | "admin" | "member";
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentSlug: string;
  isLoading?: boolean;
  onWorkspaceCreated?: (workspace: {
    id: string;
    name: string;
    slug: string;
  }) => void;
}

function WorkspaceSwitcherSkeleton() {
  return (
    <>
      <Skeleton className="size-8 rounded-lg" />
      <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="size-4" />
    </>
  );
}

export function WorkspaceSwitcher({
  workspaces,
  currentSlug,
  isLoading = false,
  onWorkspaceCreated,
}: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [activeWorkspace, setActiveWorkspace] = useState(
    workspaces.find((w) => w.slug === currentSlug) || workspaces[0]
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const current = workspaces.find((w) => w.slug === currentSlug);
    if (current) {
      setActiveWorkspace(current);
    }
  }, [currentSlug, workspaces]);

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <WorkspaceSwitcherSkeleton />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!activeWorkspace) {
    return null;
  }

  const handleWorkspaceChange = (slug: string) => {
    if (slug === activeWorkspace.slug) {
      return;
    }
    setActiveWorkspace(
      workspaces.find((w) => w.slug === slug) || activeWorkspace
    );
    router.push(`/${slug}`);
  };

  const handleWorkspaceCreated = (workspace: {
    id: string;
    name: string;
    slug: string;
  }) => {
    onWorkspaceCreated?.(workspace);
    router.push(`/${workspace.slug}`);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      case "member":
        return "Member";
      default:
        return "Member";
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              >
                <Avatar
                  className="bg-sidebar-primary text-sidebar-primary-foreground"
                  size="default"
                >
                  {activeWorkspace.logo ? (
                    <AvatarImage
                      alt={`${activeWorkspace.name} logo`}
                      src={activeWorkspace.logo}
                    />
                  ) : (
                    <AvatarFallback>
                      <IconBuilding
                        aria-hidden="true"
                        className="size-4"
                      />
                      <span className="sr-only">
                        {activeWorkspace.name}
                      </span>
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeWorkspace.name}
                  </span>
                  <span className="truncate text-xs">
                    {getRoleLabel(activeWorkspace.role)}
                  </span>
                </div>
                <IconChevronsDown className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((workspace, index) => (
                <DropdownMenuItem
                  className="gap-2 p-2"
                  key={workspace.id}
                  onClick={() => handleWorkspaceChange(workspace.slug)}
                >
                  <Avatar size="sm">
                    {workspace.logo ? (
                      <AvatarImage
                        alt={`${workspace.name} logo`}
                        src={workspace.logo}
                      />
                    ) : (
                      <AvatarFallback className="rounded-md">
                        <IconBuilding
                          aria-hidden="true"
                          className="size-3.5 shrink-0"
                        />
                        <span className="sr-only">{workspace.name}</span>
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {workspace.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setIsDialogOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <IconPlus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add workspace
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <CreateWorkspaceDialog
        onOpenChange={setIsDialogOpen}
        onSuccess={handleWorkspaceCreated}
        open={isDialogOpen}
      />
    </SidebarMenu>
  );
}
