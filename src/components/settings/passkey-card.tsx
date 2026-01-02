"use client";

import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemDescription,
  ItemGroup,
  ItemHeader,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

interface Passkey {
  id: string;
  name: string | null;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
}

export function PasskeyCard() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddNameDialog, setShowAddNameDialog] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  const fetchPasskeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await authClient.passkey.listUserPasskeys({});

      if (result.error) {
        toast.error(result.error.message || "Failed to load passkeys");
        return;
      }

      if (result.data) {
        setPasskeys(result.data as unknown as Passkey[]);
      }
    } catch (_error) {
      toast.error("An error occurred while loading passkeys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPasskeys().catch(() => {
      // Error handling is done in fetchPasskeys
    });
  }, [fetchPasskeys]);

  const handleAddPasskey = useCallback(() => {
    setPasskeyName("");
    setNameError(null);
    setShowAddNameDialog(true);
  }, []);

  const handleAddNameSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setNameError(null);

      const trimmedName = passkeyName.trim();

      if (!trimmedName) {
        setNameError("Passkey name is required");
        return;
      }

      if (trimmedName.length > 50) {
        setNameError("Passkey name must be 50 characters or less");
        return;
      }

      setShowAddNameDialog(false);
      setIsAdding(true);

      try {
        const result = await authClient.passkey.addPasskey({
          name: trimmedName,
          authenticatorAttachment: undefined, // Allow both platform and cross-platform
        });

        if (result.error) {
          toast.error(result.error.message || "Failed to register passkey");
          return;
        }

        toast.success("Passkey added successfully");
        await fetchPasskeys();
      } catch (_error) {
        toast.error("An error occurred while registering passkey");
      } finally {
        setIsAdding(false);
        setPasskeyName("");
      }
    },
    [passkeyName, fetchPasskeys]
  );

  const handleRenameClick = useCallback((passkey: Passkey) => {
    setRenamingId(passkey.id);
    setRenameValue(passkey.name || "");
    setRenameError(null);
    setShowRenameDialog(true);
  }, []);

  const handleRenameSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setRenameError(null);

      if (!renamingId) {
        return;
      }

      const trimmedName = renameValue.trim();

      if (!trimmedName) {
        setRenameError("Passkey name is required");
        return;
      }

      if (trimmedName.length > 50) {
        setRenameError("Passkey name must be 50 characters or less");
        return;
      }

      setIsRenaming(true);

      const previousPasskeys = [...passkeys];
      setPasskeys(
        passkeys.map((p) =>
          p.id === renamingId ? { ...p, name: trimmedName } : p
        )
      );

      try {
        const result = await authClient.passkey.updatePasskey({
          id: renamingId,
          name: trimmedName,
        });

        if (result.error) {
          setPasskeys(previousPasskeys);
          toast.error(result.error.message || "Failed to rename passkey");
          return;
        }

        toast.success("Passkey renamed successfully");
        setShowRenameDialog(false);
        setRenamingId(null);
        setRenameValue("");
      } catch (_error) {
        setPasskeys(previousPasskeys);
        toast.error("An error occurred while renaming passkey");
      } finally {
        setIsRenaming(false);
      }
    },
    [renamingId, renameValue, passkeys]
  );

  const handleDeleteClick = useCallback((passkey: Passkey) => {
    setPasskeyToDelete(passkey);
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!passkeyToDelete) {
      return;
    }

    const passkeyId = passkeyToDelete.id;
    setDeletingId(passkeyId);
    setShowDeleteDialog(false);

    const previousPasskeys = [...passkeys];
    setPasskeys(passkeys.filter((p) => p.id !== passkeyId));

    try {
      const result = await authClient.passkey.deletePasskey({
        id: passkeyId,
      });

      if (result.error) {
        setPasskeys(previousPasskeys);
        toast.error(result.error.message || "Failed to delete passkey");
        return;
      }

      toast.success("Passkey deleted successfully");
    } catch (_error) {
      setPasskeys(previousPasskeys);
      toast.error("An error occurred while deleting passkey");
    } finally {
      setDeletingId(null);
      setPasskeyToDelete(null);
    }
  }, [passkeyToDelete, passkeys]);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch {
      return "Unknown";
    }
  }, []);

  const getDeviceTypeLabel = useCallback((deviceType: string) => {
    return deviceType === "platform" ? "Platform" : "Cross-platform";
  }, []);

  const isLoadingState = useMemo(() => isLoading, [isLoading]);

  return (
    <>
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Passkey</CardTitle>
          <CardDescription>
            Manage your passkeys for passwordless authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {isLoadingState ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton className="h-16 w-full" key={i} />
                ))}
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            ) : (
              <>
                {passkeys.length > 0 ? (
                  <ItemGroup>
                    {passkeys.map((passkey) => (
                      <Item
                        className="flex-nowrap"
                        key={passkey.id}
                        variant="outline"
                      >
                        <ItemHeader>
                          <div className="flex flex-col gap-1">
                            <div className="font-medium">
                              {passkey.name || "Unnamed Passkey"}
                            </div>
                            <ItemDescription>
                              {getDeviceTypeLabel(passkey.deviceType)} • Added{" "}
                              {formatDate(passkey.createdAt)}
                              {passkey.backedUp && " • Backed up"}
                            </ItemDescription>
                          </div>
                        </ItemHeader>
                        <ItemActions>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button
                                aria-label="Passkey options"
                                disabled={
                                  deletingId === passkey.id ||
                                  renamingId === passkey.id
                                }
                                size="icon"
                                variant="ghost"
                              >
                                <IconDots className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleRenameClick(passkey)}
                              >
                                <IconPencil className="size-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(passkey)}
                                variant="destructive"
                              >
                                <IconTrash className="size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </ItemActions>
                      </Item>
                    ))}
                  </ItemGroup>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No passkeys registered yet.
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    disabled={isAdding}
                    loading={isAdding}
                    onClick={handleAddPasskey}
                    type="button"
                  >
                    Add Passkey
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setShowAddNameDialog(false);
            setPasskeyName("");
            setNameError(null);
          }
        }}
        open={showAddNameDialog}
      >
        <DialogContent>
          <form onSubmit={handleAddNameSubmit}>
            <DialogHeader>
              <DialogTitle>Name Your Passkey</DialogTitle>
              <DialogDescription>
                Enter a name to help you identify this passkey.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="passkey-name">Name</Label>
                <Input
                  aria-describedby={
                    nameError ? "passkey-name-error" : undefined
                  }
                  aria-invalid={!!nameError}
                  autoComplete="off"
                  disabled={isAdding}
                  id="passkey-name"
                  maxLength={50}
                  onChange={(e) => {
                    setPasskeyName(e.target.value);
                    if (nameError) {
                      setNameError(null);
                    }
                  }}
                  placeholder="e.g., MacBook Pro, iPhone, Security Key"
                  type="text"
                  value={passkeyName}
                />
                {nameError && (
                  <FieldError
                    errors={[{ message: nameError }]}
                    id="passkey-name-error"
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={isAdding}
                onClick={() => {
                  setShowAddNameDialog(false);
                  setPasskeyName("");
                  setNameError(null);
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isAdding} loading={isAdding} type="submit">
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setShowRenameDialog(false);
            setRenamingId(null);
            setRenameValue("");
            setRenameError(null);
            setIsRenaming(false);
          }
        }}
        open={showRenameDialog}
      >
        <DialogContent>
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename Passkey</DialogTitle>
              <DialogDescription>
                Enter a new name for this passkey.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rename-passkey">Name</Label>
                <Input
                  aria-describedby={
                    renameError ? "rename-passkey-error" : undefined
                  }
                  aria-invalid={!!renameError}
                  autoComplete="off"
                  disabled={isRenaming}
                  id="rename-passkey"
                  maxLength={50}
                  onChange={(e) => {
                    setRenameValue(e.target.value);
                    if (renameError) {
                      setRenameError(null);
                    }
                  }}
                  placeholder="e.g., MacBook Pro, iPhone, Security Key"
                  type="text"
                  value={renameValue}
                />
                {renameError && (
                  <FieldError
                    errors={[{ message: renameError }]}
                    id="rename-passkey-error"
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={isRenaming}
                onClick={() => {
                  setShowRenameDialog(false);
                  setRenamingId(null);
                  setRenameValue("");
                  setRenameError(null);
                  setIsRenaming(false);
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isRenaming} loading={isRenaming} type="submit">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this passkey? This action cannot
              be undone and you will need to register it again to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              disabled={!!deletingId}
              onClick={() => {
                setShowDeleteDialog(false);
                setPasskeyToDelete(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <AlertDialogAction
              disabled={!!deletingId}
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
