"use client";

import { IconTrash, IconUserPlus } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamMemberData } from "@/lib/team";

interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

interface TeamMembersCardProps {
  workspaceSlug: string;
  teamIdentifier: string;
}

export function TeamMembersCard({
  workspaceSlug,
  teamIdentifier,
}: TeamMembersCardProps) {
  const [members, setMembers] = useState<TeamMemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberData | null>(
    null
  );
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>(
    []
  );
  const [isLoadingWorkspaceMembers, setIsLoadingWorkspaceMembers] =
    useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"lead" | "member">("member");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/team/${encodeURIComponent(teamIdentifier)}/members?workspaceSlug=${encodeURIComponent(workspaceSlug)}`
      );

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, teamIdentifier]);

  const fetchWorkspaceMembers = useCallback(async () => {
    setIsLoadingWorkspaceMembers(true);
    try {
      const response = await fetch(
        `/api/workspace/${encodeURIComponent(workspaceSlug)}/members`
      );

      if (response.ok) {
        const data = await response.json();
        setWorkspaceMembers(data.members);
      }
    } catch (error) {
      console.error("Error fetching workspace members:", error);
    } finally {
      setIsLoadingWorkspaceMembers(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleOpenAddDialog = useCallback(() => {
    setAddDialogOpen(true);
    fetchWorkspaceMembers();
  }, [fetchWorkspaceMembers]);

  const availableMembers = workspaceMembers.filter(
    (wm) => !members.some((m) => m.id === wm.userId)
  );

  const handleAddMember = useCallback(async () => {
    if (!selectedUserId) {
      toast.error("Please select a member to add");
      return;
    }

    setIsAddingMember(true);

    try {
      const response = await fetch(
        `/api/team/${encodeURIComponent(teamIdentifier)}/members?workspaceSlug=${encodeURIComponent(workspaceSlug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUserId,
            role: selectedRole,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to add member");
        return;
      }

      toast.success("Member added");
      setAddDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("member");
      fetchMembers();
    } catch {
      toast.error("Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  }, [
    workspaceSlug,
    teamIdentifier,
    selectedUserId,
    selectedRole,
    fetchMembers,
  ]);

  const handleRemoveMember = useCallback(async () => {
    if (!memberToRemove) return;

    setIsRemovingMember(true);

    try {
      const response = await fetch(
        `/api/team/${encodeURIComponent(teamIdentifier)}/members?workspaceSlug=${encodeURIComponent(workspaceSlug)}&userId=${encodeURIComponent(memberToRemove.id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to remove member");
        return;
      }

      toast.success("Member removed");
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      fetchMembers();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setIsRemovingMember(false);
    }
  }, [workspaceSlug, teamIdentifier, memberToRemove, fetchMembers]);

  const openRemoveDialog = useCallback((member: TeamMemberData) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage team members</CardDescription>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Manage who has access to this team
            </CardDescription>
          </div>
          <Button onClick={handleOpenAddDialog} size="sm">
            <IconUserPlus className="mr-1.5 size-4" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {members.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground text-sm">
              No members in this team yet
            </p>
          ) : (
            members.map((member) => (
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
                    </span>
                    {member.name && (
                      <span className="text-muted-foreground text-xs">
                        {member.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={member.role === "lead" ? "default" : "secondary"}
                  >
                    {member.role === "lead" ? "Lead" : "Member"}
                  </Badge>
                  <Button
                    onClick={() => openRemoveDialog(member)}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <IconTrash className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog onOpenChange={setAddDialogOpen} open={addDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a workspace member to this team.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Select
              onValueChange={(val) => setSelectedUserId(val ?? "")}
              value={selectedUserId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingWorkspaceMembers
                      ? "Loading members…"
                      : "Select a member"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.length === 0 ? (
                  <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                    {isLoadingWorkspaceMembers
                      ? "Loading…"
                      : "No available members to add"}
                  </div>
                ) : (
                  availableMembers.map((wm) => (
                    <SelectItem key={wm.userId} value={wm.userId}>
                      {wm.name || wm.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(val) => {
                if (val) setSelectedRole(val as "lead" | "member");
              }}
              value={selectedRole}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              disabled={isAddingMember}
              onClick={() => setAddDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isAddingMember || !selectedUserId}
              loading={isAddingMember}
              onClick={handleAddMember}
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setRemoveDialogOpen} open={removeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{memberToRemove?.name || memberToRemove?.email}</strong>{" "}
              from this team? They can be re-added later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovingMember}
              onClick={handleRemoveMember}
            >
              {isRemovingMember ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
