"use client";

import { useRouter } from "next/navigation";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamDangerZoneCardProps {
  workspaceSlug: string;
  teamIdentifier: string;
  teamName: string;
}

export function TeamDangerZoneCard({
  workspaceSlug,
  teamIdentifier,
  teamName,
}: TeamDangerZoneCardProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isConfirmValid = confirmText === teamIdentifier;

  const handleDelete = useCallback(async () => {
    if (!isConfirmValid) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/team/${encodeURIComponent(teamIdentifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to delete team");
        return;
      }

      toast.success("Team deleted successfully");
      router.push(`/${workspaceSlug}/settings`);
    } catch (_error) {
      toast.error("Failed to delete team");
    } finally {
      setIsDeleting(false);
    }
  }, [workspaceSlug, teamIdentifier, isConfirmValid, router]);

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Team</CardTitle>
        <CardDescription>
          <p className="text-muted-foreground text-sm">
            Deleting this team is{" "}
            <span className="font-medium text-destructive">irreversible</span>.
            All data will be permanently removed.
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-fit flex-col gap-4">
          <AlertDialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <AlertDialogTrigger>
              <Button className="w-fit" variant="destructive">
                Delete Team
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to delete <strong>{teamName}</strong>{" "}
                  Teams?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone and will remove all associated
                  data.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-delete">
                  Type <strong>{teamIdentifier}</strong> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={teamIdentifier}
                  value={confirmText}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={isDeleting}
                  onClick={() => setConfirmText("")}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!isConfirmValid || isDeleting}
                  loading={isDeleting}
                  onClick={handleDelete}
                >
                  Delete Team
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
