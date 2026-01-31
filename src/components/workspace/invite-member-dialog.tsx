"use client";

import { IconCopy, IconUserPlus } from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceInvitations } from "@/hooks/use-workspace-invitations";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InviteMemberDialogProps {
  workspaceSlug: string;
}

export function InviteMemberDialog({ workspaceSlug }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { mutate: mutateInvitations } = useWorkspaceInvitations(workspaceSlug);
  const { mutate: mutateMembers } = useWorkspaceMembers(workspaceSlug);

  const resetForm = useCallback(() => {
    setEmail("");
    setRole("member");
    setInviteLink(null);
    setEmailError(null);
    setIsLoading(false);
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    },
    [resetForm]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setEmailError("Email is required");
        return;
      }

      if (!EMAIL_REGEX.test(trimmedEmail)) {
        setEmailError("Invalid email format");
        return;
      }

      setEmailError(null);
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/workspace/${encodeURIComponent(workspaceSlug)}/invitations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmedEmail, role }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to send invitation");
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const token = data.invitation?.token;
        if (token) {
          const link = `${window.location.origin}/invite/${token}`;
          setInviteLink(link);
        }

        toast.success("Invitation created");
        mutateInvitations();
        mutateMembers();
      } catch {
        toast.error("Failed to send invitation");
      } finally {
        setIsLoading(false);
      }
    },
    [email, role, workspaceSlug, mutateInvitations, mutateMembers]
  );

  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invitation link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  }, [inviteLink]);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <IconUserPlus className="mr-1.5 size-4" />
        Invite
      </Button>

      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Invite someone to join this workspace. They will receive a link to
              accept the invitation.
            </DialogDescription>
          </DialogHeader>

          {inviteLink ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm">
                  Invitation created. Share this link with the invitee:
                </p>
                <div className="flex items-center gap-2">
                  <Input className="text-xs" readOnly value={inviteLink} />
                  <Button
                    onClick={handleCopyLink}
                    size="icon"
                    variant="outline"
                  >
                    <IconCopy className="size-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => resetForm()} variant="outline">
                  Invite Another
                </Button>
                <Button onClick={() => handleOpenChange(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel>
                    <span>Email</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      aria-invalid={emailError ? "true" : "false"}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(null);
                      }}
                      placeholder="colleague@company.com"
                      type="email"
                      value={email}
                    />
                    <FieldError
                      errors={[
                        emailError ? { message: emailError } : undefined,
                      ]}
                    />
                  </FieldContent>
                </Field>

                <Field className="flex flex-col gap-2">
                  <FieldLabel>
                    <span>Role</span>
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={(val) => {
                        if (val) {
                          setRole(val as "admin" | "member");
                        }
                      }}
                      value={role}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription className="pt-1">
                      Members can view and contribute. Admins can also manage
                      members and settings.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <DialogFooter>
                <Button
                  disabled={isLoading}
                  onClick={() => handleOpenChange(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button disabled={isLoading} loading={isLoading} type="submit">
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
