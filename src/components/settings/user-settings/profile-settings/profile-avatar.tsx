"use client";

import { IconCamera, IconUser } from "@tabler/icons-react";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updateUser, useSession } from "@/lib/auth-client";
import { safeClientError } from "@/lib/client-logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_BASE64_SIZE = 7 * 1024 * 1024; // ~7MB to account for base64 encoding overhead (~33% increase)

interface ProfileAvatarProps {
  name: string;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}

function validateFile(
  file: File,
  fileInputRef: React.RefObject<HTMLInputElement | null>
): boolean {
  if (!file.type.startsWith("image/")) {
    toast.error("Please select a valid image file");
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    toast.error(
      `Image is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    );
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    return false;
  }

  return true;
}

function resetFileInput(
  fileInputRef: React.RefObject<HTMLInputElement | null>
) {
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
}

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: file.type,
  };

  await new Promise<void>((resolve) => {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => resolve(), { timeout: 100 });
    } else {
      setTimeout(() => resolve(), 0);
    }
  });

  const compressedFile = await imageCompression(file, options);

  if (compressedFile.size > MAX_FILE_SIZE) {
    throw new Error(
      `Image is too large after compression. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  return compressedFile;
}

function handleCompressionError(
  error: unknown,
  setIsUploadingAvatar: (value: boolean) => void,
  onUploadComplete?: () => void
) {
  safeClientError("Error compressing image:", error);
  toast.error("Failed to process image. Please try again.");
  setIsUploadingAvatar(false);
  onUploadComplete?.();
}

async function uploadAvatar(
  base64String: string,
  router: ReturnType<typeof useRouter>,
  refetch?: () => Promise<void>,
  onUploadComplete?: () => void
) {
  const requestBody = JSON.stringify({ image: base64String });
  const MAX_REQUEST_SIZE = 1_000_000; // 1MB

  if (requestBody.length > MAX_REQUEST_SIZE) {
    throw new Error(
      "Image is too large. Please try a smaller image or compress it further."
    );
  }

  try {
    const { error } = await updateUser({
      image: base64String,
    });

    if (error) {
      throw new Error(error.message || "Failed to update profile picture");
    }

    toast.success("Profile picture updated successfully");

    startTransition(() => {
      router.refresh();
    });

    if (refetch && typeof refetch === "function") {
      try {
        await refetch();
      } catch {
        // Silently ignore refetch errors
      }
    }

    onUploadComplete?.();
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. The image might be too large or the connection timed out. Please try again with a smaller image."
        );
      }
      throw error;
    }
    throw new Error("Failed to update profile picture. Please try again.");
  }
}

function validateBase64Size(
  base64String: string,
  setIsUploadingAvatar: (value: boolean) => void,
  onUploadComplete?: () => void,
  fileInputRef?: React.RefObject<HTMLInputElement | null>
): boolean {
  if (base64String.length > MAX_BASE64_SIZE) {
    toast.error(
      `Image is too large after compression. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
    setIsUploadingAvatar(false);
    onUploadComplete?.();
    if (fileInputRef?.current) {
      fileInputRef.current.value = "";
    }
    return false;
  }
  return true;
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

    if (!validateFile(file, fileInputRef)) {
      return;
    }

    await new Promise<void>((resolve) => {
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(() => resolve(), { timeout: 50 });
      } else {
        setTimeout(() => resolve(), 0);
      }
    });

    setIsUploadingAvatar(true);
    onUploadStart?.();

    try {
      const compressedFile = await compressImage(file);

      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          const result = reader.result as string;
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Failed to read image file"));
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read image file"));
        };

        reader.readAsDataURL(compressedFile);
      });

      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 0);
      });

      if (
        !validateBase64Size(
          base64String,
          setIsUploadingAvatar,
          onUploadComplete,
          fileInputRef
        )
      ) {
        return;
      }

      startTransition(() => {
        setAvatarPreview(base64String);
      });

      try {
        await uploadAvatar(base64String, router, refetch, onUploadComplete);
      } catch (error) {
        safeClientError("Error uploading avatar:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update profile picture"
        );
        startTransition(() => {
          setAvatarPreview(session?.user?.image || null);
        });
      } finally {
        setIsUploadingAvatar(false);
      }
    } catch (error) {
      handleCompressionError(error, setIsUploadingAvatar, onUploadComplete);
    }

    resetFileInput(fileInputRef);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Label className="font-medium text-sm" htmlFor="avatar-upload">
            Profile picture
          </Label>
          <p className="text-muted-foreground text-xs">
            Maximum upload size is 5MB
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <div {...props}>
                <button
                  aria-busy={isUploadingAvatar}
                  aria-label="Change profile picture"
                  className="group relative rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Avatar className="size-10 ring-2 ring-border transition-all group-hover:ring-ring">
                    <AvatarImage
                      alt="Profile picture"
                      src={avatarPreview || undefined}
                    />
                    <AvatarFallback className="text-lg">
                      {name?.charAt(0).toUpperCase() || (
                        <IconUser className="size-6 opacity-50" />
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
                      <IconCamera className="size-4 text-white" />
                    )}
                  </div>
                </button>
              </div>
            )}
          />
          <TooltipContent align="center" side="top" sideOffset={6}>
            Change profile picture
          </TooltipContent>
        </Tooltip>
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
