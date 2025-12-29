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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { safeClientError } from "@/lib/client-logger";
import { WorkspaceLogo } from "./workspace-logo";

const SLUG_REGEX = /^[a-z][a-z0-9-]*$/;

const workspaceSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").trim(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 3) {
    return { valid: false, error: "Slug must be at least 3 characters" };
  }

  if (slug.length > 30) {
    return { valid: false, error: "Slug must be 30 characters or less" };
  }

  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error:
        "Must start with a letter and contain only lowercase letters, numbers, and hyphens",
    };
  }

  if (slug.endsWith("-")) {
    return { valid: false, error: "Cannot end with a hyphen" };
  }

  if (slug.includes("--")) {
    return { valid: false, error: "Cannot contain consecutive hyphens" };
  }

  return { valid: true };
}

function useSlugAvailability() {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(
    async (slug: string, currentSlug: string) => {
      if (slug === currentSlug) {
        setAvailable(true);
        setError(null);
        return;
      }

      const validation = validateSlug(slug);
      if (!validation.valid) {
        setAvailable(false);
        setError(validation.error || null);
        return;
      }

      setChecking(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/workspace/check-slug?slug=${encodeURIComponent(slug)}`
        );
        const data = await response.json();
        setAvailable(data.available);
        setError(data.error || null);
      } catch {
        setError("Failed to check availability");
        setAvailable(false);
      } finally {
        setChecking(false);
      }
    },
    []
  );

  return { checking, available, error, checkAvailability };
}

interface SlugSectionProps {
  slug: string;
  isEditingSlug: boolean;
  slugEditValue: string;
  isSavingSlug: boolean;
  slugAvailability: ReturnType<typeof useSlugAvailability>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
  error?: string;
}

function SlugSection({
  slug,
  isEditingSlug,
  slugEditValue,
  isSavingSlug,
  slugAvailability,
  onEdit,
  onCancel,
  onSave,
  onValueChange,
  error,
}: SlugSectionProps) {
  const handleSlugChange = (value: string) => {
    const newValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    onValueChange(newValue);
  };

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <Label className="font-medium text-sm" htmlFor="slug">
        Workspace URL
      </Label>
      <div className="flex w-full flex-col gap-6">
        {isEditingSlug ? (
          <>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-0">
                <span className="flex h-9 items-center rounded-l-md border border-input border-r-0 bg-muted px-3 text-muted-foreground text-sm">
                  staxk.app/
                </span>
                <Input
                  aria-describedby="slug-status"
                  aria-invalid={error ? "true" : "false"}
                  className="h-9 rounded-l-none"
                  id="slug"
                  maxLength={30}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  value={slugEditValue}
                />
              </div>
              <output
                aria-live="polite"
                className="mt-2 min-h-5"
                id="slug-status"
              >
                {slugAvailability.checking && (
                  <p className="text-muted-foreground text-xs">
                    Checking availability...
                  </p>
                )}
                {!slugAvailability.checking && error && (
                  <p className="text-destructive text-xs" role="alert">
                    {error}
                  </p>
                )}
                {!slugAvailability.checking &&
                  slugAvailability.available &&
                  !error && (
                    <p className="text-green-600 text-xs">✓ Available</p>
                  )}
              </output>
            </div>
            <div className="flex items-center justify-end gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={(props) => (
                    <div {...props}>
                      <Button
                        aria-label="Cancel editing slug"
                        disabled={isSavingSlug}
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
                        aria-label="Save slug"
                        className="h-9"
                        disabled={
                          isSavingSlug ||
                          slugAvailability.available === false ||
                          slugAvailability.checking ||
                          slugEditValue.trim().toLowerCase() ===
                            slug.toLowerCase()
                        }
                        onClick={onSave}
                        type="button"
                      >
                        {isSavingSlug ? <Spinner className="size-4" /> : "Save"}
                      </Button>
                    </div>
                  )}
                />
                <TooltipContent align="center" side="top" sideOffset={6}>
                  Save slug
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
                id="slug"
                placeholder="my-workspace"
                value={`staxk.app/${slug}`}
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
                Edit workspace URL
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

interface GeneralSettingsProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
  };
}

export function GeneralSettings({ workspace }: GeneralSettingsProps) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugEditValue, setSlugEditValue] = useState(workspace.slug);
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChangesRef = useRef(false);

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || "",
    },
    mode: "onChange",
  });

  const { watch, formState } = form;
  const watchedName = watch("name");
  const watchedDescription = watch("description");

  const slugAvailability = useSlugAvailability();

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isEditingSlug && slugEditValue !== workspace.slug) {
      const timer = setTimeout(() => {
        slugAvailability.checkAvailability(slugEditValue, workspace.slug);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [slugEditValue, workspace.slug, isEditingSlug, slugAvailability]);

  const updateName = useCallback(
    async (nameValue: string) => {
      const response = await fetch(`/api/workspace/${workspace.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update workspace name");
      }
    },
    [workspace.id]
  );

  const updateDescription = useCallback(
    async (descriptionValue: string) => {
      const response = await fetch(`/api/workspace/${workspace.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: descriptionValue || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update workspace description");
      }
    },
    [workspace.id]
  );

  const [descriptionSaveStatus, setDescriptionSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const descriptionSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedDescriptionChangesRef = useRef(false);

  const saveWorkspace = useCallback(
    async (nameValue: string, nameChanged: boolean) => {
      if (!nameValue.trim()) {
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saving");

      try {
        if (nameChanged) {
          await updateName(nameValue);
        }

        setSaveStatus("saved");
        hasUnsavedChangesRef.current = false;
        router.refresh();

        setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } catch (error) {
        safeClientError("Error updating workspace:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update workspace"
        );
        setSaveStatus("error");
      }
    },
    [router, updateName]
  );

  const saveDescription = useCallback(
    async (descriptionValue: string) => {
      setDescriptionSaveStatus("saving");

      try {
        await updateDescription(descriptionValue);

        setDescriptionSaveStatus("saved");
        hasUnsavedDescriptionChangesRef.current = false;
        router.refresh();

        setTimeout(() => {
          setDescriptionSaveStatus("idle");
        }, 2000);
      } catch (error) {
        safeClientError("Error updating description:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update description"
        );
        setDescriptionSaveStatus("error");
      }
    },
    [router, updateDescription]
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
        await saveWorkspace(currentName, true);
      }, 500);
    },
    [formState.errors.name, saveWorkspace]
  );

  const handleDescriptionChange = useCallback(
    (currentDescription: string, sessionDescription: string | null) => {
      const descriptionChanged =
        currentDescription !== (sessionDescription || "");

      if (!descriptionChanged) {
        hasUnsavedDescriptionChangesRef.current = false;
        setDescriptionSaveStatus("idle");
        return;
      }

      hasUnsavedDescriptionChangesRef.current = true;

      if (descriptionSaveTimeoutRef.current) {
        clearTimeout(descriptionSaveTimeoutRef.current);
      }

      descriptionSaveTimeoutRef.current = setTimeout(async () => {
        await saveDescription(currentDescription);
      }, 500);
    },
    [saveDescription]
  );

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const currentName = watchedName?.trim() || "";
    const sessionName = workspace.name || "";
    handleNameChange(currentName, sessionName);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [watchedName, workspace.name, isInitialized, handleNameChange]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const currentDescription = watchedDescription?.trim() || "";
    const sessionDescription = workspace.description || "";
    handleDescriptionChange(currentDescription, sessionDescription);

    return () => {
      if (descriptionSaveTimeoutRef.current) {
        clearTimeout(descriptionSaveTimeoutRef.current);
      }
    };
  }, [
    watchedDescription,
    workspace.description,
    isInitialized,
    handleDescriptionChange,
  ]);

  const handleEditSlug = () => {
    setSlugEditValue(workspace.slug);
    setIsEditingSlug(true);
  };

  const handleCancelSlugEdit = () => {
    setSlugEditValue(workspace.slug);
    setIsEditingSlug(false);
    slugAvailability.checkAvailability(workspace.slug, workspace.slug);
  };

  const validateSlugBeforeSave = (trimmedSlug: string): boolean => {
    if (trimmedSlug === workspace.slug) {
      setIsEditingSlug(false);
      return false;
    }

    const validation = validateSlug(trimmedSlug);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid slug");
      return false;
    }

    if (!slugAvailability.available) {
      toast.error("Please fix the slug errors before saving");
      return false;
    }

    return true;
  };

  const handleSaveSlug = async () => {
    const trimmedSlug = slugEditValue.trim().toLowerCase();

    if (!validateSlugBeforeSave(trimmedSlug)) {
      return;
    }

    setIsSavingSlug(true);

    try {
      const response = await fetch(`/api/workspace/${workspace.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: trimmedSlug }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update workspace slug");
      }

      toast.success("Workspace URL updated");
      setIsEditingSlug(false);
      router.push(`/${data.slug}/settings/general`);
    } catch (error) {
      safeClientError("Error updating slug:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update workspace slug"
      );
    } finally {
      setIsSavingSlug(false);
    }
  };

  if (!isInitialized) {
    return null;
  }

  const nameError = formState.errors.name?.message;
  const descriptionError = formState.errors.description?.message;
  const slugError = isEditingSlug ? slugAvailability.error : undefined;

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div>
        <h1 className="font-medium text-xl">General</h1>
      </div>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <WorkspaceLogo
            currentLogo={workspace.logo}
            workspaceId={workspace.id}
            workspaceName={workspace.name}
          />
          <div className="flex w-full flex-col items-start">
            <div className="flex items-center gap-2">
              <Label className="pb-2 font-medium text-sm" htmlFor="name">
                Workspace name
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
                placeholder="e.g. My Workspace"
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
          <div className="flex w-full flex-col items-start">
            <div className="flex items-center gap-2">
              <Label className="pb-2 font-medium text-sm" htmlFor="description">
                Description
              </Label>
              {descriptionSaveStatus === "saving" && (
                <Loader2
                  aria-hidden="true"
                  className="mb-2 size-3.5 animate-spin text-muted-foreground"
                />
              )}
              {descriptionSaveStatus === "saved" && (
                <CheckCircle2
                  aria-hidden="true"
                  className="mb-2 size-3.5 text-green-600 dark:text-green-500"
                />
              )}
            </div>
            <div className="w-full">
              <Textarea
                id="description"
                {...form.register("description")}
                aria-describedby={
                  descriptionError ? "description-error" : "description-helper"
                }
                aria-invalid={descriptionError ? "true" : "false"}
                className="min-h-[80px]"
                maxLength={500}
                placeholder="Describe your workspace (optional)"
                rows={3}
              />
              {descriptionError ? (
                <p
                  className="mt-2 text-destructive text-xs"
                  id="description-error"
                  role="alert"
                >
                  {descriptionError}
                </p>
              ) : (
                <p
                  className="mt-2 text-muted-foreground text-xs"
                  id="description-helper"
                >
                  Changes save automatically
                </p>
              )}
            </div>
          </div>
          <SlugSection
            error={slugError ?? undefined}
            isEditingSlug={isEditingSlug}
            isSavingSlug={isSavingSlug}
            onCancel={handleCancelSlugEdit}
            onEdit={handleEditSlug}
            onSave={handleSaveSlug}
            onValueChange={setSlugEditValue}
            slug={workspace.slug}
            slugAvailability={slugAvailability}
            slugEditValue={slugEditValue}
          />
        </CardContent>
      </Card>
    </div>
  );
}
