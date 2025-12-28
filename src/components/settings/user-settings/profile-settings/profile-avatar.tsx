"use client";

import imageCompression from "browser-image-compression";
import { Camera, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "@/lib/auth-client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface ProfileAvatarProps {
  name: string;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}

export function ProfileAvatar({
  name,
  onUploadStart,
  onUploadComplete,
}: ProfileAvatarProps) {
  const router = useRouter();
  const sessionData = useSession();
  const { data: session } = sessionData;
  const refetch = "refetch" in sessionData ? sessionData.refetch : undefined;

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user?.image && !avatarPreview) {
      setAvatarPreview(session.user.image);
    }
  }, [session?.user?.image, avatarPreview]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        `Image is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
      return;
    }

    setIsUploadingAvatar(true);
    onUploadStart?.();

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();

      const uploadAvatar = async (base64String: string) => {
        const response = await fetch("/api/user/update-avatar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update profile picture");
        }

        toast.success("Profile picture updated successfully");
        router.refresh();

        if (refetch && typeof refetch === "function") {
          try {
            await refetch();
          } catch {
            // Silently fail if refetch fails - session will update on next page load
          }
        }

        onUploadComplete?.();
      };

      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);

        try {
          await uploadAvatar(base64String);
        } catch (error) {
          console.error("Error uploading avatar:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to update profile picture"
          );
          setAvatarPreview(session?.user?.image || null);
        } finally {
          setIsUploadingAvatar(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read image file");
        setIsUploadingAvatar(false);
        onUploadComplete?.();
      };

      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to process image. Please try again.");
      setIsUploadingAvatar(false);
      onUploadComplete?.();
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Label className="font-medium text-sm" htmlFor="avatar-upload">
            Profile picture
          </Label>
          <p className="text-muted-foreground text-xs">
            Maximum upload size is 5MB
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <button
                aria-busy={isUploadingAvatar}
                aria-label="Change profile picture"
                className="group relative rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Avatar className="size-9 ring-2 ring-border transition-all group-hover:ring-ring">
                  <AvatarImage
                    alt="Profile picture"
                    src={avatarPreview || undefined}
                  />
                  <AvatarFallback className="text-lg">
                    {name?.charAt(0).toUpperCase() || (
                      <UserIcon className="size-6 opacity-50" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/60 transition-opacity ${
                    isUploadingAvatar
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {isUploadingAvatar ? (
                    <Spinner className="size-4 text-white" />
                  ) : (
                    <Camera className="size-4 text-white" />
                  )}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent align="center" side="top" sideOffset={6}>
              Change profile picture
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <input
        accept="image/*"
        aria-label="Upload profile picture"
        className="hidden"
        id="avatar-upload"
        onChange={handleAvatarChange}
        ref={fileInputRef}
        type="file"
      />
    </>
  );
}
