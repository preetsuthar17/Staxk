"use client";

import {
  IconCrown,
  IconShieldCheck,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import type { WorkspaceMemberData } from "@/lib/member";

interface WorkspaceMembersCardProps {
  workspaceSlug: string;
  currentUserRole: "owner" | "admin" | "member";
  currentUserId: string;
}

export function WorkspaceMembersCard({
  workspaceSlug,
  currentUserRole,
  currentUserId,
}: WorkspaceMembersCardProps) {
  const { members, isLoading, mutate } = useWorkspaceMembers(workspaceSlug);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] =
    useState<WorkspaceMemberData | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  const handleRoleChange = useCallback(
    async (member: WorkspaceMemberData, newRole: "admin" | "member") => {
      setIsUpdatingRole(member.userId);

      try {
        const response = await fetch(
          `/api/workspace/${encodeURIComponent(workspaceSlug)}/members`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: member.userId, role: newRole }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to update role");
          return;
        }

        toast.success("Role updated");
        mutate();
      } catch {
        toast.error("Failed to update role");
      } finally {
        setIsUpdatingRole(null);
      }
    },
    [workspaceSlug, mutate]
  );

  const handleRemoveMember = useCallback(async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);

    try {
      const response = await fetch(
        `/api/workspace/${encodeURIComponent(workspaceSlug)}/members?userId=${encodeURIComponent(memberToRemove.userId)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to remove member");
        return;
      }

      toast.success("Member removed");
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      mutate();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setIsRemoving(false);
    }
  }, [workspaceSlug, memberToRemove, mutate]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <IconCrown className="size-3.5" />;
      case "admin":
        return <IconShieldCheck className="size-3.5" />;
      default:
        return <IconUser className="size-3.5" />;
    }
  };

  const getRoleBadgeVariant = (
    role: string
  ): "default" | "secondary" | "outline" => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage workspace members</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-14 w-full" key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in this
            workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const canChangeRole = isOwner && member.role !== "owner";
            const canRemove =
              (canManage && member.role !== "owner" && !isSelf) ||
              (isSelf && member.role !== "owner");

            return (
              <div
                className="flex items-center justify-between rounded-lg border p-3"
                key={member.id}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback>
                      {member.name?.[0] || member.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {member.name || member.email}
                      {isSelf && (
                        <span className="ml-1 text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </span>
                    {member.name && (
                      <span className="text-muted-foreground text-xs">
                        {member.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canChangeRole ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button
                          className="h-7 gap-1.5"
                          disabled={isUpdatingRole === member.userId}
                          size="sm"
                          variant="ghost"
                        >
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={member.role === "admin"}
                          onClick={() => handleRoleChange(member, "admin")}
                        >
                          <IconShieldCheck className="mr-2 size-4" />
                          Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={member.role === "member"}
                          onClick={() => handleRoleChange(member, "member")}
                        >
                          <IconUser className="mr-2 size-4" />
                          Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Badge
                      className="gap-1"
                      variant={getRoleBadgeVariant(member.role)}
                    >
                      <span className="capitalize">{member.role}</span>
                    </Badge>
                  )}
                  {canRemove && (
                    <Button
                      onClick={() => {
                        setMemberToRemove(member);
                        setRemoveDialogOpen(true);
                      }}
                      size="icon-xs"
                      variant="ghost"
                    >
                      <IconTrash className="size-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setRemoveDialogOpen} open={removeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{memberToRemove?.name || memberToRemove?.email}</strong>{" "}
              from this workspace? They will lose access to all workspace
              resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemoving}
              onClick={handleRemoveMember}
            >
              {isRemoving ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
