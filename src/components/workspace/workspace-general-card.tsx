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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const NAME_DEBOUNCE_MS = 500;
const DESCRIPTION_DEBOUNCE_MS = 500;
const SLUG_DEBOUNCE_MS = 300;
const CHECKMARK_DURATION_MS = 2500;
const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  role: "owner" | "admin" | "member";
}

function validateSlug(slug: string): string | null {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) {
    return "Slug cannot be empty";
  }
  if (!SLUG_REGEX.test(trimmed)) {
    return "Slug can only contain letters, numbers, hyphens, and underscores";
  }
  if (trimmed.length < MIN_SLUG_LENGTH || trimmed.length > MAX_SLUG_LENGTH) {
    return `Slug must be between ${MIN_SLUG_LENGTH} and ${MAX_SLUG_LENGTH} characters`;
  }
  return null;
}

function validateLogoFile(file: File): string | null {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return "Please select a valid image file (JPG, PNG, WebP, or GIF)";
  }
  if (file.size > MAX_LOGO_SIZE) {
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

function useWorkspaceNameEditing(
  initialName: string | null,
  workspaceSlug: string
) {
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

  const saveName = useCallback(
    async (nameToSave: string) => {
      setIsSaving(true);
      setShowCheckmark(false);

      try {
        const response = await fetch(`/api/workspace/${workspaceSlug}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: nameToSave }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update name");
        }

        const data = await response.json();
        if (!data.workspace) {
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
    },
    [workspaceSlug]
  );

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

function useWorkspaceDescriptionEditing(
  initialDescription: string | null,
  workspaceSlug: string
) {
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDescriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialDescription !== undefined) {
      setDescription(initialDescription || "");
      initialDescriptionRef.current = initialDescription;
    }
  }, [initialDescription]);

  const saveDescription = useCallback(
    async (descriptionToSave: string | null) => {
      setIsSaving(true);
      setShowCheckmark(false);

      try {
        const response = await fetch(`/api/workspace/${workspaceSlug}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description: descriptionToSave || "" }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update description");
        }

        const data = await response.json();
        if (!data.workspace) {
          throw new Error("Failed to update description");
        }

        initialDescriptionRef.current = descriptionToSave;
        setDescription(descriptionToSave || "");
        setShowCheckmark(true);

        if (checkmarkTimeoutRef.current) {
          clearTimeout(checkmarkTimeoutRef.current);
        }
        checkmarkTimeoutRef.current = setTimeout(() => {
          setShowCheckmark(false);
        }, CHECKMARK_DURATION_MS);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to update description"));
        setDescription(initialDescriptionRef.current || "");
      } finally {
        setIsSaving(false);
      }
    },
    [workspaceSlug]
  );

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const trimmedDescription = description.trim() || null;
    if (trimmedDescription === initialDescriptionRef.current) {
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      saveDescription(trimmedDescription);
    }, DESCRIPTION_DEBOUNCE_MS);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [description, saveDescription]);

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

  return { description, setDescription, isSaving, showCheckmark };
}

