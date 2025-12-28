"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updateUser, useSession } from "@/lib/auth-client";
import { ProfileAvatar } from "./profile-avatar";
import { UsernameInput, useUsernameAvailability } from "./username-input";

const USERNAME_STARTS_WITH_LETTER_REGEX = /^[a-z]/i;
const USERNAME_ALPHANUMERIC_UNDERSCORE_REGEX = /^[a-z0-9_]+$/;

/**
 * Validates username format
 */
function validateUsernameFormat(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username || username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (username.length > 30) {
    return { valid: false, error: "Username must be 30 characters or less" };
  }

  if (!USERNAME_STARTS_WITH_LETTER_REGEX.test(username)) {
    return { valid: false, error: "Username must start with a letter" };
  }

  if (!USERNAME_ALPHANUMERIC_UNDERSCORE_REGEX.test(username)) {
    return {
      valid: false,
      error:
        "Username can only contain lowercase letters, numbers, and underscores",
    };
  }

  if (username.endsWith("_")) {
    return { valid: false, error: "Username cannot end with an underscore" };
  }

  if (username.includes("__")) {
    return {
      valid: false,
      error: "Username cannot contain consecutive underscores",
    };
  }

  return { valid: true };
}

const profileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").trim(),
  username: z.string().min(3, "Username must be at least 3 characters").trim(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UsernameSectionProps {
  username: string;
  isEditingUsername: boolean;
  usernameEditValue: string;
  isSavingUsername: boolean;
  usernameAvailability: ReturnType<typeof useUsernameAvailability>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
  error?: string;
}

function UsernameSection({
  username,
  isEditingUsername,
  usernameEditValue,
  isSavingUsername,
  usernameAvailability,
  onEdit,
  onCancel,
  onSave,
  onValueChange,
  error,
}: UsernameSectionProps) {
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <Label className="font-medium text-sm" htmlFor="username">
        Username
      </Label>
      <div className="flex w-full flex-col gap-6">
        {isEditingUsername ? (
          <>
            <div className="flex flex-col gap-1">
              <UsernameInput
                aria-describedby="username-status"
                error={error || undefined}
                isChecking={usernameAvailability.checking}
                isValid={usernameAvailability.available ?? undefined}
                onChange={onValueChange}
                value={usernameEditValue}
              />
            </div>
            <div className="flex items-center justify-end gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={(props) => (
                    <div {...props}>
                      <Button
                        aria-label="Cancel editing username"
                        disabled={isSavingUsername}
                        onClick={onCancel}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                />
                <TooltipContent align="center" side="top" sideOffset={6}>
                  Cancel
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={(props) => (
                    <div {...props}>
                      <Button
                        aria-label="Save username"
                        className="h-9"
                        disabled={
                          isSavingUsername ||
                          usernameAvailability.available === false ||
                          usernameAvailability.checking ||
                          usernameEditValue.trim().toLowerCase() ===
                            username.toLowerCase()
                        }
                        onClick={onSave}
                        type="button"
                      >
                        {isSavingUsername ? (
                          <Spinner className="size-4" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  )}
                />
                <TooltipContent align="center" side="top" sideOffset={6}>
                  Save username
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                className="h-9 w-full"
                disabled
                id="username"
                placeholder="username_123"
                value={username}
              />
            </div>
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <div {...props}>
                    <Button
                      className="flex size-9 items-center gap-2"
                      onClick={onEdit}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                )}
              />
              <TooltipContent align="center" side="top" sideOffset={6}>
                Edit username
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-medium text-xl">Profile</h1>
      </div>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <Label className="font-medium text-sm" htmlFor="avatar-upload">
                Profile picture
              </Label>
              <p className="text-muted-foreground text-xs">
                Maximum upload size is 5MB
              </p>
            </div>
            <div className="size-10 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="flex w-full flex-col items-start gap-2">
            <Label className="font-medium text-sm">Full name</Label>
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
            <p className="mt-2 text-muted-foreground text-xs">
              Changes save automatically
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-2">
            <Label className="font-medium text-sm">Username</Label>
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfileSettings() {
  const router = useRouter();
  const sessionData = useSession();
  const { data: session, isPending: sessionPending } = sessionData;
  const refetch = "refetch" in sessionData ? sessionData.refetch : undefined;

  const [isInitialized, setIsInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameEditValue, setUsernameEditValue] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChangesRef = useRef(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      username: "",
    },
    mode: "onChange",
  });

  const { watch, setValue, formState } = form;
  const watchedName = watch("name");

  const currentUsername = (session?.user as { username?: string })?.username;
  const usernameAvailability = useUsernameAvailability(
    isEditingUsername ? usernameEditValue : "",
    currentUsername
  );

  const setFormValues = useCallback(
    (usernameValue: string, nameValue: string) => {
      setUsername(usernameValue);
      setValue("name", nameValue, { shouldValidate: false });
      setValue("username", usernameValue, { shouldValidate: false });
    },
    [setValue]
  );

  const initializeFormData = useCallback(() => {
    const user = session?.user;
    const sessionName = user?.name || "";
    const sessionUsername = (user as { username?: string })?.username || "";
    setFormValues(sessionUsername, sessionName);
  }, [session?.user, setFormValues]);

  useEffect(() => {
    if (session?.user && !isInitialized) {
      initializeFormData();
      setIsInitialized(true);
    }
  }, [session?.user, isInitialized, initializeFormData]);

  useEffect(() => {
    if (
      session?.user?.id &&
      isInitialized &&
      lastFetchedUserIdRef.current !== session.user.id
    ) {
      lastFetchedUserIdRef.current = session.user.id;
      const sessionUsername =
        (session.user as { username?: string })?.username || "";
      setUsername(sessionUsername);
      setValue("username", sessionUsername, { shouldValidate: false });
    }
  }, [session?.user, isInitialized, setValue]);

  const updateName = useCallback(async (nameValue: string) => {
    const { error } = await updateUser({
      name: nameValue,
    });

    if (error) {
      throw new Error(error.message || "Failed to update name");
    }
  }, []);

  const updateUsername = useCallback(async (usernameValue: string) => {
    const { error } = await updateUser({
      username: usernameValue,
    });

    if (error) {
      throw new Error(error.message || "Failed to update username");
    }

    setUsername(usernameValue);
  }, []);

  const refreshUsernameFromSession = useCallback(() => {
    lastFetchedUserIdRef.current = null;
  }, []);

  const handleRefetch = useCallback(async () => {
    if (refetch && typeof refetch === "function") {
      try {
        await refetch();
      } catch {}
    }
  }, [refetch]);

  const saveProfile = useCallback(
    async (
      nameValue: string,
      usernameValue: string,
      nameChanged: boolean,
      usernameChanged: boolean
    ) => {
      if (!nameValue.trim()) {
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saving");

      try {
        if (nameChanged) {
          await updateName(nameValue);
        }

        if (usernameChanged) {
          await updateUsername(usernameValue);
        }

        setSaveStatus("saved");
        hasUnsavedChangesRef.current = false;
        router.refresh();
        await handleRefetch();

        if (usernameChanged) {
          refreshUsernameFromSession();
        }

        setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update profile"
        );
        setSaveStatus("error");
      }
    },
    [
      router,
      handleRefetch,
      updateName,
      updateUsername,
      refreshUsernameFromSession,
    ]
  );

  const handleNameChange = useCallback(
    (currentName: string, sessionName: string) => {
      const nameChanged = currentName !== sessionName;

      if (!nameChanged) {
        hasUnsavedChangesRef.current = false;
        setSaveStatus("idle");
        return;
      }

      if (formState.errors.name) {
        hasUnsavedChangesRef.current = true;
        setSaveStatus("idle");
        return;
      }

      hasUnsavedChangesRef.current = true;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        await saveProfile(currentName, "", true, false);
      }, 500);
    },
    [formState.errors.name, saveProfile]
  );

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const currentName = watchedName?.trim() || "";
    const sessionName = session?.user?.name || "";
    handleNameChange(currentName, sessionName);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [watchedName, isInitialized, session?.user?.name, handleNameChange]);

  const handleEditUsername = () => {
    setUsernameEditValue(username);
    setIsEditingUsername(true);
  };

  const handleCancelUsernameEdit = () => {
    setUsernameEditValue("");
    setIsEditingUsername(false);
  };

  const validateUsernameForSave = (trimmedUsername: string): string | null => {
    if (!trimmedUsername) {
      return "Username cannot be empty";
    }

    if (trimmedUsername === username.toLowerCase()) {
      setIsEditingUsername(false);
      setUsernameEditValue("");
      return null;
    }

    const formatValidation = validateUsernameFormat(trimmedUsername);
    if (!formatValidation.valid) {
      return formatValidation.error || "Invalid username format";
    }

    if (usernameAvailability.checking) {
      return "Please wait while we check username availability";
    }

    if (usernameAvailability.available === false) {
      return "Username is not available";
    }

    return null;
  };

  const saveUsernameUpdate = useCallback(
    async (trimmedUsername: string) => {
      const { error } = await updateUser({
        username: trimmedUsername,
      });

      if (error) {
        throw new Error(error.message || "Failed to update username");
      }

      setUsername(trimmedUsername);
      setValue("username", trimmedUsername, { shouldValidate: false });
      setIsEditingUsername(false);
      setUsernameEditValue("");
      toast.success("Username updated successfully");
      router.refresh();
      await handleRefetch();
      refreshUsernameFromSession();
    },
    [router, setValue, handleRefetch, refreshUsernameFromSession]
  );

  const handleSaveUsername = async () => {
    const trimmedUsername = usernameEditValue.trim().toLowerCase();

    const validationError = validateUsernameForSave(trimmedUsername);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSavingUsername(true);

    try {
      await saveUsernameUpdate(trimmedUsername);
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update username"
      );
    } finally {
      setIsSavingUsername(false);
    }
  };

  if (sessionPending) {
    return <ProfileSettingsLoading />;
  }

  const nameError = formState.errors.name?.message;
  const usernameError = isEditingUsername
    ? usernameAvailability.error
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-medium text-xl">Profile</h1>
      </div>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <ProfileAvatar name={watchedName || session?.user?.name || ""} />
          <div className="flex w-full flex-col items-start">
            <div className="flex items-center gap-2">
              <Label className="pb-2 font-medium text-sm" htmlFor="name">
                Full name
              </Label>
              {saveStatus === "saving" && (
                <Loader2
                  aria-hidden="true"
                  className="mb-2 size-3.5 animate-spin text-muted-foreground"
                />
              )}
              {saveStatus === "saved" && (
                <CheckCircle2
                  aria-hidden="true"
                  className="mb-2 size-3.5 text-green-600 dark:text-green-500"
                />
              )}
            </div>
            <div className="w-full">
              <Input
                id="name"
                {...form.register("name")}
                aria-describedby={nameError ? "name-error" : "name-helper"}
                aria-invalid={nameError ? "true" : "false"}
                className="h-9 w-full"
                placeholder="e.g. Jane Doe"
              />
              {nameError ? (
                <p
                  className="mt-2 text-destructive text-xs"
                  id="name-error"
                  role="alert"
                >
                  {nameError}
                </p>
              ) : (
                <p
                  className="mt-2 text-muted-foreground text-xs"
                  id="name-helper"
                >
                  Changes save automatically
                </p>
              )}
            </div>
          </div>
          <UsernameSection
            error={usernameError ?? undefined}
            isEditingUsername={isEditingUsername}
            isSavingUsername={isSavingUsername}
            onCancel={handleCancelUsernameEdit}
            onEdit={handleEditUsername}
            onSave={handleSaveUsername}
            onValueChange={setUsernameEditValue}
            username={username}
            usernameAvailability={usernameAvailability}
            usernameEditValue={usernameEditValue}
          />
        </CardContent>
      </Card>
    </div>
  );
}
