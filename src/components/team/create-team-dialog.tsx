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

const IDENTIFIER_REGEX = /^[A-Z0-9]{2,6}$/;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const IDENTIFIER_DEBOUNCE_MS = 300;
const WORD_SPLIT_REGEX = /\s+/;

function generateIdentifierFromName(name: string): string {
  const words = name.trim().split(WORD_SPLIT_REGEX);
  if (words.length === 1) {
    return words[0]
      .slice(0, 4)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }
  return words
    .slice(0, 4)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

const teamSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  identifier: z
    .string()
    .min(2, "Identifier must be at least 2 characters")
    .max(6, "Identifier must be at most 6 characters")
    .regex(
      IDENTIFIER_REGEX,
      "Identifier can only contain uppercase letters and numbers"
    ),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  onSuccess?: (team: { id: string; name: string; identifier: string }) => void;
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  workspaceSlug,
  onSuccess,
}: CreateTeamDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [identifierAvailable, setIdentifierAvailable] = useState<
    boolean | null
  >(null);
  const [checkingIdentifier, setCheckingIdentifier] = useState(false);
  const identifierDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const identifierManuallyEditedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const setValueRef = useRef<
    ReturnType<typeof useForm<TeamFormData>>["setValue"] | null
  >(null);
  const resetRef = useRef<
    ReturnType<typeof useForm<TeamFormData>>["reset"] | null
  >(null);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      identifier: "",
      description: "",
    },
    mode: "onChange",
  });

  setValueRef.current = form.setValue;
  resetRef.current = form.reset;

  const identifier = form.watch("identifier");
  const name = form.watch("name");

  useEffect(() => {
    if (!open && resetRef.current) {
      resetRef.current();
      setIdentifierAvailable(null);
      setCheckingIdentifier(false);
      identifierManuallyEditedRef.current = false;
      if (identifierDebounceRef.current) {
        clearTimeout(identifierDebounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [open]);

  useEffect(() => {
    if (!identifierManuallyEditedRef.current && name && setValueRef.current) {
      const autoIdentifier = generateIdentifierFromName(name);
      if (autoIdentifier.length >= 2) {
        setValueRef.current("identifier", autoIdentifier, {
          shouldValidate: false,
        });
      } else {
        setValueRef.current("identifier", "", { shouldValidate: false });
      }
      setIdentifierAvailable(null);
    }
  }, [name]);

  useEffect(() => {
    if (!identifier || identifier.length < 2) {
      setIdentifierAvailable(null);
      setCheckingIdentifier(false);
      return;
    }

    const normalizedIdentifier = identifier.toUpperCase();
    if (!IDENTIFIER_REGEX.test(normalizedIdentifier)) {
      setIdentifierAvailable(null);
      setCheckingIdentifier(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (identifierDebounceRef.current) {
      clearTimeout(identifierDebounceRef.current);
    }

    setCheckingIdentifier(true);
    setIdentifierAvailable(null);

    abortControllerRef.current = new AbortController();

    identifierDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/team/identifier/check?identifier=${encodeURIComponent(normalizedIdentifier)}&workspaceSlug=${encodeURIComponent(workspaceSlug)}`,
          {
            signal: abortControllerRef.current?.signal,
          }
        );

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setIdentifierAvailable(data.available);
        } else {
          setIdentifierAvailable(false);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error checking identifier availability:", error);
        setIdentifierAvailable(false);
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setCheckingIdentifier(false);
        }
      }
    }, IDENTIFIER_DEBOUNCE_MS);

    return () => {
      if (identifierDebounceRef.current) {
        clearTimeout(identifierDebounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [identifier, workspaceSlug]);

  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!identifierManuallyEditedRef.current) {
      const autoIdentifier = generateIdentifierFromName(value);
      if (autoIdentifier.length >= 2) {
        form.setValue("identifier", autoIdentifier, { shouldValidate: false });
      } else {
        form.setValue("identifier", "", { shouldValidate: false });
      }
    }
  };

  const handleIdentifierChange = (value: string) => {
    form.setValue("identifier", value.toUpperCase());
    identifierManuallyEditedRef.current = true;
  };

  const validateIdentifierAvailability = useCallback(() => {
    if (!identifier || identifier.length < 2) {
      return false;
    }

    const normalizedIdentifier = identifier.toUpperCase();
    if (!IDENTIFIER_REGEX.test(normalizedIdentifier)) {
      return false;
    }

    if (checkingIdentifier) {
      toast.error("Please wait while we check identifier availability");
      return false;
    }

    if (identifierAvailable === false) {
      toast.error("This identifier is already taken. Please choose another.");
      return false;
    }

    if (identifierAvailable === null) {
      toast.error("Please wait for identifier availability check to complete");
      return false;
    }

    return true;
  }, [identifier, checkingIdentifier, identifierAvailable]);

  const onSubmit = useCallback(
    async (data: TeamFormData) => {
      if (!validateIdentifierAvailability()) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/team/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceSlug,
            name: data.name.trim(),
            identifier: data.identifier.trim().toUpperCase(),
            description: data.description?.trim() || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to create team");
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        toast.success("Team created successfully");
        onOpenChange(false);
        onSuccess?.(result.team);
      } catch (error) {
        console.error("Error creating team:", error);
        toast.error("Failed to create team");
      } finally {
        setIsLoading(false);
      }
    },
    [validateIdentifierAvailability, onOpenChange, onSuccess, workspaceSlug]
  );

  const identifierFieldState = form.getFieldState("identifier");
  const showIdentifierError =
    identifierFieldState.invalid || identifierAvailable === false;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Create a new team to organize members within your workspace.
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
                  placeholder="Engineering…"
                />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                <span>Identifier</span>
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    {...form.register("identifier")}
                    aria-invalid={showIdentifierError ? "true" : "false"}
                    className="uppercase"
                    maxLength={6}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    placeholder="ENG…"
                  />
                  {checkingIdentifier && (
                    <div className="absolute top-1/2 right-2 -translate-y-1/2">
                      <Spinner className="size-4" />
                    </div>
                  )}
                  {!checkingIdentifier && identifierAvailable === true && (
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 text-green-600 text-xs">
                      Available
                    </div>
                  )}
                </div>
                <FieldDescription>
                  A short code for your team (2-6 characters). Used in URLs and
                  mentions.
                </FieldDescription>
                <FieldError
                  errors={[
                    form.formState.errors.identifier,
                    identifierAvailable === false
                      ? { message: "This identifier is already taken" }
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
                  placeholder="A brief description of the team…"
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
              disabled={isLoading || checkingIdentifier}
              loading={isLoading}
              type="submit"
            >
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