function useWorkspaceSlugEditing(
  initialSlug: string | null,
  workspaceId: string | null
) {
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugAvailability, setSlugAvailability] = useState<boolean | null>(
    null
  );
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const slugDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialSlugRef = useRef<string>("");

  useEffect(() => {
    if (initialSlug) {
      setSlug(initialSlug);
      initialSlugRef.current = initialSlug;
    }
  }, [initialSlug]);

  useEffect(() => {
    if (!isEditingSlug) {
      return;
    }

    if (slugDebounceRef.current) {
      clearTimeout(slugDebounceRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmedSlug = slug.trim().toLowerCase();
    const currentSlug = initialSlugRef.current?.toLowerCase();

    if (!trimmedSlug || trimmedSlug === currentSlug) {
      setSlugAvailability(null);
      setIsCheckingSlug(false);
      return;
    }

    if (
      !SLUG_REGEX.test(trimmedSlug) ||
      trimmedSlug.length < MIN_SLUG_LENGTH ||
      trimmedSlug.length > MAX_SLUG_LENGTH
    ) {
      setSlugAvailability(false);
      setIsCheckingSlug(false);
      return;
    }

    setIsCheckingSlug(true);
    abortControllerRef.current = new AbortController();

    slugDebounceRef.current = setTimeout(async () => {
      try {
        const url = new URL(
          "/api/workspace/slug/check",
          window.location.origin
        );
        url.searchParams.set("slug", trimmedSlug);
        if (workspaceId) {
          url.searchParams.set("excludeWorkspaceId", workspaceId);
        }

        const response = await fetch(url.toString(), {
          signal: abortControllerRef.current?.signal,
        });

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setSlugAvailability(data.available ?? false);
        } else {
          setSlugAvailability(false);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setSlugAvailability(null);
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsCheckingSlug(false);
        }
      }
    }, SLUG_DEBOUNCE_MS);

    return () => {
      if (slugDebounceRef.current) {
        clearTimeout(slugDebounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [slug, isEditingSlug, workspaceId]);

  useEffect(() => {
    return () => {
      if (slugDebounceRef.current) {
        clearTimeout(slugDebounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStartEditSlug = useCallback(() => {
    setIsEditingSlug(true);
    setSlugAvailability(null);
  }, []);

  const handleCancelEditSlug = useCallback(() => {
    setIsEditingSlug(false);
    setSlug(initialSlugRef.current);
    setSlugAvailability(null);
    setIsCheckingSlug(false);
  }, []);

  const handleSaveSlug = useCallback(async () => {
    const trimmedSlug = slug.trim().toLowerCase();
    const validationError = validateSlug(trimmedSlug);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (slugAvailability === false) {
      toast.error("Slug is not available");
      return;
    }

    setIsSavingSlug(true);

    try {
      const response = await fetch(`/api/workspace/${initialSlugRef.current}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug: trimmedSlug }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update slug");
      }

      const data = await response.json();
      if (!data.workspace) {
        throw new Error("Failed to update slug");
      }

      initialSlugRef.current = trimmedSlug;
      setSlug(trimmedSlug);
      setIsEditingSlug(false);
      setSlugAvailability(null);
      toast.success("Slug updated successfully");

      window.location.href = `/${trimmedSlug}/settings`;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update slug"));
    } finally {
      setIsSavingSlug(false);
    }
  }, [slug, slugAvailability]);

  const isSlugSaveDisabled = useMemo(
    () =>
      isSavingSlug ||
      slugAvailability === false ||
      slug.trim().toLowerCase() === initialSlugRef.current ||
      !slug.trim(),
    [isSavingSlug, slugAvailability, slug]
  );

  return {
    isEditingSlug,
    slug,
    setSlug,
    slugAvailability,
    isCheckingSlug,
    isSavingSlug,
    isSlugSaveDisabled,
    handleStartEditSlug,
    handleCancelEditSlug,
    handleSaveSlug,
  };
}

function useWorkspaceLogoUpload(
  initialLogo: string | null,
  workspaceSlug: string
) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialLogo && logoPreview) {
      setLogoPreview(null);
    }
  }, [initialLogo, logoPreview]);

  const uploadLogoFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch(`/api/workspace/${workspaceSlug}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload logo");
      }

      const data = await response.json();
      return data.imageUrl;
    },
    [workspaceSlug]
  );

  const handleLogoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleLogoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      const validationError = validateLogoFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setIsUploadingLogo(true);

      try {
        await uploadLogoFile(file);
        setLogoPreview(null);
        toast.success("Logo updated successfully");
        window.location.reload();
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to upload logo"));
        setLogoPreview(null);
      } finally {
        setIsUploadingLogo(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [uploadLogoFile]
  );

  const displayLogo = logoPreview || initialLogo;

  return {
    isUploadingLogo,
    displayLogo,
    fileInputRef,
    handleLogoClick,
    handleLogoChange,
  };
}

function LogoUploadSection({
  displayLogo,
  logoFallback,
  isUploadingLogo,
  fileInputRef,
  handleLogoClick,
  handleLogoChange,
}: {
  displayLogo: string | null;
  logoFallback: string;
  isUploadingLogo: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleLogoClick: () => void;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor="logo">Logo</Label>
      <div className="group/logo relative inline-block size-10">
        <input
          accept={ALLOWED_LOGO_TYPES.join(",")}
          className="hidden"
          disabled={isUploadingLogo}
          id="logo-upload"
          onChange={handleLogoChange}
          ref={fileInputRef}
          type="file"
        />
        <Avatar className="size-full">
          {displayLogo ? (
            <AvatarImage alt="Workspace" src={displayLogo} />
          ) : (
            <AvatarFallback className="text-lg">{logoFallback}</AvatarFallback>
          )}
        </Avatar>
        {isUploadingLogo && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <Spinner className="size-4 text-white" />
          </div>
        )}
        {!isUploadingLogo && (
          <button
            aria-label="Upload logo"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover/logo:opacity-100"
            onClick={handleLogoClick}
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
              placeholder="Enter workspace name…"
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

function SlugInputSection({
  slug,
  setSlug,
  isEditingSlug,
  isCheckingSlug,
  slugAvailability,
  isSavingSlug,
  isSlugSaveDisabled,
  isPending,
  handleStartEditSlug,
  handleCancelEditSlug,
  handleSaveSlug,
}: {
  slug: string;
  setSlug: (value: string) => void;
  isEditingSlug: boolean;
  isCheckingSlug: boolean;
  slugAvailability: boolean | null;
  isSavingSlug: boolean;
  isSlugSaveDisabled: boolean;
  isPending: boolean;
  handleStartEditSlug: () => void;
  handleCancelEditSlug: () => void;
  handleSaveSlug: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <Label
          className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"
          htmlFor="slug"
        >
          <div
            className={`flex flex-col items-start justify-start ${
              isCheckingSlug || slugAvailability !== null ? "gap-1.5" : "gap-0"
            }`}
          >
            Slug
            {isEditingSlug && (
              <div className="flex items-center text-muted-foreground text-xs sm:justify-end">
                {isCheckingSlug && <Spinner className="size-4" />}
                {!isCheckingSlug && slugAvailability === true && (
                  <span className="text-primary">Available</span>
                )}
                {!isCheckingSlug && slugAvailability === false && (
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
                className={`w-full ${isEditingSlug ? "pr-20" : "pr-10"}`}
                id="slug"
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Enter workspace slug…"
                readOnly={!isEditingSlug}
                type="text"
                value={slug}
              />
              <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
                {isEditingSlug ? (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            disabled={isSavingSlug}
                            onClick={handleCancelEditSlug}
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
                            disabled={isSlugSaveDisabled}
                            loading={isSavingSlug}
                            onClick={handleSaveSlug}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <IconDeviceFloppy />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save slug</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleStartEditSlug}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <IconPencil className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit the slug</p>
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

function DescriptionInputSection({
  description,
  setDescription,
  isSaving,
  showCheckmark,
  isPending,
}: {
  description: string;
  setDescription: (value: string) => void;
  isSaving: boolean;
  showCheckmark: boolean;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start"
        htmlFor="description"
      >
        <div className="flex flex-col gap-1">
          Description
          <span className="text-muted-foreground text-xs">
            {description.length}/{MAX_DESCRIPTION_LENGTH} characters
          </span>
        </div>
        {isPending ? (
          <Skeleton className="h-24 w-full sm:max-w-xs" />
        ) : (
          <div className="relative w-full sm:max-w-xs">
            <Textarea
              className="min-h-24 w-full resize-y pr-8"
              id="description"
              maxLength={MAX_DESCRIPTION_LENGTH}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter workspace description…"
              value={description}
            />
            {(isSaving || showCheckmark) && (
              <div className="absolute top-2.5 right-2.5 flex items-center justify-center">
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

interface WorkspaceGeneralCardProps {
  workspaceSlug: string;
}

export function WorkspaceGeneralCard({
  workspaceSlug,
}: WorkspaceGeneralCardProps) {
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(
    null
  );
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await fetch(`/api/workspace/${workspaceSlug}`);
        if (response.ok) {
          const data = await response.json();
          setWorkspaceData(data.workspace);
        }
      } catch (error) {
        console.error("Failed to fetch workspace:", error);
        toast.error("Failed to load workspace data");
      } finally {
        setIsPending(false);
      }
    };

    fetchWorkspace();
  }, [workspaceSlug]);

  const { name, setName, isSaving, showCheckmark } = useWorkspaceNameEditing(
    workspaceData?.name || null,
    workspaceSlug
  );

  const {
    description,
    setDescription,
    isSaving: isSavingDescription,
    showCheckmark: showDescriptionCheckmark,
  } = useWorkspaceDescriptionEditing(
    workspaceData?.description || null,
    workspaceSlug
  );

  const {
    isEditingSlug,
    slug,
    setSlug,
    slugAvailability,
    isCheckingSlug,
    isSavingSlug,
    isSlugSaveDisabled,
    handleStartEditSlug,
    handleCancelEditSlug,
    handleSaveSlug,
  } = useWorkspaceSlugEditing(
    workspaceData?.slug || null,
    workspaceData?.id || null
  );

  const {
    isUploadingLogo,
    displayLogo,
    fileInputRef,
    handleLogoClick,
    handleLogoChange,
  } = useWorkspaceLogoUpload(workspaceData?.logo || null, workspaceSlug);

  const logoFallback = useMemo(
    () =>
      (name || workspaceData?.name || "W")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    [name, workspaceData?.name]
  );

  if (isPending && !workspaceData) {
    return (
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your workspace information and logo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>General Information</CardTitle>
        <CardDescription>
          Update your workspace information and logo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <LogoUploadSection
            displayLogo={displayLogo}
            fileInputRef={fileInputRef}
            handleLogoChange={handleLogoChange}
            handleLogoClick={handleLogoClick}
            isUploadingLogo={isUploadingLogo}
            logoFallback={logoFallback}
          />
          <NameInputSection
            isPending={isPending}
            isSaving={isSaving}
            name={name}
            setName={setName}
            showCheckmark={showCheckmark}
          />
          <SlugInputSection
            handleCancelEditSlug={handleCancelEditSlug}
            handleSaveSlug={handleSaveSlug}
            handleStartEditSlug={handleStartEditSlug}
            isCheckingSlug={isCheckingSlug}
            isEditingSlug={isEditingSlug}
            isPending={isPending}
            isSavingSlug={isSavingSlug}
            isSlugSaveDisabled={isSlugSaveDisabled}
            setSlug={setSlug}
            slug={slug}
            slugAvailability={slugAvailability}
          />
          <DescriptionInputSection
            description={description}
            isPending={isPending}
            isSaving={isSavingDescription}
            setDescription={setDescription}
            showCheckmark={showDescriptionCheckmark}
          />
        </div>
      </CardContent>
    </Card>
  );
}
