"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { safeClientError } from "@/lib/client-logger";

interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

function getExpirationText(expiresAt: Date | null): string | null {
  if (!expiresAt) {
    return null;
  }

  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "Expired";
  }
  if (diffDays === 0) {
    return "Expires today";
  }
  if (diffDays === 1) {
    return "Expires in 1 day";
  }
  return `Expires in ${diffDays} days`;
}

const invitationsFetcher = async (url: string): Promise<Invitation[]> => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch invitations");
  }

  return data.invitations || [];
};

export function InvitationList() {
  const router = useRouter();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const {
    data: invitations = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Invitation[]>("/api/invitations", invitationsFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const handleAccept = async (invitationId: string, workspaceSlug: string) => {
    setProcessingIds((prev) => new Set(prev).add(invitationId));

    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      toast.success("Invitation accepted! You are now a member.");
      await mutate();
      window.dispatchEvent(new CustomEvent("invitations-updated"));
      router.push(`/${workspaceSlug}`);
      router.refresh();
    } catch (error) {
      safeClientError("Error accepting invitation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to accept invitation. Please try again."
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(invitationId);
        return next;
      });
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingIds((prev) => new Set(prev).add(invitationId));

    try {
      const response = await fetch(`/api/invitations/${invitationId}/decline`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to decline invitation");
      }

      toast.success("Invitation declined");
      await mutate();
      window.dispatchEvent(new CustomEvent("invitations-updated"));
    } catch (error) {
      safeClientError("Error declining invitation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to decline invitation. Please try again."
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(invitationId);
        return next;
      });
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            Failed to load invitations
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!invitations.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            You have no pending invitations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {invitations.map((invitation) => {
        const isProcessing = processingIds.has(invitation.id);
        const expiresAt = invitation.expiresAt
          ? new Date(invitation.expiresAt)
          : null;
        const isExpired = expiresAt ? expiresAt < new Date() : false;

        return (
          <Card className="p-4 sm:p-4" key={invitation.id}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-sm">
                        Invitation to {invitation.workspace.name}
                      </h3>
                      {expiresAt && (
                        <p className="whitespace-nowrap text-muted-foreground text-xs">
                          {getExpirationText(expiresAt)}
                        </p>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {invitation.inviter.name || invitation.inviter.email} has
                      invited you to join this workspace
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="flex items-center justify-center gap-1 text-xs"
                  disabled={isProcessing || isExpired}
                  onClick={() =>
                    handleAccept(invitation.id, invitation.workspace.slug)
                  }
                  size="sm"
                >
                  {isProcessing ? <Spinner /> : <>Accept</>}
                </Button>
                <Button
                  className="flex items-center justify-center gap-1 text-xs"
                  disabled={isProcessing}
                  onClick={() => handleDecline(invitation.id)}
                  size="sm"
                  variant="outline"
                >
                  {isProcessing ? <Spinner /> : <>Decline</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
