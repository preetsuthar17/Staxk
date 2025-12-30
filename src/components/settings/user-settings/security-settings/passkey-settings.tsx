"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconDeviceLaptop,
  IconDeviceMobile,
  IconDots,
  IconEdit,
  IconFingerprint,
  IconKey,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { safeClientError } from "@/lib/client-logger";

const renameSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

type RenameFormData = z.infer<typeof renameSchema>;

interface Passkey {
  id: string;
  name: string | null;
  credentialID: string;
  deviceType: string;
  createdAt: Date | null;
}

function getDeviceIcon(deviceType: string) {
  if (deviceType === "singleDevice") {
    return <IconDeviceMobile className="size-5" />;
  }
  return <IconDeviceLaptop className="size-5" />;
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function PasskeyItem({
  passkey,
  onRename,
  onDelete,
}: {
  passkey: Passkey;
  onRename: (passkey: Passkey) => void;
  onDelete: (passkey: Passkey) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          {getDeviceIcon(passkey.deviceType)}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {passkey.name || "Unnamed passkey"}
          </span>
          <span className="text-muted-foreground text-xs">
            Added {formatDate(passkey.createdAt)}
          </span>
        </div>
      </div>
      <div className="relative">
        <Button
          className="size-8"
          onClick={() => setShowMenu(!showMenu)}
          size="icon"
          variant="ghost"
        >
          <IconDots className="size-4" />
        </Button>
        {showMenu && (
          <>
            <button
              aria-label="Close menu"
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowMenu(false);
                }
              }}
              type="button"
            />
            <div className="absolute top-full right-0 z-50 mt-1 min-w-[140px] rounded-md border bg-popover p-1 shadow-md">
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => {
                  setShowMenu(false);
                  onRename(passkey);
                }}
                type="button"
              >
                <IconEdit className="size-4" />
                Rename
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-destructive text-sm hover:bg-accent"
                onClick={() => {
                  setShowMenu(false);
                  onDelete(passkey);
                }}
                type="button"
              >
                <IconTrash className="size-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AddPasskeyDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.passkey.addPasskey({
        name: name.trim() || undefined,
      });

      if (error) {
        toast.error(error.message || "Failed to add passkey");
        return;
      }

      toast.success("Passkey added successfully");
      onOpenChange(false);
      setName("");
      onSuccess();
    } catch {
      toast.error("Failed to add passkey");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFingerprint className="size-5" />
            Add Passkey
          </DialogTitle>
          <DialogDescription>
            Add a passkey for passwordless sign-in. You&apos;ll be prompted to
            use your device&apos;s biometrics or security key.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="passkey-name">Name (optional)</Label>
            <Input
              disabled={isLoading}
              id="passkey-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., MacBook Pro, iPhone"
              value={name}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isLoading} onClick={handleAdd} type="button">
            {isLoading ? <Skeleton className="h-4 w-24" /> : "Add passkey"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenamePasskeyDialog({
  open,
  onOpenChange,
  passkey,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passkey: Passkey | null;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RenameFormData>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: passkey?.name || "" },
  });

  useEffect(() => {
    if (passkey) {
      form.reset({ name: passkey.name || "" });
    }
  }, [passkey, form]);

  const handleSubmit = async (data: RenameFormData) => {
    if (!passkey) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.passkey.updatePasskey({
        id: passkey.id,
        name: data.name,
      });

      if (error) {
        toast.error(error.message || "Failed to rename passkey");
        return;
      }

      toast.success("Passkey renamed successfully");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to rename passkey");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconEdit className="size-5" />
            Rename Passkey
          </DialogTitle>
          <DialogDescription>
            Give your passkey a memorable name.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="rename-name">Name</Label>
            <Input
              {...form.register("name")}
              disabled={isLoading}
              id="rename-name"
              placeholder="e.g., MacBook Pro, iPhone"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isLoading} type="submit">
              {isLoading ? <Skeleton className="h-4 w-12" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeletePasskeyDialog({
  open,
  onOpenChange,
  passkey,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passkey: Passkey | null;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!passkey) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.passkey.deletePasskey({
        id: passkey.id,
      });

      if (error) {
        toast.error(error.message || "Failed to delete passkey");
        return;
      }

      toast.success("Passkey deleted successfully");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to delete passkey");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete passkey?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the passkey &quot;
            {passkey?.name || "Unnamed passkey"}&quot;. You won&apos;t be able
            to use it to sign in anymore.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
            onClick={handleDelete}
          >
            {isLoading ? <Skeleton className="h-4 w-16" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PasskeySettings() {
  const router = useRouter();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPasskey, setSelectedPasskey] = useState<Passkey | null>(null);

  const fetchPasskeys = useCallback(async () => {
    try {
      const { data, error } = await authClient.passkey.listUserPasskeys();

      if (error) {
        safeClientError("Failed to fetch passkeys:", error);
        return;
      }

      setPasskeys((data as Passkey[]) || []);
    } catch (err) {
      safeClientError("Failed to fetch passkeys:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPasskeys();
  }, [fetchPasskeys]);

  const handleSuccess = () => {
    fetchPasskeys();
    router.refresh();
  };

  const handleRename = (passkey: Passkey) => {
    setSelectedPasskey(passkey);
    setShowRenameDialog(true);
  };

  const handleDelete = (passkey: Passkey) => {
    setSelectedPasskey(passkey);
    setShowDeleteDialog(true);
  };

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full items-center justify-between">
        <Label className="font-medium text-base">Passkeys</Label>
        <span className="flex items-center gap-2 text-muted-foreground text-sm">
          <IconKey className="size-4" />
          {passkeys.length} registered
        </span>
      </div>

      <p className="text-muted-foreground text-sm">
        Passkeys are a secure, passwordless way to sign in using your
        device&apos;s biometrics, PIN, or security key.
      </p>

      {isLoading ? (
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="size-8" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-3">
          {passkeys.length > 0 && (
            <div className="flex flex-col gap-2">
              {passkeys.map((passkey) => (
                <PasskeyItem
                  key={passkey.id}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  passkey={passkey}
                />
              ))}
            </div>
          )}

          <Button
            className="w-full justify-start"
            onClick={() => setShowAddDialog(true)}
            variant="outline"
          >
            <IconPlus className="size-4" />
            Add a passkey
          </Button>
        </div>
      )}

      <AddPasskeyDialog
        onOpenChange={setShowAddDialog}
        onSuccess={handleSuccess}
        open={showAddDialog}
      />

      <RenamePasskeyDialog
        onOpenChange={setShowRenameDialog}
        onSuccess={handleSuccess}
        open={showRenameDialog}
        passkey={selectedPasskey}
      />

      <DeletePasskeyDialog
        onOpenChange={setShowDeleteDialog}
        onSuccess={handleSuccess}
        open={showDeleteDialog}
        passkey={selectedPasskey}
      />
    </div>
  );
}
