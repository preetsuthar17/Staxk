"use client";

import {
  IconCheck,
  IconDeviceFloppy,
  IconPencil,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";

const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
const NAME_DEBOUNCE_MS = 500;
const USERNAME_DEBOUNCE_MS = 300;
const CHECKMARK_DURATION_MS = 2500;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!trimmed) {
    return "Username cannot be empty";
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Username can only contain letters, numbers, underscores, and dots";
  }
  if (
    trimmed.length < MIN_USERNAME_LENGTH ||
    trimmed.length > MAX_USERNAME_LENGTH
  ) {
    return `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`;
  }
  return null;
}

function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return "Please select a valid image file (JPG, PNG, WebP, or GIF)";
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return "Image size must be less than 5MB";
  }
  return null;
}

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return defaultMessage;
}

function useNameEditing(initialName: string | null) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialNameRef = useRef<string>("");

  useEffect(() => {
    if (initialName) {
      setName(initialName);
      initialNameRef.current = initialName;
    }
  }, [initialName]);

  const saveName = useCallback(async (nameToSave: string) => {
    setIsSaving(true);
    setShowCheckmark(false);

    try {
      const { data, error } = await authClient.updateUser({
        name: nameToSave,
      });

      if (error) {
        throw new Error(getErrorMessage(error, "Failed to update name"));
      }

      if (!data) {
        throw new Error("Failed to update name");
      }

      initialNameRef.current = nameToSave;
      setName(nameToSave);
      setShowCheckmark(true);

      if (checkmarkTimeoutRef.current) {
        clearTimeout(checkmarkTimeoutRef.current);
      }
      checkmarkTimeoutRef.current = setTimeout(() => {
        setShowCheckmark(false);
      }, CHECKMARK_DURATION_MS);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update name"));
      setName(initialNameRef.current);
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (name === initialNameRef.current || !name.trim()) {
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      saveName(name.trim());
    }, NAME_DEBOUNCE_MS);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [name, saveName]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (checkmarkTimeoutRef.current) {
        clearTimeout(checkmarkTimeoutRef.current);
      }
    };
  }, []);

  return { name, setName, isSaving, showCheckmark };
}

function useUsernameEditing(initialUsername: string | null) {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameAvailability, setUsernameAvailability] = useState<
    boolean | null
  >(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const usernameDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialUsernameRef = useRef<string>("");

  useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
      initialUsernameRef.current = initialUsername;
    }
  }, [initialUsername]);

  useEffect(() => {
    if (!isEditingUsername) {
      return;
    }

    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current);
    }

    const trimmedUsername = username.trim().toLowerCase();
    const currentUsername = initialUsernameRef.current?.toLowerCase();

    if (!trimmedUsername || trimmedUsername === currentUsername) {
      setUsernameAvailability(null);
      setIsCheckingUsername(false);
      return;
    }

    if (
      !USERNAME_REGEX.test(trimmedUsername) ||
      trimmedUsername.length < MIN_USERNAME_LENGTH ||
      trimmedUsername.length > MAX_USERNAME_LENGTH
    ) {
      setUsernameAvailability(false);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await authClient.isUsernameAvailable({
          username: trimmedUsername,
        });
        setUsernameAvailability(error ? null : (data?.available ?? false));
      } catch {
        setUsernameAvailability(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, USERNAME_DEBOUNCE_MS);

    return () => {
      if (usernameDebounceRef.current) {
        clearTimeout(usernameDebounceRef.current);
      }
    };
  }, [username, isEditingUsername]);

  useEffect(() => {
    return () => {
      if (usernameDebounceRef.current) {
        clearTimeout(usernameDebounceRef.current);
      }
    };
  }, []);

  const handleStartEditUsername = useCallback(() => {
    setIsEditingUsername(true);
    setUsernameAvailability(null);
  }, []);

  const handleCancelEditUsername = useCallback(() => {
    setIsEditingUsername(false);
    setUsername(initialUsernameRef.current);
    setUsernameAvailability(null);
    setIsCheckingUsername(false);
  }, []);

  const handleSaveUsername = useCallback(async () => {
    const trimmedUsername = username.trim();
    const validationError = validateUsername(trimmedUsername);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (usernameAvailability === false) {
      toast.error("Username is not available");
      return;
    }

    setIsSavingUsername(true);

    try {
      const { data, error } = await authClient.updateUser({
        username: trimmedUsername,
      });

      if (error) {
        throw new Error(getErrorMessage(error, "Failed to update username"));
      }

      if (!data) {
        throw new Error("Failed to update username");
      }

      const normalizedUsername = trimmedUsername.toLowerCase();
      initialUsernameRef.current = normalizedUsername;
      setUsername(normalizedUsername);
      setIsEditingUsername(false);
      setUsernameAvailability(null);
      toast.success("Username updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update username"));
    } finally {
      setIsSavingUsername(false);
    }
  }, [username, usernameAvailability]);

  const isUsernameSaveDisabled = useMemo(
    () =>
      isSavingUsername ||
      usernameAvailability === false ||
      username.trim() === initialUsernameRef.current ||
      !username.trim(),
    [isSavingUsername, usernameAvailability, username]
  );

  return {
    isEditingUsername,
    username,
    setUsername,
    usernameAvailability,
    isCheckingUsername,
    isSavingUsername,
    isUsernameSaveDisabled,
    handleStartEditUsername,
    handleCancelEditUsername,
    handleSaveUsername,
  };
}

