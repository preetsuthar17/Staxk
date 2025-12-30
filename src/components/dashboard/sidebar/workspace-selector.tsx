"use client";

import { IconBuilding, IconChevronDown } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { signOut } from "@/lib/auth-client";
import { safeClientError } from "@/lib/client-logger";
import { getWorkspaceSlug } from "./utils";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
}

interface WorkspaceSelectorProps {
  pathname: string;
}

const SLUG_REGEX = /^[a-z][a-z0-9-]*$/;

export function WorkspaceSelector({ pathname }: WorkspaceSelectorProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    const cached = sessionStorage.getItem("workspaces");
    if (cached) {
      try {
        const parsedWorkspaces = JSON.parse(cached);
        if (Array.isArray(parsedWorkspaces) && parsedWorkspaces.length > 0) {
          setWorkspaces(parsedWorkspaces);
          setIsLoading(false);
        }
      } catch {
        // Invalid cache, continue to fetch
      }
    }

    try {
      const res = await fetch("/api/workspace/list", { cache: "no-store" });
      const data = await res.json();

      if (data.workspaces) {
        setWorkspaces(data.workspaces);
        sessionStorage.setItem("workspaces", JSON.stringify(data.workspaces));
      }
    } catch {
      // Error fetching, but we may have cached data to show
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const currentSlug = getWorkspaceSlug(pathname);

  const lastSlug =
    typeof window !== "undefined"
      ? localStorage.getItem("lastWorkspaceSlug")
      : null;

  const currentWorkspace =
    workspaces.find((ws) => ws.slug === currentSlug) ||
    (lastSlug ? workspaces.find((ws) => ws.slug === lastSlug) : undefined);

  const handleWorkspaceSelect = (workspace: Workspace) => {
    localStorage.setItem("currentWorkspaceId", workspace.id);
    localStorage.setItem("lastWorkspaceSlug", workspace.slug);
    router.push(`/${workspace.slug}`);
  };

  const handleWorkspaceLogout = async () => {
    try {
      localStorage.removeItem("currentWorkspaceId");
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      safeClientError("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(false);
      setSlugError(null);
      return;
    }

    if (!SLUG_REGEX.test(slug)) {
      setSlugAvailable(false);
      setSlugError(
        "Must start with a letter and contain only lowercase letters, numbers, and hyphens"
      );
      return;
    }

    if (slug.endsWith("-")) {
      setSlugAvailable(false);
      setSlugError("Cannot end with a hyphen");
      return;
    }

    if (slug.includes("--")) {
      setSlugAvailable(false);
      setSlugError("Cannot contain consecutive hyphens");
      return;
    }

    setIsCheckingSlug(true);
    try {
      const response = await fetch(
        `/api/workspace/check-slug?slug=${encodeURIComponent(slug)}`
      );
      const data = await response.json();
      setSlugAvailable(data.available);
      setSlugError(data.error || null);
    } catch {
      setSlugError("Failed to check availability");
      setSlugAvailable(false);
    } finally {
      setIsCheckingSlug(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (workspaceSlug) {
        checkSlugAvailability(workspaceSlug);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [workspaceSlug, checkSlugAvailability]);

  const handleSlugChange = (value: string) => {
    const newValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setWorkspaceSlug(newValue);
    setSlugAvailable(false);
    setSlugError(null);
  };

  const validateWorkspaceInput = (): boolean => {
    if (!(workspaceName.trim() && workspaceSlug.trim())) {
      toast.error("Workspace name and slug are required");
      return false;
    }

    if (!slugAvailable || slugError) {
      toast.error("Please fix the slug errors before creating");
      return false;
    }

    return true;
  };

  const resetWorkspaceForm = () => {
    setWorkspaceName("");
    setWorkspaceSlug("");
    setWorkspaceDescription("");
    setSlugError(null);
    setSlugAvailable(false);
  };

  const handleCreateWorkspace = async () => {
    if (!validateWorkspaceInput()) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName,
          slug: workspaceSlug,
          description: workspaceDescription || null,
          isOnboarding: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create workspace");
      }

      toast.success("Workspace created successfully");
      setIsDialogOpen(false);
      resetWorkspaceForm();

      const updatedWorkspaces = [
        ...workspaces,
        {
          id: data.id,
          name: workspaceName,
          slug: data.slug,
          description: workspaceDescription || null,
          logo: null,
          role: "owner",
        },
      ];
      setWorkspaces(updatedWorkspaces);
      sessionStorage.setItem("workspaces", JSON.stringify(updatedWorkspaces));

      localStorage.setItem("currentWorkspaceId", data.id);
      localStorage.setItem("lastWorkspaceSlug", data.slug);
      router.push(`/${data.slug}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create workspace"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex h-9 w-full items-center justify-between rounded-lg bg-secondary">
          <div className="flex w-full items-center gap-2.5 p-2">
            <Avatar className="size-6 shrink-0">
              <AvatarFallback className="animate-pulse rounded-xs bg-muted" />
            </Avatar>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg p-0 text-left transition-colors hover:bg-secondary/80">
            <div className="flex w-full items-center gap-2.5 p-2">
              <Avatar className="size-5 shrink-0">
                <AvatarImage
                  alt={currentWorkspace?.name || "Workspace"}
                  src={currentWorkspace?.logo || undefined}
                />
                <AvatarFallback className="rounded-xs bg-primary/10 font-medium text-primary text-xs">
                  {currentWorkspace?.name?.charAt(0).toUpperCase() || (
                    <IconBuilding className="size-3" />
                  )}
                </AvatarFallback>
              </Avatar>
              <p className="truncate font-medium text-sm">
                {currentWorkspace?.name || "Select workspace"}
              </p>
            </div>
            <div className="p-2">
              <IconChevronDown className="size-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--anchor-width] origin-top-left transform shadow-xs"
          >
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span className="font-[450] text-xs">Switch workspace</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[--anchor-width] origin-left transform shadow-xs">
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    className="flex items-center gap-2.5"
                    key={workspace.id}
                    onClick={() => handleWorkspaceSelect(workspace)}
                  >
                    <Avatar className="size-4 shrink-0">
                      <AvatarImage
                        alt={workspace.name}
                        src={workspace.logo || undefined}
                      />
                      <AvatarFallback className="rounded-xs bg-primary/10 font-medium text-primary text-xs">
                        {workspace.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <p className="font-[450] text-xs">{workspace.name}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2.5"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <span className="font-[450] text-sm">
                    Create new workspace
                  </span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {currentSlug && (
              <DropdownMenuItem
                className="flex items-center gap-2.5"
                onClick={handleWorkspaceLogout}
                variant="destructive"
              >
                <span className="font-[450] text-xs">Logout</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="gap-6">
          <DialogHeader>
            <DialogTitle>Create new workspace</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                maxLength={50}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Workspace"
                value={workspaceName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="workspace-slug">Workspace URL</Label>
              <div className="flex items-center gap-0">
                <span className="flex h-10 items-center rounded-l-md border border-input border-r-0 bg-muted px-3 text-muted-foreground text-sm">
                  staxk.app/
                </span>
                <Input
                  className="rounded-l-none"
                  id="workspace-slug"
                  maxLength={30}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-workspace"
                  value={workspaceSlug}
                />
              </div>
              {isCheckingSlug && (
                <p className="text-muted-foreground text-xs">
                  Checking availability...
                </p>
              )}
              {slugError && (
                <p className="text-destructive text-xs">{slugError}</p>
              )}
              {slugAvailable && !slugError && (
                <p className="text-green-600 text-xs">✓ Available</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="workspace-description">
                Description (optional)
              </Label>
              <Textarea
                id="workspace-description"
                maxLength={500}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                placeholder="Describe your workspace"
                value={workspaceDescription}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={
                  isCreating ||
                  !slugAvailable ||
                  !workspaceName.trim() ||
                  !workspaceSlug.trim()
                }
                onClick={handleCreateWorkspace}
              >
                {isCreating ? (
                  <Spinner className="size-4" />
                ) : (
                  "Create workspace"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
