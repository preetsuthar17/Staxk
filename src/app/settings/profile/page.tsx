"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  IconPencil,
  IconCheck,
  IconX,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
const NAME_DEBOUNCE_MS = 500;
const USERNAME_DEBOUNCE_MS = 300;
const CHECKMARK_DURATION_MS = 2500;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export default function ProfileSettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialNameRef = useRef<string>("");

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameAvailability, setUsernameAvailability] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const usernameDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialUsernameRef = useRef<string>("");

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileData = useMemo(() => ({
    name: session?.user?.name || "",
    username: session?.user?.username || "",
    email: session?.user?.email || "",
    avatar: session?.user?.image || null,
  }), [session?.user]);

  const displayAvatar = avatarPreview || profileData.avatar;

  useEffect(() => {
    if (session?.user?.name) {
      const sessionName = session.user.name;
      setName(sessionName);
      initialNameRef.current = sessionName;
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (session?.user?.username) {
      const sessionUsername = session.user.username;
      setUsername(sessionUsername);
      initialUsernameRef.current = sessionUsername;
    }
  }, [session?.user?.username]);

  useEffect(() => {
    if (session?.user?.image && avatarPreview) {
      setAvatarPreview(null);
    }
  }, [session?.user?.image, avatarPreview]);

  useEffect(() => {
    if (!isEditingUsername) return;

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

    if (!USERNAME_REGEX.test(trimmedUsername) || 
        trimmedUsername.length < MIN_USERNAME_LENGTH || 
        trimmedUsername.length > MAX_USERNAME_LENGTH) {
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
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (name === initialNameRef.current || !name.trim()) return;

    debounceTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setShowCheckmark(false);

      try {
        const { data, error } = await authClient.updateUser({
          name: name.trim(),
        });

        if (error) {
          throw new Error(
            typeof error === "string" ? error : error?.message || "Failed to update name"
          );
        }

        if (data) {
          const trimmedName = name.trim();
          initialNameRef.current = trimmedName;
          setName(trimmedName);
          setShowCheckmark(true);
          
          if (checkmarkTimeoutRef.current) {
            clearTimeout(checkmarkTimeoutRef.current);
          }
          checkmarkTimeoutRef.current = setTimeout(() => {
            setShowCheckmark(false);
          }, CHECKMARK_DURATION_MS);
        } else {
          throw new Error("Failed to update name");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update name");
        setName(initialNameRef.current);
      } finally {
        setIsSaving(false);
      }
    }, NAME_DEBOUNCE_MS);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [name]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (checkmarkTimeoutRef.current) clearTimeout(checkmarkTimeoutRef.current);
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
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

    if (!trimmedUsername) {
      toast.error("Username cannot be empty");
      return;
    }

    if (!USERNAME_REGEX.test(trimmedUsername)) {
      toast.error("Username can only contain letters, numbers, underscores, and dots");
      return;
    }

    if (trimmedUsername.length < MIN_USERNAME_LENGTH || trimmedUsername.length > MAX_USERNAME_LENGTH) {
      toast.error(`Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`);
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
        throw new Error(
          typeof error === "string" ? error : error?.message || "Failed to update username"
        );
      }

      if (data) {
        const normalizedUsername = trimmedUsername.toLowerCase();
        initialUsernameRef.current = normalizedUsername;
        setUsername(normalizedUsername);
        setIsEditingUsername(false);
        setUsernameAvailability(null);
        toast.success("Username updated successfully");
      } else {
        throw new Error("Failed to update username");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update username");
    } finally {
      setIsSavingUsername(false);
    }
  }, [username, usernameAvailability]);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, WebP, or GIF)");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);

    try {
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
        throw new Error(
          typeof updateError === "string" ? updateError : updateError?.message || "Failed to update avatar"
        );
      }

      setAvatarPreview(null);
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar");
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, []);

  const avatarFallback = useMemo(() => 
    (name || profileData.name)
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase(),
    [name, profileData.name]
  );

  const isUsernameSaveDisabled = useMemo(() => 
    isSavingUsername ||
    usernameAvailability === false ||
    username.trim() === initialUsernameRef.current ||
    !username.trim(),
    [isSavingUsername, usernameAvailability, username]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-2xl">Profile</h1>
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>
              Update your profile information and avatar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="avatar">Avatar</Label>
                <div className="relative inline-block size-10 group/avatar">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_AVATAR_TYPES.join(",")}
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                    disabled={isUploadingAvatar}
                  />
                  <Avatar className="size-full">
                    {displayAvatar ? (
                      <AvatarImage src={displayAvatar} alt="Profile" />
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
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover/avatar:opacity-100 cursor-pointer"
                      onClick={handleAvatarClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleAvatarClick();
                        }
                      }}
                      aria-label="Upload avatar"
                    >
                      <IconPencil className="size-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="name"
                  className="flex gap-2 items-start sm:items-center flex-col sm:flex-row justify-between"
                >
                  Name
                  {isPending ? (
                    <Skeleton className="h-10 sm:max-w-xs w-full" />
                  ) : (
                    <div className="relative sm:max-w-xs w-full">
                      <Input
                        id="name"
                        type="text"
                        className="w-full pr-8"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name…"
                      />
                      {(isSaving || showCheckmark) && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                          {isSaving ? (
                            <Spinner className="size-4 text-muted-foreground" />
                          ) : showCheckmark ? (
                            <IconCheck className="size-4 text-primary" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </Label>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="username"
                    className="flex gap-2 items-start sm:items-center flex-col sm:flex-row justify-between"
                  >
                    <div
                      className={`flex items-start justify-start flex-col ${
                        (isCheckingUsername || usernameAvailability !== null)
                          ? "gap-1.5"
                          : "gap-0"
                      }`}
                    >
                      Username
                      {isEditingUsername && (
                        <div className="flex items-center text-xs text-muted-foreground sm:justify-end">
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
                      <Skeleton className="h-10 sm:max-w-xs w-full" />
                    ) : (
                      <div className="relative sm:max-w-xs w-full">
                        <Input
                          id="username"
                          type="text"
                          className={`w-full ${isEditingUsername ? "pr-20" : "pr-10"}`}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          readOnly={!isEditingUsername}
                          placeholder="Enter your username…"
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                          {isEditingUsername ? (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      onClick={handleCancelEditUsername}
                                      disabled={isSavingUsername}
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
                                      size="icon-sm"
                                      variant="ghost"
                                      onClick={handleSaveUsername}
                                      loading={isSavingUsername}
                                      disabled={isUsernameSaveDisabled}
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
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={handleStartEditUsername}
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
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="email"
                  className="flex gap-2 items-start sm:items-center flex-col sm:flex-row justify-between"
                >
                  Email
                  <Input
                    id="email"
                    disabled
                    type="email"
                    className="sm:max-w-xs w-full"
                    value={profileData.email}
                    readOnly
                    placeholder="Enter your email…"
                  />
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}