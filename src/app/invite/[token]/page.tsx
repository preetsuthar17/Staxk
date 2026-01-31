"use client";

import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InvitationDetails {
  email: string;
  role: "admin" | "member";
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  invitedBy: {
    name: string;
    image: string | null;
  };
  expiresAt: string;
}

type PageState =
  | { type: "loading" }
  | { type: "loaded"; invitation: InvitationDetails }
  | { type: "error"; message: string }
  | { type: "accepted"; workspaceSlug: string }
  | { type: "declined" };

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ type: "loading" });
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/invitation/${token}`);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setState({
            type: "error",
            message: data.error || "Invitation not found",
          });
          return;
        }

        const data = await response.json();
        setState({ type: "loaded", invitation: data.invitation });
      } catch {
        setState({ type: "error", message: "Failed to load invitation" });
      }
    }

    fetchInvitation();
  }, [token]);

  const handleAccept = useCallback(async () => {
    setIsAccepting(true);

    try {
      const response = await fetch(`/api/invitation/${token}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to accept invitation");
        setIsAccepting(false);
        return;
      }

      const data = await response.json();
      setState({ type: "accepted", workspaceSlug: data.workspaceSlug });
      toast.success("Invitation accepted");
    } catch {
      toast.error("Failed to accept invitation");
      setIsAccepting(false);
    }
  }, [token]);

  const handleDecline = useCallback(async () => {
    setIsDeclining(true);

    try {
      const response = await fetch(`/api/invitation/${token}/decline`, {
        method: "POST",
      });

      if (!response.ok) {
        toast.error("Failed to decline invitation");
        setIsDeclining(false);
        return;
      }

      setState({ type: "declined" });
    } catch {
      toast.error("Failed to decline invitation");
      setIsDeclining(false);
    }
  }, [token]);

  if (state.type === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.type === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <IconX className="size-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button
              onClick={() => router.push("/workspaces")}
              variant="outline"
            >
              Go to Workspaces
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (state.type === "accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/10">
              <IconCheck className="size-6 text-green-600" />
            </div>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              You have joined the workspace successfully.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push(`/${state.workspaceSlug}`)}>
              Go to Workspace
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (state.type === "declined") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation Declined</CardTitle>
            <CardDescription>You have declined the invitation.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button
              onClick={() => router.push("/workspaces")}
              variant="outline"
            >
              Go to Workspaces
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { invitation } = state;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {invitation.workspace.logo ? (
              <Avatar className="size-16">
                <AvatarImage src={invitation.workspace.logo} />
                <AvatarFallback className="text-lg">
                  {invitation.workspace.name[0]}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-muted font-medium text-2xl">
                {invitation.workspace.name[0]}
              </div>
            )}
          </div>
          <CardTitle>Join {invitation.workspace.name}</CardTitle>
          <CardDescription>
            {invitation.invitedBy.name} invited you to join as a{" "}
            {invitation.role}.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground text-sm">
            This invitation was sent to{" "}
            <strong className="text-foreground">{invitation.email}</strong>
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-3">
          <Button
            disabled={isAccepting || isDeclining}
            loading={isDeclining}
            onClick={handleDecline}
            variant="outline"
          >
            Decline
          </Button>
          <Button
            disabled={isAccepting || isDeclining}
            loading={isAccepting}
            onClick={handleAccept}
          >
            Accept Invitation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
