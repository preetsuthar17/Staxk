"use client";

import { Crown, LogOut, MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getDicebearUrl,
  getUsername,
} from "@/components/dashboard/sidebar/types";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { safeClientError } from "@/lib/client-logger";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email.trim()) {
    return { valid: false, error: "Email is required" };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface MembersSettingsProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: "owner" | "member";
}

interface MemberItemProps {
  member: Member;
  canManage: boolean;
  onRemove: (memberId: string, memberName: string) => void;
}

function MemberItem({ member, canManage, onRemove }: MemberItemProps) {
  const username = getUsername(member.user.email, member.user.name);
  const dicebearUrl = getDicebearUrl(username);
  const avatarSrc = member.user.image || dicebearUrl;
  const isOwner = member.role === "owner";
  const canRemove = canManage && !isOwner;

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar size="sm">
          <AvatarImage alt={member.user.name || "Member"} src={avatarSrc} />
          <AvatarFallback className="overflow-hidden p-0">
            <Image
              alt={member.user.name || "Member"}
              className="size-full object-cover"
              height={40}
              src={dicebearUrl}
              width={40}
            />
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-sm">
              {member.user.name || username}
            </p>
            {isOwner && <Crown className="size-3.5 shrink-0 text-yellow-600" />}
          </div>
          <p className="truncate text-muted-foreground text-xs">
            {member.user.email}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={isOwner ? "default" : "secondary"}>
          {isOwner ? "Owner" : "Member"}
        </Badge>
        {canRemove && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button
                  {...props}
                  className="size-8"
                  size="icon"
                  variant="ghost"
                >
                  <MoreVertical className="size-4" />
                </Button>
              )}
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  onRemove(member.id, member.user.name || username)
                }
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export function MembersSettings({ workspace, userRole }: MembersSettingsProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateEmail(email);
    if (!validation.valid) {
      setEmailError(validation.error || "Invalid email");
      return;
    }

    setEmailError(null);
    setIsInviting(true);

    try {
      const response = await fetch(`/api/workspace/${workspace.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      toast.success("Invitation sent successfully");
      setEmail("");
      handleInviteSuccess();
      router.refresh();
    } catch (error) {
      safeClientError("Error sending invitation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send invitation. Please try again."
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      const validation = validateEmail(value);
      if (validation.valid) {
        setEmailError(null);
      }
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/workspace/${workspace.id}/members`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch members");
        }

        setMembers(data.members || []);
      } catch (error) {
        safeClientError("Error fetching members:", error);
        toast.error("Failed to load members");
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [workspace.id]);

  const handleInviteSuccess = () => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/workspace/${workspace.id}/members`);
        const data = await response.json();

        if (response.ok) {
          setMembers(data.members || []);
        }
      } catch {
        // Silently ignore fetch errors
      }
    };

    fetchMembers();
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setShowRemoveDialog(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) {
      return;
    }

    setIsRemoving(true);

    try {
      const response = await fetch(
        `/api/workspace/${workspace.id}/members/${memberToRemove.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove member");
      }

      toast.success(
        `${memberToRemove.name} has been removed from the workspace`
      );
      setShowRemoveDialog(false);
      setMemberToRemove(null);
      handleInviteSuccess();
      router.refresh();
    } catch (error) {
      safeClientError("Error removing member:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove member. Please try again."
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleLeaveWorkspace = async () => {
    setIsLeaving(true);

    try {
      const response = await fetch(`/api/workspace/${workspace.id}/leave`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave workspace");
      }

      const workspacesResponse = await fetch("/api/workspace/list");
      const workspacesData = await workspacesResponse.json();

      if (workspacesResponse.ok && workspacesData.workspaces) {
        const workspaces = workspacesData.workspaces;

        if (workspaces.length > 0) {
          const ownWorkspace = workspaces.find(
            (ws: { role: string }) => ws.role === "owner"
          );
          const targetWorkspace = ownWorkspace || workspaces[0];

          localStorage.setItem("lastWorkspace", targetWorkspace.slug);
          localStorage.setItem("currentWorkspaceId", targetWorkspace.id);
          router.push(`/${targetWorkspace.slug}`);
        } else {
          router.push("/");
        }
      } else {
        router.push("/");
      }

      toast.success("You have left the workspace");
      router.refresh();
    } catch (error) {
      safeClientError("Error leaving workspace:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to leave workspace. Please try again."
      );
      setIsLeaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-xl">Members</h1>
        <p className="text-muted-foreground text-sm">
          Invite team members to collaborate in this workspace
        </p>
      </div>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <div className="flex w-full flex-col items-start gap-4">
            <div className="flex w-full flex-col gap-2">
              <Label className="font-medium text-sm" htmlFor="invite-email">
                Invite by email
              </Label>
              <form className="flex w-full gap-2" onSubmit={handleInvite}>
                <div className="flex-1">
                  <Input
                    aria-describedby={
                      emailError ? "email-error" : "email-helper"
                    }
                    aria-invalid={emailError ? "true" : "false"}
                    className="h-9"
                    disabled={isInviting}
                    id="invite-email"
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="colleague@example.com"
                    type="email"
                    value={email}
                  />
                  {emailError ? (
                    <p
                      className="mt-2 text-destructive text-xs"
                      id="email-error"
                      role="alert"
                    >
                      {emailError}
                    </p>
                  ) : (
                    <p
                      className="mt-2 text-muted-foreground text-xs"
                      id="email-helper"
                    >
                      Enter an email address to send an invitation
                    </p>
                  )}
                </div>
                <Button
                  className="h-9"
                  disabled={isInviting || !email.trim()}
                  type="submit"
                >
                  {isInviting ? <Spinner /> : <>Invite</>}
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="font-medium text-base">Members</h2>
              <p className="text-muted-foreground text-xs">
                {members.length} {members.length === 1 ? "member" : "members"}{" "}
                in this workspace
              </p>
            </div>
          </div>

          {loadingMembers && (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          )}
          {!loadingMembers && members.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground text-sm">No members yet</p>
            </div>
          )}
          {!loadingMembers && members.length > 0 && (
            <div className="flex flex-col">
              {members.map((member, index) => (
                <div key={member.id}>
                  <MemberItem
                    canManage={userRole === "owner"}
                    member={member}
                    onRemove={handleRemoveMember}
                  />
                  {index < members.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {userRole === "member" && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="font-medium text-base">Danger Zone</h2>
              <p className="text-muted-foreground text-xs">
                Leave this workspace. You can be re-invited later.
              </p>
            </div>
            <Button
              className="w-fit"
              onClick={() => setShowLeaveDialog(true)}
              variant="destructive"
            >
              <LogOut className="size-4" />
              Leave Workspace
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog onOpenChange={setShowLeaveDialog} open={showLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave &quot;{workspace.name}&quot;? You
              will lose access to this workspace and can only rejoin if you are
              invited again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30"
              disabled={isLeaving}
              onClick={handleLeaveWorkspace}
            >
              {isLeaving ? <Spinner className="size-4" /> : "Leave Workspace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={setShowRemoveDialog} open={showRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{memberToRemove?.name}&quot;
              from this workspace? They will lose access immediately and can
              only rejoin if invited again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30"
              disabled={isRemoving}
              onClick={confirmRemoveMember}
            >
              {isRemoving ? <Spinner className="size-4" /> : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
