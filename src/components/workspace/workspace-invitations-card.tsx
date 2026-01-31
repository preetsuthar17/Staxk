"use client";

import { IconTrash } from "@tabler/icons-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceInvitations } from "@/hooks/use-workspace-invitations";
import type { InvitationData } from "@/lib/invitation";

interface WorkspaceInvitationsCardProps {
  workspaceSlug: string;
}

export function WorkspaceInvitationsCard({
  workspaceSlug,
}: WorkspaceInvitationsCardProps) {
  const { invitations, isLoading, mutate } =
    useWorkspaceInvitations(workspaceSlug);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [invitationToRevoke, setInvitationToRevoke] =
    useState<InvitationData | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleCopyLink = useCallback(
    async (invitationId: string) => {
      const invitation = invitations.find((i) => i.id === invitationId);
      if (!invitation) return;

      try {
        const response = await fetch(
          `/api/workspace/${encodeURIComponent(workspaceSlug)}/invitations`
        );
        if (!response.ok) return;

        const origin = window.location.origin;
        const data = await response.json();
        const inv = data.invitations?.find(
          (i: { id: string }) => i.id === invitationId
        );
        if (!inv) {
          toast.error("Could not find invitation details");
          return;
        }

        toast.info("Fetching invitation link…");
      } catch {
        toast.error("Failed to copy link");
      }
    },
    [invitations, workspaceSlug]
  );

  const handleCopyInviteLink = useCallback(
    async (email: string) => {
      try {
        const response = await fetch(
          `/api/workspace/${encodeURIComponent(workspaceSlug)}/invitations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role: "member" }),
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data.invitation?.token) {
          const link = `${window.location.origin}/invite/${data.invitation.token}`;
          await navigator.clipboard.writeText(link);
          toast.success("Invitation link copied");
        }
      } catch {
        toast.error("Failed to copy link");
      }
    },
    [workspaceSlug]
  );

  const handleRevoke = useCallback(async () => {
    if (!invitationToRevoke) return;

    setIsRevoking(true);

    try {
      const response = await fetch(
        `/api/workspace/${encodeURIComponent(workspaceSlug)}/invitations?id=${encodeURIComponent(invitationToRevoke.id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to revoke invitation");
        return;
      }

      toast.success("Invitation revoked");
      setRevokeDialogOpen(false);
      setInvitationToRevoke(null);
      mutate();
    } catch {
      toast.error("Failed to revoke invitation");
    } finally {
      setIsRevoking(false);
    }
  }, [workspaceSlug, invitationToRevoke, mutate]);

  const formatExpiresAt = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  if (isLoading) {
    return (
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Invitations awaiting response</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <Skeleton className="h-14 w-full" key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            {invitations.length} pending invitation
            {invitations.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {invitations.map((invitation) => (
            <div
              className="flex items-center justify-between rounded-lg border p-3"
              key={invitation.id}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{invitation.email}</span>
                <span className="text-muted-foreground text-xs">
                  {formatExpiresAt(invitation.expiresAt)} · Invited by{" "}
                  {invitation.invitedBy.name || invitation.invitedBy.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="capitalize" variant="outline">
                  {invitation.role}
                </Badge>
                <Button
                  onClick={() => {
                    setInvitationToRevoke(invitation);
                    setRevokeDialogOpen(true);
                  }}
                  size="icon-xs"
                  variant="ghost"
                >
                  <IconTrash className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setRevokeDialogOpen} open={revokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation for{" "}
              <strong>{invitationToRevoke?.email}</strong>? They will no longer
              be able to join this workspace using this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isRevoking} onClick={handleRevoke}>
              {isRevoking ? "Revoking…" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
