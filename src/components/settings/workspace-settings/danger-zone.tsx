"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { safeClientError } from "@/lib/client-logger";

interface DangerZoneProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
}

export function DangerZone({ workspace }: DangerZoneProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState("");
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isNameMatch = workspaceNameInput.trim() === workspace.name;
  const isDeletePhraseMatch =
    deleteConfirmInput.trim() === "delete my workspace";
  const canDelete = isNameMatch && isDeletePhraseMatch && !isDeleting;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/workspace/${workspace.id}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete workspace");
      }

      toast.success("Workspace deleted successfully");
      router.push("/home");
    } catch (error) {
      safeClientError("Error deleting workspace:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete workspace"
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-medium text-xl">Danger Zone</h1>
          <p className="text-muted-foreground text-sm">
            Irreversible and destructive actions
          </p>
        </div>

        <Card className="border-destructive">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="font-medium text-sm">Delete Workspace</Label>
              <p className="text-muted-foreground text-xs">
                Permanently delete this workspace and all its data.
              </p>
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={isDeleting}
              onClick={() => {
                setDialogOpen(true);
                setWorkspaceNameInput("");
                setDeleteConfirmInput("");
              }}
              variant="destructive"
            >
              {isDeleting ? <Spinner className="size-4" /> : "Delete Workspace"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the <strong>{workspace.name}</strong>{" "}
              workspace and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label
                className="font-medium text-sm"
                htmlFor="delete-workspace-name"
              >
                Type the workspace name to confirm deletion
              </Label>
              <Input
                autoFocus
                className="h-10"
                disabled={isDeleting}
                id="delete-workspace-name"
                onChange={(e) => setWorkspaceNameInput(e.target.value)}
                placeholder={workspace.name}
                value={workspaceNameInput}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label
                className="font-medium text-sm"
                htmlFor="delete-confirm-phrase"
              >
                Type <strong>delete my workspace</strong> to confirm
              </Label>
              <Input
                className="h-10"
                disabled={isDeleting}
                id="delete-confirm-phrase"
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="delete my workspace"
                value={deleteConfirmInput}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30"
              disabled={!canDelete}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <Spinner className="size-4" />
              ) : (
                "Yes, delete workspace"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
