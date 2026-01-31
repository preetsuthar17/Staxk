"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { IssueStatus } from "@/db/schema/issue";
import type { IssueData } from "@/lib/issue";
import { IssueStatusSelect } from "./issue-status-select";

const MIN_TITLE_LENGTH = 1;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 10_000;

const issueSchema = z.object({
  title: z
    .string()
    .min(
      MIN_TITLE_LENGTH,
      `Title must be at least ${MIN_TITLE_LENGTH} character`
    )
    .max(
      MAX_TITLE_LENGTH,
      `Title must be at most ${MAX_TITLE_LENGTH} characters`
    ),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
});

type IssueFormData = z.infer<typeof issueSchema>;

interface EditIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: IssueData;
  onSuccess?: () => void;
  onDelete?: () => void;
}

export function EditIssueDialog({
  open,
  onOpenChange,
  issue,
  onSuccess,
  onDelete,
}: EditIssueDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState<IssueStatus>(issue.status);

  const identifier = `${issue.projectIdentifier}-${issue.number}`;

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: issue.title,
        description: issue.description || "",
      });
      setStatus(issue.status);
    }
  }, [open, issue, form]);

  const onSubmit = useCallback(
    async (data: IssueFormData) => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/issue/${issue.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: data.title.trim(),
            description: data.description?.trim() || null,
            status,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to update issue");
          setIsLoading(false);
          return;
        }

        toast.success(`Issue ${identifier} updated`);
        onOpenChange(false);
        onSuccess?.();
      } catch (error) {
        console.error("Error updating issue:", error);
        toast.error("Failed to update issue");
      } finally {
        setIsLoading(false);
      }
    },
    [issue.id, identifier, status, onOpenChange, onSuccess]
  );

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/issue/${issue.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to delete issue");
        setIsDeleting(false);
        return;
      }

      toast.success(`Issue ${identifier} deleted`);
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onDelete?.();
    } catch (error) {
      console.error("Error deleting issue:", error);
      toast.error("Failed to delete issue");
    } finally {
      setIsDeleting(false);
    }
  }, [issue.id, identifier, onOpenChange, onDelete]);

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit issue{" "}
              <span className="font-mono text-muted-foreground">
                {identifier}
              </span>
            </DialogTitle>
            <DialogDescription>
              Update the issue details below.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-issue-title">Title</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("title")}
                    aria-invalid={
                      form.formState.errors.title ? "true" : "false"
                    }
                    autoComplete="off"
                    id="edit-issue-title"
                    placeholder="Issue title…"
                  />
                  <FieldError errors={[form.formState.errors.title]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-issue-description">
                  Description{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    {...form.register("description")}
                    aria-invalid={
                      form.formState.errors.description ? "true" : "false"
                    }
                    autoComplete="off"
                    className="min-h-[100px] resize-y"
                    id="edit-issue-description"
                    placeholder="Add more context about this issue…"
                    rows={4}
                  />
                  <FieldError errors={[form.formState.errors.description]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Properties</FieldLabel>
                <FieldContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <IssueStatusSelect onChange={setStatus} value={status} />
                    <span className="text-muted-foreground text-sm">
                      {issue.projectName}
                    </span>
                  </div>
                </FieldContent>
              </Field>
            </FieldGroup>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button
                aria-label="Delete issue"
                disabled={isLoading || isDeleting}
                onClick={() => setShowDeleteConfirm(true)}
                size="icon"
                type="button"
                variant="destructive"
              >
                <IconTrash className="size-4" />
              </Button>
              <div className="flex gap-2">
                <Button
                  disabled={isLoading}
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    isLoading ||
                    (!form.formState.isDirty && status === issue.status)
                  }
                  loading={isLoading}
                  type="submit"
                >
                  Save changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setShowDeleteConfirm} open={showDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete issue?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{identifier}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              loading={isDeleting}
              onClick={handleDelete}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