function useAvatarUpload(initialAvatar: string | null) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAvatar && avatarPreview) {
      setAvatarPreview(null);
    }
  }, [initialAvatar, avatarPreview]);

  const uploadAvatarFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch("/api/user/avatar", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload avatar");
    }

    const data = await response.json();
    const { error: updateError } = await authClient.updateUser({
      image: data.imageUrl,
    });

    if (updateError) {
      throw new Error(getErrorMessage(updateError, "Failed to update avatar"));
    }
  }, []);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      const validationError = validateAvatarFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setIsUploadingAvatar(true);

      try {
        await uploadAvatarFile(file);
        setAvatarPreview(null);
        toast.success("Avatar updated successfully");
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to upload avatar"));
        setAvatarPreview(null);
      } finally {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [uploadAvatarFile]
  );

  const displayAvatar = avatarPreview || initialAvatar;

  return {
    isUploadingAvatar,
    displayAvatar,
    fileInputRef,
    handleAvatarClick,
    handleAvatarChange,
  };
}

function AvatarUploadSection({
  displayAvatar,
  avatarFallback,
  isUploadingAvatar,
  fileInputRef,
  handleAvatarClick,
  handleAvatarChange,
}: {
  displayAvatar: string | null;
  avatarFallback: string;
  isUploadingAvatar: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleAvatarClick: () => void;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor="avatar">Avatar</Label>
      <div className="group/avatar relative inline-block size-10">
        <input
          accept={ALLOWED_AVATAR_TYPES.join(",")}
          className="hidden"
          disabled={isUploadingAvatar}
          id="avatar-upload"
          onChange={handleAvatarChange}
          ref={fileInputRef}
          type="file"
        />
        <Avatar className="size-full">
          {displayAvatar ? (
            <AvatarImage alt="Profile" src={displayAvatar} />
          ) : (
            <AvatarFallback className="text-lg">
              {avatarFallback}
            </AvatarFallback>
          )}
        </Avatar>
        {isUploadingAvatar && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <Spinner className="size-4 text-white" />
          </div>
        )}
        {!isUploadingAvatar && (
          <button
            aria-label="Upload avatar"
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover/avatar:opacity-100"
            onClick={handleAvatarClick}
            type="button"
          >
            <IconPencil className="size-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

function NameInputSection({
  name,
  setName,
  isSaving,
  showCheckmark,
  isPending,
}: {
  name: string;
  setName: (value: string) => void;
  isSaving: boolean;
  showCheckmark: boolean;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"
        htmlFor="name"
      >
        Name
        {isPending ? (
          <Skeleton className="h-10 w-full sm:max-w-xs" />
        ) : (
          <div className="relative w-full sm:max-w-xs">
            <Input
              className="w-full pr-8"
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name…"
              type="text"
              value={name}
            />
            {(isSaving || showCheckmark) && (
              <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center justify-center">
                {isSaving ? (
                  <Spinner className="size-4 text-muted-foreground" />
                ) : null}
                {!isSaving && showCheckmark ? (
                  <IconCheck className="size-4 text-primary" />
                ) : null}
              </div>
            )}
          </div>
        )}
      </Label>
    </div>
  );
}

function UsernameInputSection({
  username,
  setUsername,
  isEditingUsername,
  isCheckingUsername,
  usernameAvailability,
  isSavingUsername,
  isUsernameSaveDisabled,
  isPending,
  handleStartEditUsername,
  handleCancelEditUsername,
  handleSaveUsername,
}: {
  username: string;
  setUsername: (value: string) => void;
  isEditingUsername: boolean;
  isCheckingUsername: boolean;
  usernameAvailability: boolean | null;
  isSavingUsername: boolean;
  isUsernameSaveDisabled: boolean;
  isPending: boolean;
  handleStartEditUsername: () => void;
  handleCancelEditUsername: () => void;
  handleSaveUsername: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <Label
          className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"
          htmlFor="username"
        >
          <div
            className={`flex flex-col items-start justify-start ${
              isCheckingUsername || usernameAvailability !== null
                ? "gap-1.5"
                : "gap-0"
            }`}
          >
            Username
            {isEditingUsername && (
              <div className="flex items-center text-muted-foreground text-xs sm:justify-end">
                {isCheckingUsername && <Spinner className="size-4" />}
                {!isCheckingUsername && usernameAvailability === true && (
                  <span className="text-primary">Available</span>
                )}
                {!isCheckingUsername && usernameAvailability === false && (
                  <span className="text-destructive">Unavailable</span>
                )}
              </div>
            )}
          </div>
          {isPending ? (
            <Skeleton className="h-10 w-full sm:max-w-xs" />
          ) : (
            <div className="relative w-full sm:max-w-xs">
              <Input
                className={`w-full ${isEditingUsername ? "pr-20" : "pr-10"}`}
                id="username"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username…"
                readOnly={!isEditingUsername}
                type="text"
                value={username}
              />
              <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
                {isEditingUsername ? (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            disabled={isSavingUsername}
                            onClick={handleCancelEditUsername}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <IconX className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cancel editing</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            disabled={isUsernameSaveDisabled}
                            loading={isSavingUsername}
                            onClick={handleSaveUsername}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <IconDeviceFloppy />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save username</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleStartEditUsername}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <IconPencil className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit the username</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
        </Label>
      </div>
    </div>
  );
}

function EmailInputSection({
  email,
  isPending,
}: {
  email: string;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"
        htmlFor="email"
      >
        Email
        {isPending ? (
          <Skeleton className="h-10 w-full sm:max-w-xs" />
        ) : (
          <Input
            className="w-full sm:max-w-xs"
            disabled
            id="email"
            placeholder="Enter your email…"
            readOnly
            type="email"
            value={email}
          />
        )}
      </Label>
    </div>
  );
}

export function ProfileCard() {
  const { data: session, isPending } = authClient.useSession();

  const profileData = useMemo(
    () => ({
      name: session?.user?.name || "",
      username: session?.user?.username || "",
      email: session?.user?.email || "",
      avatar: session?.user?.image || null,
    }),
    [session?.user]
  );

  const { name, setName, isSaving, showCheckmark } = useNameEditing(
    profileData.name
  );

  const {
    isEditingUsername,
    username,
    setUsername,
    usernameAvailability,
    isCheckingUsername,
    isSavingUsername,
    isUsernameSaveDisabled,
    handleStartEditUsername,
    handleCancelEditUsername,
    handleSaveUsername,
  } = useUsernameEditing(profileData.username);

  const {
    isUploadingAvatar,
    displayAvatar,
    fileInputRef,
    handleAvatarClick,
    handleAvatarChange,
  } = useAvatarUpload(profileData.avatar);

  const avatarFallback = useMemo(
    () =>
      (name || profileData.name)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    [name, profileData.name]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Information</CardTitle>
        <CardDescription>
          Update your profile information and avatar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <AvatarUploadSection
            avatarFallback={avatarFallback}
            displayAvatar={displayAvatar}
            fileInputRef={fileInputRef}
            handleAvatarChange={handleAvatarChange}
            handleAvatarClick={handleAvatarClick}
            isUploadingAvatar={isUploadingAvatar}
          />
          <NameInputSection
            isPending={isPending}
            isSaving={isSaving}
            name={name}
            setName={setName}
            showCheckmark={showCheckmark}
          />
          <UsernameInputSection
            handleCancelEditUsername={handleCancelEditUsername}
            handleSaveUsername={handleSaveUsername}
            handleStartEditUsername={handleStartEditUsername}
            isCheckingUsername={isCheckingUsername}
            isEditingUsername={isEditingUsername}
            isPending={isPending}
            isSavingUsername={isSavingUsername}
            isUsernameSaveDisabled={isUsernameSaveDisabled}
            setUsername={setUsername}
            username={username}
            usernameAvailability={usernameAvailability}
          />
          <EmailInputSection email={profileData.email} isPending={isPending} />
        </div>
      </CardContent>
    </Card>
  );
}
