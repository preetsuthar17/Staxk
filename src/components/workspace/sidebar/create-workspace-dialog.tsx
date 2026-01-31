"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const SLUG_DEBOUNCE_MS = 300;

function generateSlugFromName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

const workspaceSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  slug: z
    .string()
    .min(MIN_SLUG_LENGTH, `Slug must be at least ${MIN_SLUG_LENGTH} characters`)
    .max(MAX_SLUG_LENGTH, `Slug must be at most ${MAX_SLUG_LENGTH} characters`)
    .regex(
      SLUG_REGEX,
      "Slug can only contain letters, numbers, hyphens, and underscores"
    ),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (workspace: { id: string; name: string; slug: string }) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const slugManuallyEditedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const setValueRef = useRef<
    ReturnType<typeof useForm<WorkspaceFormData>>["setValue"] | null
  >(null);
  const resetRef = useRef<
    ReturnType<typeof useForm<WorkspaceFormData>>["reset"] | null
  >(null);

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
    mode: "onChange",
  });

  setValueRef.current = form.setValue;
  resetRef.current = form.reset;

  const slug = form.watch("slug");
  const name = form.watch("name");

  useEffect(() => {
    if (!open && resetRef.current) {
      resetRef.current();
      setSlugAvailable(null);
      setCheckingSlug(false);
      slugManuallyEditedRef.current = false;
      if (slugDebounceRef.current) {
        clearTimeout(slugDebounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [open]);

  useEffect(() => {
    if (!slugManuallyEditedRef.current && name && setValueRef.current) {
      const autoSlug = generateSlugFromName(name);
      if (autoSlug.length >= MIN_SLUG_LENGTH) {
        setValueRef.current("slug", autoSlug, { shouldValidate: false });
      } else {
        setValueRef.current("slug", "", { shouldValidate: false });
      }
      setSlugAvailable(null);
    }
  }, [name]);

  useEffect(() => {
    if (!slug || slug.length < MIN_SLUG_LENGTH) {
      setSlugAvailable(null);
      setCheckingSlug(false);
      return;
    }

    if (!SLUG_REGEX.test(slug)) {
      setSlugAvailable(null);
      setCheckingSlug(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (slugDebounceRef.current) {
      clearTimeout(slugDebounceRef.current);
    }

    setCheckingSlug(true);
    setSlugAvailable(null);

    abortControllerRef.current = new AbortController();

    slugDebounceRef.current = setTimeout(async () => {
      try {
        const normalizedSlug = slug.trim().toLowerCase();
        const response = await fetch(
          `/api/workspace/slug/check?slug=${encodeURIComponent(normalizedSlug)}`,
          {
            signal: abortControllerRef.current?.signal,
          }
        );

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setSlugAvailable(data.available);
        } else {
          setSlugAvailable(false);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error checking slug availability:", error);
        setSlugAvailable(false);
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setCheckingSlug(false);
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
  }, [slug]);

  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!slugManuallyEditedRef.current) {
      const autoSlug = generateSlugFromName(value);
      if (autoSlug.length >= MIN_SLUG_LENGTH) {
        form.setValue("slug", autoSlug, { shouldValidate: false });
      } else {
        form.setValue("slug", "", { shouldValidate: false });
      }
    }
  };

  const handleSlugChange = (value: string) => {
    form.setValue("slug", value);
    slugManuallyEditedRef.current = true;
  };

  const validateSlugAvailability = useCallback(() => {
    if (!slug || slug.length < MIN_SLUG_LENGTH) {
      return false;
    }

    if (!SLUG_REGEX.test(slug)) {
      return false;
    }

    if (checkingSlug) {
      toast.error("Please wait while we check slug availability");
      return false;
    }

    if (slugAvailable === false) {
      toast.error("This slug is already taken. Please choose another.");
      return false;
    }

    if (slugAvailable === null) {
      toast.error("Please wait for slug availability check to complete");
      return false;
    }

    return true;
  }, [slug, checkingSlug, slugAvailable]);

  const onSubmit = useCallback(
    async (data: WorkspaceFormData) => {
      if (!validateSlugAvailability()) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/workspace/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name.trim(),
            slug: data.slug.trim().toLowerCase(),
            description: data.description?.trim() || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to create workspace");
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        toast.success("Workspace created successfully");
        onOpenChange(false);
        onSuccess?.(result.workspace);
      } catch (error) {
        console.error("Error creating workspace:", error);
        toast.error("Failed to create workspace");
      } finally {
        setIsLoading(false);
      }
    },
    [validateSlugAvailability, onOpenChange, onSuccess]
  );

  const slugFieldState = form.getFieldState("slug");
  const showSlugError = slugFieldState.invalid || slugAvailable === false;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your projects and collaborate
            with your team.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Field>
              <FieldLabel>
                <span>Name</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("name")}
                  aria-invalid={form.formState.errors.name ? "true" : "false"}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="My Workspace…"
                />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                <span>Slug</span>
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    {...form.register("slug")}
                    aria-invalid={showSlugError ? "true" : "false"}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="my-workspace…"
                  />
                  {checkingSlug && (
                    <div className="absolute top-1/2 right-2 -translate-y-1/2">
                      <Spinner className="size-4" />
                    </div>
                  )}
                  {!checkingSlug && slugAvailable === true && (
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 text-green-600 text-xs">
                      Available
                    </div>
                  )}
                </div>
                <FieldDescription>
                  A unique identifier for your workspace. This will be used in
                  the URL.
                </FieldDescription>
                <FieldError
                  errors={[
                    form.formState.errors.slug,
                    slugAvailable === false
                      ? { message: "This slug is already taken" }
                      : undefined,
                  ]}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                <span>Description</span>
                <span className="font-normal text-muted-foreground">
                  {" "}
                  (optional)
                </span>
              </FieldLabel>
              <FieldContent>
                <Textarea
                  {...form.register("description")}
                  aria-invalid={
                    form.formState.errors.description ? "true" : "false"
                  }
                  placeholder="A brief description of your workspace…"
                  rows={3}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isLoading || checkingSlug}
              loading={isLoading}
              type="submit"
            >
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
